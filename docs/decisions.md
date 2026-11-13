# Decisions

What's settled, with the date and why. This is the project's long-term memory: when a conversation settles something that should outlive it, it goes here. To reverse a decision, add a new dated entry rather than deleting the old one.

## Workflow
- 2026-11-13: Orchestrator (main session, Opus, xhigh effort) plus Haiku workers (builder, reviewer; built-in agents forced to Haiku). Why: bulk work is cheap on Haiku and verification stays with the orchestrator. Source: murphmaxxing.com/vault/omega-agent-orchestration.
- 2026-11-13: Retired GOALS, ROADMAP, PLANS, TASKS, NEXT and MAPS for CLAUDE.md plus docs/. Why: six overlapping files with stale instructions (they still pointed at `sendrow-v2`). Stable product decisions moved here; changing plans live in progress.md.

## Product (the stable core of the old GOALS.md)
- Sendrow is the system of record for supplier emissions data, operated through consultants: collected once, evidence attached, shared out in whatever format the recipient asks for.
- 2026-07-21: Consultants are the only paying customer. Not a managed service, not direct-to-company. Suppliers always respond free. Buyers are 2027+.
- Suppliers are never scored or graded. Trust labels describe the verification status of data ("self-reported", "consultant-reviewed", "assured"), never the company.
- Never replace the consultant. Sendrow is the tool both sides use together.
- The supplier owns their data and can export it anytime. Why: being able to leave is why they trust us.
- Only frozen, dated, approved snapshots leave the system. Corrections create a new snapshot and alert every recipient of the old one.
- Output formats are config, never code. `if (format === "CDP")` is a stop-the-line violation.
- Supplier-confirmed parsing: software suggests a mapping, the supplier confirms it. Target 80% automated decoding, not 100%.
- 2026-07-10: Vendor memory is workspace-scoped. Cross-platform suggestions are later, for privacy.
- Requests, portal pages, reminders and deliverables carry the consultant's brand, never Sendrow's.
- 2026-07-21: Pricing is deferred until discovery shows consultants need this. The per-client-slot model in git history is a model, not a decision.
- House style: no emojis and no em dashes in UI or copy.

## Not building (until deliberately revisited)
AI suggestions; buyer features (2027); QuickBooks or utility integrations; peer benchmarking or any cross-client data use; EPR module; referral-routing software (Masao's spreadsheet; `/admin/referrals` frozen as is); scoring suppliers; managed service; direct-to-company self-serve (lives on `sendrow-v1`); enterprise SSO; in-app newsletter; third-party analytics or ad pixels; blockchain traceability; international expansion; ML on the dataset.

## Build decisions
- 2026-11-13: Client-facing surfaces (portal, shared results page, PDF report) carry the consultant's brand plus a "Powered by Sendrow" footer. Reverses the "never Sendrow's brand" part of invariant 11. Why: Malachi's call.
- 2026-11-13: QuickBooks and utility-connection code removed (no route ever set them "connected", so it was dead and it blocked report generation). The DB columns and tables (`qb_*`, `utility_*`, `qb_transactions`, `utility_data`, `invite_tokens`) stay until a prod data check; dropping them needs Malachi's explicit OK because the build's schema push would delete them.
- 2026-11-13: Pricing and billing code (pricing calculator, `/pricing/agency`, Stripe "company" plan, billing portal route) left as is for now.
- 2026-10-20: `/pricing` redirects to `/for-consultants` instead of being deleted, so inbound links don't 404.
- 2026-09-10: Waitlist and engagement tracking live in the product (`waitlist_signups`, `marketing_events`, `/admin/waitlist`), with no third-party analytics.
- 2026-09-02: Row-level security shelved, not abandoned. The `neon-http` driver has no transactions, so RLS needs a full move to `neon-serverless` + `Pool`. Hold until there are more consultants; app-layer `ownsClient()` plus `test/separation.test.ts` is the safety net meanwhile.
- 2026-07-23: Pipeline board (Y1) reverted to the table dashboard (Malachi's call).
- Payment gate is disabled in `middleware.ts` during development. No demo or pilot path may link to `/checkout` while it's off.
- Build order source of truth: Masao's pipeline, `docs/build-pipeline-2026-07-10.pdf`. W1 and W2 jumped ahead of it because they were pure frontend with no blocked inputs.

## Key facts in force
- SB 253 first Scope 1/2 deadline: Nov 10, 2026 (confirmed 2026-07-21). That date has now passed; re-check the current state before quoting it in copy. 2027 brings Scope 3 and limited assurance.
- Assurance standard: ISSA 5000 (ISAE 3410 is withdrawn).
- PACT V3 only. Our PACT export is an unvalidated draft.
- Beachhead: California, SB 253, consultant-operated. Kerri is the founding partner.
