# Canada-first SMB AI Platform — Launch Readiness

## Product boundary
- Primary market: Canadian small and medium businesses; initial sweet spot 10–250 employees, supported ceiling 499.
- Vendor-neutral whole-business AI + workforce platform. Not a SAP SuccessFactors extension and not positioned as a lower-cost clone of enterprise HR suites.
- Workforce Architecture remains a premium module inside the wider platform.
- B2B expert services and managed agents are optional extensions, not prerequisites for self-service use.

## Current launch slice
- Outcome-led storefront.
- Business Workspace with local beta storage plus authenticated server synchronisation contract.
- AI Opportunity Diagnostic with OpenAI-backed server route and deterministic fallback.
- Project Margin Analyzer with server-side calculation contract.
- Workforce Architecture integration.
- Credit-based commercial model with beta price hypotheses; billing intentionally disabled.
- Multi-tenant database schema covering tenants, memberships, workspaces, tool runs, wallets, agents, jobs and audit events.
- Agent Control Centre with permissions, cost limits, job queue and human approval workflow.
- Canada-first region configuration with future global region layer.

## Security and privacy guardrails
- API keys are server-side only and must never be committed to Git.
- Tenant data access must be resolved through authenticated membership before reads/writes.
- Material actions, external communications and financial/commercial commitments default to human approval.
- Customer data must not be used for model training by default.
- Canadian primary database/storage deployment must be selected before production launch; code-level `dataRegion=canada` is configuration intent, not proof of residency.
- Any AI/subprocessor that can move data outside Canada must be disclosed and assessed before production use.
- Audit events are required for tenant bootstrap, workspace changes, agent changes, job creation and approval decisions.

## Commercial readiness gates
Billing remains disabled until all are true:
1. Canadian corporation/payment account is ready.
2. GST/HST and sales-tax handling is confirmed for target provinces and cross-border sales.
3. Refund/credit reversal policy is approved.
4. Terms of Service, Privacy Notice and subprocessor list are published.
5. Price hypotheses have been tested with real SMB prospects.

## Production infrastructure gates
1. Provision PostgreSQL in an approved Canadian region.
2. Set `DATABASE_URL`, Clerk credentials and `OPENAI_API_KEY` through the host secret manager.
3. Apply Drizzle schema to the production database.
4. Configure backup, restore, retention and deletion procedures.
5. Enable production observability for request errors, agent jobs, approval events and AI spend.
6. Rate-limit public AI endpoints and enforce tenant/user quotas.
7. Configure a queue/worker runtime before enabling scheduled or background agents.
8. Verify model/subprocessor regional processing settings and publish the resulting data-flow statement.

## Agent definition of done
An agent cannot be considered production-enabled until it has:
- one bounded purpose;
- explicit trigger;
- least-privilege permissions;
- approval mode;
- tenant cost limit;
- auditable jobs and outcomes;
- retry/failure behaviour;
- human escalation owner;
- evaluation cases for expected and forbidden behaviour.

The current build provides the registry, job and approval contracts. Scheduled/background execution remains disabled until a production queue/worker and monitoring layer are provisioned.

## Merge gate for this PR
Do not merge to `main` until:
- CI typecheck and build are green;
- no secret values are present in changed files;
- the storefront, Opportunity Diagnostic, Margin Analyzer, Workforce module, Agent Control Centre and Plans/Credits render successfully in the deployed preview/environment;
- production-only claims (Canadian residency, billing, continuous agents) remain disabled or clearly labelled until verified.
