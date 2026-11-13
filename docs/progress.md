# Progress

Update at the end of every session. Keep it current, not historical: git holds the history.

## Now (2026-11-13)
- Branch `sendrow-v3`, 4 commits ahead of `origin/sendrow-v3` (not pushed). `main` (sendrow.app) was last caught up 2026-09-10.
- Latest on v3: per-client data export, marketing copy fixed to match what's built, `/pricing` paused (redirects), the 2026-10-02 audit fixes (SEC-1, CALC-1, CALC-2, billing portal, cron fails closed, portal rate limits, factor ambiguity guard).
- Last recorded test run: 231/231, tsc and build clean (2026-10-02).
- Phases: 1 core loop and 2 demo readiness built. 3 format engine (W3) is next, blocked on a real buyer questionnaire. W4 to W7 queued. Spec: `docs/plan-w-spec.md`.
- Current goal (set 2026-07-21): get real consultants using it and collect their feedback. A pilot-ready core loop plus supplier-response work, not feature completeness.
- 2026-11-13 tech-debt pass is in the working tree, NOT committed: 86 files changed, lint clean, 248/248 tests. Security fixes, QuickBooks removal, dedup. See the log line below.

## Before / after the next production deploy
- Data check done 2026-11-13: the only QuickBooks/utility data belongs to pre-pivot internal test companies ("Greentrack", "masao inc.", June 2026; no active consultant links, no snapshots), so removing that code changes no real client's numbers.
- After `main` deploys: confirm in Vercel's cron logs that `/api/cron/reminders` runs (Vercel crons only run on production; it was likely blocked by Clerk before).
- Set `NEXT_PUBLIC_CALENDLY_URL`, or `/demo` booking links fall back to a placeholder.
- AFTER `main` runs the v3 code, drop the four legacy tables (Malachi approved 2026-11-13): `connections` (5 rows, incl. 1 plaintext QuickBooks OAuth token for test company "Greentrack"), `qb_transactions` (249), `utility_data` (22), `invite_tokens` (2, expired). Steps: remove them from `lib/db/schema.ts` and from `app/api/clients/[id]/export/route.ts`, drop them with SQL by hand (so drizzle-kit never hits its interactive prompt), then deploy. Never do this from v3 first: preview builds push the schema to the production DB.

## Next
P0, before a design partner touches real client data:
- Confirm `BLOB_READ_WRITE_TOKEN` is set in production (otherwise evidence is hash-only).
- Load real EPA eGRID2024 and USEEIO v2.5 factor values via `/admin/factors`.
- Apply the `userCompanies.stripeCustomerId` column (nullable; applies on the next deploy's schema push).

P1:
- W3 format engine: replace the hardcoded CDP/EcoVadis/Walmart branches in `lib/mapping.ts` with config (invariant §14a).
- Supplier-response work (Y3/Z4): reminder 48 to 72h after send, checklist and time estimate in the request email, per-item progress on the portal, named-buyer "why" framing. The homepage's response-rate claim depends on this.
- Tenant isolation: add one real two-tenant integration test (seed two consultants, assert cross-access 404s).
- Refrigerant rows via CSV/portal: teach `applyFactor()` about kgCO2e/kg units first.
- Shared-store rate limiting (see known-issues).

Deferred tech debt (from the 2026-11-13 audit, not yet approved or decided):
- Propane with no price set is priced as gasoline in `lib/ingestion/ingest.ts`; `lib/ledger.ts` returns null for the same case.
- `lib/ratelimit.ts` never prunes expired keys.
- `reportingPeriod()` (`lib/calc.ts`) is off by a month on machines ahead of UTC; two fiscal-period definitions (`calc.ts` vs `period.ts`).
- Big files to split when next touched: `portal-checklist.tsx` (750 lines), `clients/[id]/page.tsx`, `for-consultants/page.tsx`, `review/page.tsx`, `ledger-row.tsx`.
- Product calls: Scope 2 "complete" is now just a checkbox (no data gate); no manual kWh input; keep or drop `gapAnalysis`; do ✓/✕ glyphs and spaced hyphens break house style; drop the old qb/utility/invite tables (needs explicit OK).

## Untested (never walked end to end)
- Live prod smoke test: send a data request to your own email on sendrow.app, confirm the link resolves.
- Portal "Type it in" manual-entry path.
- Create client; Scope 2 manual override save; comment on a line item.
- Draft persistence for staged portal uploads (accepted gap; add if a pilot hits it).
- After the next deploy: verify the 2026-10-02 fixes live.

## Waiting on Malachi
| What | Where |
|---|---|
| Confirm `BLOB_READ_WRITE_TOKEN` in prod | Vercel |
| Real eGRID2024 / USEEIO v2.5 factor values | `/admin/factors` |
| Real email smoke test on prod | sendrow.app |
| A real buyer questionnaire to unblock W3 (CDP/EcoVadis/Walmart docs are public) | research or Masao |
| Design testing with consultants (Jasmin and others) | calls |
| Decide when to do the RLS driver migration | product call |
| Possibly stale (from 2026-09-02, check): Clerk prod Google OAuth, attorney ToS (tool, not advice), Calendly links to a business account | ops |

## Log
- 2026-11-13 (later): Tech-debt audit by 4 Haiku workers, then fixes in 3 builder waves, each check rerun by the orchestrator. Fixed: stored XSS in the evidence page, cron blocked by Clerk, shared links leaking live data or another company's snapshot, consultant PDF report (401, gate, override), silent seed-factor fallback, 3 cross-tenant holes (requestChanges, flagSession, approveSession), broken /demo Calendly links. "Powered by Sendrow" on portal/shared/PDF. Removed QuickBooks/utility code (DB tables kept). Merged ownership checks (lib/guards.ts), portal route helpers (lib/portal-api.ts), Scope 2 formulas, id generators, formatters, pills. Added knip, tsx, auditor agent; untracked tsconfig.tsbuildinfo. 231 to 248 tests.
- 2026-11-13: Set up the orchestrator/worker workflow (CLAUDE.md, docs/, builder and reviewer agents, reflect skill). Retired MAPS, TASKS, NEXT, PLANS, ROADMAP, GOALS, success/, logs/ and ROUTE-TREE; their content moved into docs/.
- 2026-10-02: Full codebase and API audit, then fixed 8 findings. 231/231 tests.
- 2026-09-10: Landing relaunch (Plan L), S-mark rebrand, knip dead-code cleanup, schema push unblocked (BUG-12).
