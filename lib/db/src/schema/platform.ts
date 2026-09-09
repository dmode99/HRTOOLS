import { pgTable, text, timestamp, integer, boolean, jsonb, numeric, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  countryCode: text("country_code").notNull().default("CA"),
  dataRegion: text("data_region").notNull().default("canada"),
  currency: text("currency").notNull().default("CAD"),
  plan: text("plan").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ slugIdx: uniqueIndex("tenants_slug_idx").on(table.slug) }));

export const businessWorkspaces = pgTable("business_workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  industry: text("industry"),
  employeeBand: text("employee_band"),
  locations: jsonb("locations").$type<string[]>().notNull().default([]),
  strategy: text("strategy"),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  terminology: jsonb("terminology").$type<Record<string, string>>().notNull().default({}),
  communicationStyle: text("communication_style"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const toolRuns = pgTable("tool_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").references(() => businessWorkspaces.id, { onDelete: "set null" }),
  toolKey: text("tool_key").notNull(),
  status: text("status").notNull().default("queued"),
  input: jsonb("input").$type<Record<string, unknown>>().notNull().default({}),
  output: jsonb("output").$type<Record<string, unknown>>(),
  creditsUsed: integer("credits_used").notNull().default(0),
  costCad: numeric("cost_cad", { precision: 12, scale: 4 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const agentDefinitions = pgTable("agent_definitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  name: text("name").notNull(),
  purpose: text("purpose").notNull(),
  triggerType: text("trigger_type").notNull().default("manual"),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  approvalMode: text("approval_mode").notNull().default("material-actions"),
  monthlyCostLimitCad: numeric("monthly_cost_limit_cad", { precision: 12, scale: 2 }).notNull().default("25"),
  enabled: boolean("enabled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ tenantKeyIdx: uniqueIndex("agent_definitions_tenant_key_idx").on(table.tenantId, table.key) }));

export const agentJobs = pgTable("agent_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id").notNull().references(() => agentDefinitions.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("queued"),
  task: text("task").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  result: jsonb("result").$type<Record<string, unknown>>(),
  approvalRequired: boolean("approval_required").notNull().default(false),
  approvalStatus: text("approval_status").notNull().default("not-required"),
  costCad: numeric("cost_cad", { precision: 12, scale: 4 }).notNull().default("0"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  actorType: text("actor_type").notNull(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creditWallets = pgTable("credit_wallets", {
  tenantId: uuid("tenant_id").primaryKey().references(() => tenants.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(25),
  monthlyAllowance: integer("monthly_allowance").notNull().default(25),
  spendingLimit: integer("spending_limit").notNull().default(25),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
