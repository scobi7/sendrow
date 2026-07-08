# PLANS.md — Plan I: Integrity Release
> STATUS: BUILT 2026-07-07 — see success/plan-i.md and TASKS.md (I1–I16)
> Generated 2026-07-07.

## Objective
Close the gap between what Sendrow claims (traceable, accurate, audit-grade data) and what the engine currently does. No new surfaces — hardening the existing pipeline.

## Phase 0 — Onboarding gates (carryover H21/H22)
- Add boundary approach tile to setup wizard (equity share / financial control / operational control, with one-line explanations; store on `gt_companies.boundary_approach`)
- Move Scope 3 materiality screening into the setup wizard flow; soft-gate `/intake` until screening exists (banner + redirect, not a hard block)
- Acceptance: a new company cannot reach first upload without boundary + screening recorded

## Phase 1 — Factor engine depth
- Complete eGRID state → subregion mapping in `lib/factors.ts` (`egridForState()`): all 50 states + DC mapped to correct subregions; multi-subregion states get documented default choice
- Expand QB → USEEIO category mappings (target: cover the categories that appear in real client charts of accounts; prioritize manufacturing + professional services)
- Every factor row carries vintage year; `applyFactor()` records vintage into the line item calc log
- Acceptance: unit tests per state mapping; no factor application without a recorded vintage

## Phase 2 — Kill silent drops (contracts/ invariant)
- Uncategorized/unmapped spend creates a flagged `emission_line_items` row with status `unmapped` (zero emissions, visible in workpaper + review queue) instead of being skipped
- Dashboard data quality bar counts unmapped rows against "% actual"
- Acceptance: importing a file with unknown categories produces visible flagged rows, and a test proves nothing is dropped

## Phase 3 — Review-queue notifications (carryover H17)
- Email client on new data request; email consultant on new upload needing review (`lib/email.ts`, existing Resend setup)
- Acceptance: both emails fire in a smoke test with mocked send

## Success criteria (write to success/plan-i.md)
1. New-company flow: signup → onboarding (boundary + screening) → first upload, with no path around onboarding
2. All 50 states resolve to a real eGRID subregion
3. A deliberately messy test file produces zero silently dropped rows
4. All existing tests still pass; new tests cover phases 0–3

## Out of scope for Plan I
Pricing changes (Plan J), scorecard (Plan J), consultant multi-client (Plan K), CSV adapter (backlog).
