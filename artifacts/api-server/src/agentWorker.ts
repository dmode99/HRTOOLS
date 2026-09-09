import { and, asc, eq } from "drizzle-orm";
import { db, agentDefinitions, agentJobs, auditEvents } from "@workspace/db";
import { logger } from "./lib/logger";

const POLL_MS = Math.max(5_000, Number(process.env.AGENT_WORKER_POLL_MS || 10_000));
const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

function extractOutputText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text;
  const chunks: string[] = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content?.text === "string") chunks.push(content.text);
    }
  }
  return chunks.join("\n");
}

async function runAnalyticalAgent(purpose: string, permissions: string[], task: string, payload: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      mode: "no-model",
      summary: "The job was accepted but no OpenAI API key is available in this worker runtime.",
      task,
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      instructions: [
        "You are a bounded analytical worker for a small-business operating platform.",
        `Purpose: ${purpose}`,
        `Declared permissions: ${permissions.join(", ") || "none"}.`,
        "You have no external communication, payment, contract, destructive, or system-write tools in this worker.",
        "Return useful analysis only. Clearly identify assumptions and missing evidence. Never claim that a material action was taken.",
      ].join("\n"),
      input: `Task: ${task}\nContext payload: ${JSON.stringify(payload)}`,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`OpenAI worker request failed: ${response.status}`);
  const body = await response.json();
  return { mode: "openai", text: extractOutputText(body), responseId: body?.id, model: body?.model || MODEL };
}

async function processOneJob() {
  const [job] = await db.select().from(agentJobs)
    .where(and(eq(agentJobs.status, "queued"), eq(agentJobs.approvalStatus, "not-required")))
    .orderBy(asc(agentJobs.createdAt)).limit(1);

  const [approvedJob] = job ? [job] : await db.select().from(agentJobs)
    .where(and(eq(agentJobs.status, "queued"), eq(agentJobs.approvalStatus, "approved")))
    .orderBy(asc(agentJobs.createdAt)).limit(1);
  const selected = job || approvedJob;
  if (!selected) return false;

  const [claimed] = await db.update(agentJobs).set({ status: "running", startedAt: new Date() })
    .where(and(eq(agentJobs.id, selected.id), eq(agentJobs.status, "queued"))).returning();
  if (!claimed) return true;

  const [agent] = await db.select().from(agentDefinitions).where(eq(agentDefinitions.id, claimed.agentId)).limit(1);
  if (!agent || !agent.enabled) {
    await db.update(agentJobs).set({ status: "cancelled", completedAt: new Date(), result: { error: "Agent disabled or missing" } }).where(eq(agentJobs.id, claimed.id));
    return true;
  }

  try {
    const result = await runAnalyticalAgent(agent.purpose, agent.permissions, claimed.task, (claimed.payload || {}) as Record<string, unknown>);
    await db.update(agentJobs).set({ status: "completed", result, completedAt: new Date() }).where(eq(agentJobs.id, claimed.id));
    await db.insert(auditEvents).values({ tenantId: claimed.tenantId, actorType: "agent", actorId: agent.id, action: "agent.job.completed", resourceType: "agent-job", resourceId: claimed.id, metadata: { agentKey: agent.key, mode: result.mode } });
    logger.info({ jobId: claimed.id, agent: agent.key }, "agent job completed");
  } catch (error) {
    await db.update(agentJobs).set({ status: "failed", completedAt: new Date(), result: { error: error instanceof Error ? error.message : "unknown worker error" } }).where(eq(agentJobs.id, claimed.id));
    await db.insert(auditEvents).values({ tenantId: claimed.tenantId, actorType: "agent", actorId: agent.id, action: "agent.job.failed", resourceType: "agent-job", resourceId: claimed.id });
    logger.error({ err: error, jobId: claimed.id }, "agent job failed");
  }
  return true;
}

async function tick() {
  try {
    let processed = 0;
    while (processed < 5 && await processOneJob()) processed += 1;
  } catch (error) {
    logger.error({ err: error }, "agent worker tick failed");
  }
}

logger.info({ pollMs: POLL_MS }, "agent worker started");
void tick();
setInterval(() => void tick(), POLL_MS);
