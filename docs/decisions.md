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
- 2026-11-15 (Malachi): Sign-up is closed to strangers (Clerk Waitlist mode). /request-access holds Clerk's waitlist form; Malachi invites from the Clerk dashboard. Every "Get started" button became "Request access". Revisit when the paywall goes on.
- 2026-11-14 (Malachi): Signed-out visitors to an unknown path get the 404 page. `middleware.ts` requires sign-in only on `/consultant`, `/admin`, `/checkout` and `/api` (minus four routes that check a token, secret or signature themselves); everything else is public. `test/middleware-routes.test.ts` fails until each new top-level folder in `app/` is classified, so nothing becomes public by accident.
- 2026-11-14 (Malachi): Consultant pages go without a loading skeleton until the Next 16.3 upgrade, planned as its own job.
- 2026-11-14 (Malachi): The Reports page shows Scope 2 location-based with the market-based figure under it (dual reporting, as the PDF, shared page and CDP answers already do). The total stays location-based.
- 2026-11-13: Removed `app/consultant/loading.tsx` and `app/consultant/clients/[id]/loading.tsx` to fix the server action stall (docs/known-issues.md). Cost: cold loads of consultant pages show no skeleton (the BUG-3 gap from 2026-07-21 is back). Revisit when upgrading to Next 16.3 or later.
- 2026-11-13: End-to-end tests live in the repo (`e2e/`, Playwright, 164 tests in 6 suites) and run against a production build and a Neon branch, never the main database. A confirmed bug gets a `test.fail` marker with file:line evidence until it is fixed.
- 2026-11-13: The dashboard lists archived clients with Restore; before, the 8-second Undo toast was the only way back.
- 2026-11-13: Request changes and Flag email the client once (consultant brand, reply-to the consultant) and the portal lists the sent-back uploads with the note. The review page already promised both.
- 2026-11-13: Sharing a snapshot emails the recipient a read-only link; restatement alerts and the share email record `email.sent` or `email.failed` per recipient on the timeline.
- 2026-11-13: The reports page and CDP, EcoVadis and Walmart questionnaire answers use `combinedTotals` (line items plus manual), like the PDF and snapshots.
- 2026-11-13 (Malachi): Site look is direction 4c (picked from 5 directions, then 3 layered versions of "worked examples"). One green (ink #0D2A1E, accent #0A7346, page #EEF4F0, tint #DCEAE1), except amber for warnings and red for errors in the app. Archivo for everything, headings at normal width (he found the 125% width too compact). One 10px radius. Handwritten notes (Nanum Pen Script) and the still 3D stack only on the homepage; the 3D is a deliberate exception to DESIGN.md's tilted-3D ban because he asked for 3D. Supersedes the "Ledger" default below. Details in DESIGN.md.
- 2026-11-13 (Malachi): All site copy goes through the /no-ai-slop skill (installed globally); house style still bans every dash. Unsourced stats cut; time promises cut except "done before lunch"; "vetted" stays on Get matched; one contact address, contact@sendrow.app; privacy and terms "Last updated" is a fixed date; /demo hides the booking link when NEXT_PUBLIC_CALENDLY_URL is unset; the security page makes no deletion-timeline promise; no labels, eyebrows or pills above headings.
- 2026-11-13 (Malachi): `DESIGN.md` (repo root) is the UI rulebook. Before any new UI code: a design brief (palette tokens, two typefaces, layout, one motion idea, reference), approved by Malachi first. The "Ledger" rebrand predates it and is redone from the approved brief.
- 2026-11-13 (Malachi): Spaced hyphens used as dashes (" - ") break house style, same as em dashes. Code comments and arithmetic are exempt.
- 2026-11-13: Homepage is self-serve onboarding, not a design-partner pitch: Get started goes to /signup then /onboarding; a supplier who got a request is told they need no account. The waitlist form and its `submitWaitlist` action are gone; `/admin/waitlist` still shows past signups.
- 2026-11-13: Ninth Circuit (Nov 9, 2026, preliminary): SB 253 Scope 3 and SB 261 likely unconstitutional, remanded; Scope 1/2 stays in force. `lib/regulatory-dates.ts` marks Scope 3 and SB 261 "On hold"; nothing in copy says Scope 3 starts in 2027.
- 2026-11-13: Supplier-calculated rows (data type `existing_inventory`) are built in the core (invariant 1 amended): stored as the supplier states them, never re-factored, always held for review. Consultants can't select the type yet: it stays out of `DATA_TYPE_OPTIONS` until the ledger, review page and exports label the rows.
- 2026-11-13 (Malachi): No company or third-party accounts. Suppliers and other third parties never sign up; their consultant sends them a link per request. Onboarding says so plainly, with "Get matched" as the fallback.
- 2026-11-13 (Malachi): Upload links stay one per request (no per-client link).
- 2026-11-13 (Malachi): Accept supplier-calculated emissions (pre-computed CO2e from an existing inventory or prior calculation), always labeled as such and never mixed silently with our own calculations. Plan approved; invariant 1 amended.
- 2026-11-13 (Malachi): Symbol glyphs (check marks, crosses, arrows) break house style; use words. Scope 2 "complete" stays a plain checkbox. Merge to main only when Malachi says.
- 2026-11-13: Rebrand default is the "Ledger" direction (docs/design-direction.md): paper background, white cards with hairline borders, one forest green, Fraunces / Instrument Sans / IBM Plex Mono, 8px and 6px radii, no glass, glow or gradients. Replaces "Aurora Pop" (2026-07-10). Why: Malachi asked to "un-AI-sloppify" and said to start and review after; it lives in the `:root` tokens of app/globals.css, so changing it is one file. Pending Malachi's review of the preview.
- 2026-11-13: Regulatory dates live in `lib/regulatory-dates.ts`; every entry has a source and a checked-on date, and Malachi or Masao sign off changes. The dashboard shows a static "Upcoming deadlines" strip, not a scrolling ticker (fails reduced motion, hard to read).
- 2026-11-13: New snapshots freeze manual-entry calcs as rows (`origin: "manual"`), so exported line items add up to the snapshot totals. Old snapshots are never rewritten (§13). The PDF report uses the same `combinedTotals` as snapshots.
- 2026-11-13: Archive is instant with an Undo toast and no confirm dialog (it is reversible); permanent delete keeps its confirm. Idempotency keys for creates were skipped: they need a schema change, and preview builds push the schema to the shared production DB.
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
- SB 253 first Scope 1/2 deadline: Nov 10, 2026 (confirmed, passed). Next is expected Nov 10, 2027 (annual). Scope 3 is on hold after the Ninth Circuit's Nov 9, 2026 preliminary ruling. Re-check `lib/regulatory-dates.ts` sources before quoting any date in copy.
- Assurance standard: ISSA 5000 (ISAE 3410 is withdrawn).
- PACT V3 only. Our PACT export is an unvalidated draft.
- Beachhead: California, SB 253, consultant-operated. Kerri is the founding partner.
