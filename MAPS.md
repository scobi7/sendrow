# MAPS.md — Global Map & Workflow

## Directory map
- `MAPS.md` — this file
- `GOALS.md` — product vision, business model, architecture (read first, always)
- `ROADMAP.md` — phase status vs. Masao's pipeline doc (the build-order source of truth)
- `PLANS.md` — the current approved plan, in detail
- `TASKS.md` — itemized task list generated from PLANS.md; checked off as work completes
- `NEXT.md` — end-of-session summary: blockers, user actions, what's next
- `contracts/` — hard invariants that no plan may violate (see below)
- `success/` — success criteria per plan; initiate all criteria here before closing a plan
- `docs/` — human-readable documentation
- `test/` — smoke tests and unit tests
- `logs/` — all generated logs
- `app/`, `lib/`, `components/` — Next.js application code (no src/ or www/)

## Workflow (each session)
1. Read `GOALS.md`, then `ROADMAP.md` for current priorities.
2. Generate a plan → await human approval.
3. On approval: write the plan to `PLANS.md`, then generate a verbose itemized `TASKS.md` from it.
4. Create all tests needed to validate the work; run them.
5. Log to `logs/`; check `success/` and initiate all success criteria for the plan.
6. Confirm hard invariants in `contracts/` are unviolated.
7. Push to `sendrow-v2` (active branch) for preview. Never push to `main` (production) unless explicitly told. Never commit to `sendrow-v1` (frozen pre-pivot archive).
8. Update `NEXT.md` with a summary table of what's needed next.

## Hard invariants (live in contracts/, restated here)
- No data silently dropped or reinterpreted — unmapped/unrecognized inputs are flagged.
- Historical calculations are immutable: factor updates and mapping profile changes apply forward only (versioned by vintage year / effective date).
- Auto-routing first: uploads route to human review only when confidence score is below threshold. Never route all uploads through review by default.
- Per-client differences live in config, never forked code or per-client dashboards.
- Onboarding (boundary approach + Scope 3 screening) gates first upload.
- The consultant's client never sees Sendrow's name on white-label surfaces (§11).
- Vendor mappings become global only after human confirmation (§12).

## Key file map (v2, post-Plan N)
- `app/consultant/` — the product: practice board, client workspace (`clients/[id]`), review queue, settings (brand)
- `app/portal/[token]/` — magic-link client portal (no login; white-label)
- `app/shared/[token]/` — read-only branded client results page
- `app/get-matched/`, `app/admin/referrals/` — referral routing (inbound companies → consultants)
- `app/admin/factors/` — emission-factor loading (real eGRID/USEEIO values pending)
- `lib/ingestion/` — import pipeline (`import-core.ts` shared by portal + consultant paths)
- `lib/vendor-mappings.ts`, `lib/branding.ts`, `lib/evidence.ts`, `lib/period.ts`, `lib/portal.ts`, `lib/reminders.ts` — the Plan J/N systems
- `lib/db/schema.ts` + `lib/db/migrations/` — Drizzle schema (migrations auto-apply on deploy)
