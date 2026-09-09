import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  tenants,
  tenantMemberships,
  businessWorkspaces,
  creditWallets,
  agentDefinitions,
  agentJobs,
  auditEvents,
} from "@workspace/db";

const router: IRouter = Router();

const starterAgents = [
  { key: "operations", name: "Operations Agent", purpose: "Analyse repeatable operating workflows and prepare bounded improvement actions.", triggerType: "manual", permissions: ["workspace:read", "tool-runs:read"], approvalMode: "material-actions" },
  { key: "project-assurance", name: "Project Assurance Agent", purpose: "Review project economics, scope signals and delivery risk for management attention.", triggerType: "manual", permissions: ["workspace:read", "projects:read"], approvalMode: "material-actions" },
  { key: "customer-success", name: "Customer Success Agent", purpose: "Prepare customer follow-up and identify unresolved actions without sending externally by default.", triggerType: "manual", permissions: ["workspace:read", "customer-data:read"], approvalMode: "external-communications" },
  { key: "governance", name: "Governance Agent", purpose: "Check agent permissions, evidence, privacy controls and approval requirements.", triggerType: "scheduled", permissions: ["audit:read", "agents:read"], approvalMode: "always-review" },
];

async function resolveTenant(userId: string) {
  const [membership] = await db.select().from(tenantMemberships).where(eq(tenantMemberships.userId, userId)).limit(1);
  if (!membership) return null;
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, membership.tenantId)).limit(1);
  return tenant ? { tenant, membership } : null;
}

router.post("/platform/bootstrap", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "authentication required" });

  let resolved = await resolveTenant(userId);
  if (!resolved) {
    const companyName = String(req.body?.companyName || "My Business").trim().slice(0, 120);
    const slugBase = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business";
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    await db.transaction(async (tx) => {
      const [tenant] = await tx.insert(tenants).values({ name: companyName, slug, countryCode: "CA", dataRegion: "canada", currency: "CAD", plan: "free" }).returning();
      await tx.insert(tenantMemberships).values({ tenantId: tenant.id, userId, role: "owner" });
      await tx.insert(businessWorkspaces).values({ tenantId: tenant.id, name: companyName, locations: ["Canada"] });
      await tx.insert(creditWallets).values({ tenantId: tenant.id, balance: 25, monthlyAllowance: 25, spendingLimit: 25 });
      await tx.insert(agentDefinitions).values(starterAgents.map((agent) => ({ ...agent, tenantId: tenant.id, enabled: false, monthlyCostLimitCad: "25" })));
      await tx.insert(auditEvents).values({ tenantId: tenant.id, actorType: "user", actorId: userId, action: "tenant.bootstrap", resourceType: "tenant", resourceId: tenant.id });
    });
    resolved = await resolveTenant(userId);
  }

  if (!resolved) return res.status(500).json({ error: "tenant bootstrap failed" });

  const [workspace] = await db.select().from(businessWorkspaces).where(eq(businessWorkspaces.tenantId, resolved.tenant.id)).limit(1);
  const [wallet] = await db.select().from(creditWallets).where(eq(creditWallets.tenantId, resolved.tenant.id)).limit(1);
  const agents = await db.select().from(agentDefinitions).where(eq(agentDefinitions.tenantId, resolved.tenant.id));

  return res.json({ tenant: resolved.tenant, workspace, wallet, agents });
});

router.patch("/platform/workspace/:workspaceId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "authentication required" });
  const resolved = await resolveTenant(userId);
  if (!resolved) return res.status(404).json({ error: "tenant not found" });

  const allowed = {
    name: req.body?.name ? String(req.body.name).slice(0, 120) : undefined,
    industry: req.body?.industry !== undefined ? String(req.body.industry).slice(0, 120) : undefined,
    employeeBand: req.body?.employeeBand !== undefined ? String(req.body.employeeBand).slice(0, 50) : undefined,
    locations: Array.isArray(req.body?.locations) ? req.body.locations.map(String).slice(0, 20) : undefined,
    strategy: req.body?.strategy !== undefined ? String(req.body.strategy).slice(0, 8000) : undefined,
    goals: Array.isArray(req.body?.goals) ? req.body.goals.map(String).slice(0, 30) : undefined,
    communicationStyle: req.body?.communicationStyle !== undefined ? String(req.body.communicationStyle).slice(0, 1000) : undefined,
    updatedAt: new Date(),
  };
  const values = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined));

  const [workspace] = await db.update(businessWorkspaces)
    .set(values)
    .where(and(eq(businessWorkspaces.id, req.params.workspaceId), eq(businessWorkspaces.tenantId, resolved.tenant.id)))
    .returning();
  if (!workspace) return res.status(404).json({ error: "workspace not found" });
  await db.insert(auditEvents).values({ tenantId: resolved.tenant.id, actorType: "user", actorId: userId, action: "workspace.update", resourceType: "workspace", resourceId: workspace.id });
  return res.json({ workspace });
});

router.get("/platform/agents", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "authentication required" });
  const resolved = await resolveTenant(userId);
  if (!resolved) return res.status(404).json({ error: "tenant not found" });
  const agents = await db.select().from(agentDefinitions).where(eq(agentDefinitions.tenantId, resolved.tenant.id));
  const jobs = await db.select().from(agentJobs).where(eq(agentJobs.tenantId, resolved.tenant.id)).orderBy(desc(agentJobs.createdAt)).limit(50);
  return res.json({ agents, jobs });
});

router.patch("/platform/agents/:agentId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "authentication required" });
  const resolved = await resolveTenant(userId);
  if (!resolved) return res.status(404).json({ error: "tenant not found" });
  const [agent] = await db.update(agentDefinitions).set({
    enabled: req.body?.enabled === undefined ? undefined : Boolean(req.body.enabled),
    monthlyCostLimitCad: req.body?.monthlyCostLimitCad === undefined ? undefined : String(Math.max(0, Number(req.body.monthlyCostLimitCad) || 0)),
    updatedAt: new Date(),
  }).where(and(eq(agentDefinitions.id, req.params.agentId), eq(agentDefinitions.tenantId, resolved.tenant.id))).returning();
  if (!agent) return res.status(404).json({ error: "agent not found" });
  await db.insert(auditEvents).values({ tenantId: resolved.tenant.id, actorType: "user", actorId: userId, action: "agent.update", resourceType: "agent", resourceId: agent.id, metadata: { enabled: agent.enabled } });
  return res.json({ agent });
});

router.post("/platform/agents/:agentId/jobs", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "authentication required" });
  const resolved = await resolveTenant(userId);
  if (!resolved) return res.status(404).json({ error: "tenant not found" });
  const [agent] = await db.select().from(agentDefinitions).where(and(eq(agentDefinitions.id, req.params.agentId), eq(agentDefinitions.tenantId, resolved.tenant.id))).limit(1);
  if (!agent) return res.status(404).json({ error: "agent not found" });
  if (!agent.enabled) return res.status(409).json({ error: "agent is disabled" });

  const task = String(req.body?.task || "").trim().slice(0, 4000);
  if (!task) return res.status(400).json({ error: "task is required" });
  const approvalRequired = Boolean(req.body?.materialAction) || agent.approvalMode === "always-review" || agent.approvalMode === "external-communications";
  const [job] = await db.insert(agentJobs).values({
    tenantId: resolved.tenant.id,
    agentId: agent.id,
    task,
    payload: req.body?.payload && typeof req.body.payload === "object" ? req.body.payload : {},
    status: approvalRequired ? "waiting-approval" : "queued",
    approvalRequired,
    approvalStatus: approvalRequired ? "pending" : "not-required",
  }).returning();
  await db.insert(auditEvents).values({ tenantId: resolved.tenant.id, actorType: "user", actorId: userId, action: "agent.job.create", resourceType: "agent-job", resourceId: job.id, metadata: { agentId: agent.id, approvalRequired } });
  return res.status(201).json({ job });
});

router.post("/platform/jobs/:jobId/approve", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: "authentication required" });
  const resolved = await resolveTenant(userId);
  if (!resolved) return res.status(404).json({ error: "tenant not found" });
  const decision = req.body?.decision === "reject" ? "rejected" : "approved";
  const [job] = await db.update(agentJobs).set({ approvalStatus: decision, status: decision === "approved" ? "queued" : "cancelled" })
    .where(and(eq(agentJobs.id, req.params.jobId), eq(agentJobs.tenantId, resolved.tenant.id), eq(agentJobs.approvalStatus, "pending"))).returning();
  if (!job) return res.status(404).json({ error: "pending job not found" });
  await db.insert(auditEvents).values({ tenantId: resolved.tenant.id, actorType: "user", actorId: userId, action: `agent.job.${decision}`, resourceType: "agent-job", resourceId: job.id });
  return res.json({ job });
});

export default router;
