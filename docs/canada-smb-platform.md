# Canada SMB AI Operating Platform

## Product intent

A Canada-first, vendor-neutral AI operating platform for small and medium businesses. It helps owners and operators improve how the business runs using practical tools, digital workers, workforce intelligence, downloadable assets and expert implementation support.

The product is not a SuccessFactors extension, enterprise HR transformation suite, or clone of an existing HR consultancy offering.

## Target customer

Initial focus: Canadian SMBs, especially 10-250 employees, with expansion capability to other regions through a country/region configuration layer.

Primary users:
- founder / owner
- COO / operations leader
- HR / people leader
- finance / project leader
- small leadership team

## Product principles

1. Canada-first, globally extensible.
2. SMB-first and outcome-led.
3. Vendor-neutral; no HRIS is required.
4. Human + AI workforce design.
5. Self-service by default, expert services when implementation is required.
6. Measurable value before broad automation.
7. Human approval for material financial, legal, people or customer decisions.
8. No customer data used to train proprietary models by default.
9. Canadian primary hosting and storage where the selected infrastructure supports it; cross-border subprocessors must be disclosed and controlled.
10. Build validated tools before expanding the marketplace catalogue.

## Storefronts

### Run My Business
- AI Opportunity Diagnostic
- Business Case Builder
- Process / Automation Analyzer

### Projects & Profit
- Project Margin Analyzer
- Scope Creep Detector
- SOW / Project Risk Review
- Executive Project Brief

### People & Workforce
- Workforce Architecture / Workforce Designer
- Job Description Builder
- Skills & Competency Builder
- Human + AI Workforce Analyzer

### Agents
- Operations Agent
- Project Assurance Agent
- Customer Success Agent
- Governance Agent
- future specialist digital workers

### Downloads
- prompts
- templates
- playbooks
- checklists
- calculators
- implementation kits

### Learn & Community
- practical SMB AI learning
- walkthroughs and implementation guides
- peer discussions and use cases
- later: curated sponsorship and marketplace participation

## Commercial architecture

Free -> Pro SMB -> Business -> Expert Services.

Revenue mechanisms may include subscriptions, credits, pay-per-use tools, digital downloads, managed agents, implementation services, premium workforce tools and later marketplace revenue share.

## First build milestone

1. Platform shell and outcome-led storefront.
2. AI Opportunity Diagnostic end-to-end.
3. Project Margin Analyzer.
4. Human + AI Workforce Designer integration.
5. Job Description Builder.
6. Business Workspace persistence.
7. Credit / usage ledger.
8. Agent registry, jobs, approvals and audit log.

## Technical guardrails

- Keep secrets server-side only.
- Use `OPENAI_API_KEY` from runtime environment; never commit credentials.
- Every AI tool needs a deterministic or understandable failure path.
- Log tool execution status and errors without logging sensitive prompt payloads by default.
- Treat an agent as a job with tools, permissions, state, cost limits, escalation and auditability; do not label a simple one-shot generation call as a background agent.
- Do not merge to `main` unless platform and API typechecks/builds pass.

## Working branch

`build/canada-smb-platform`

## Current working brand

`Northstar AI` is a temporary internal storefront label only. A final brand requires separate naming, domain and legal review before public launch.
