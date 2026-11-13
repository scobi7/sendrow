# Progress

Update at the end of every session. Keep it current, not historical: git holds the history.

## Now (2026-11-13)
- Branch `sendrow-v3`, pushed. Preview of the latest push: https://sendrow-git-sendrow-v3-malachinguyenn-4218s-projects.vercel.app. `main` (sendrow.app) was last caught up 2026-09-10.
- Today on v3: tech-debt pass (security fixes, QuickBooks code removed), 20-item UX pass, design-partner fixes from `docs/plan-ui.md` (Ledger rebrand tokens, consultant nav and phone menu, client tabs, deadlines strip and sourced dates config, "Get started" checklist, per-row "How calculated" panel, Excel traceability columns, snapshot and PDF totals fixes, branded PDF).
- Checks: `npm run lint` clean, `npm test` 263/263, knip shows only the 5 known items. Nothing walked in a browser yet (see Untested).
- Phases: W3 format engine still blocked on a real buyer questionnaire. UI plan: Phase 0, most of 1, 3.1 and the Phase 4 foundation are built; the rest waits on Malachi's decisions (below).
- Current goal (set 2026-07-21): get real consultants using it and collect their feedback.

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

UI plan follow-ups (docs/plan-ui.md):
- Homepage deadline line: recommended a static sourced line under the hero (no ticker, no countdown); awaiting Malachi.
- Regulatory dates: add Nov 10 2027 (SB 253 is annual per Watershed; confirm), CARB fee notices, CDP 2027 once confirmed.
- Phase 2 data in: supporting documents on any checklist item, manual Scope 2 kWh entry, supplier-calculated imports (approved in principle 2026-11-13; plan awaiting OK). One link per client: decided no.
- Split the client overview page into its tabs' content; consolidate type sizes and inline styles; the /for-consultants marketing pass (mock dashboard, hover shadows).
- Add CARB fee notices (~Dec 10 2026), CDP 2027 and EcoVadis to `lib/regulatory-dates.ts` once confirmed.

Deferred tech debt (from the 2026-11-13 audit, not yet approved or decided):
- Propane with no price set is priced as gasoline in `lib/ingestion/ingest.ts`; `lib/ledger.ts` returns null for the same case.
- `lib/ratelimit.ts` never prunes expired keys.
- `reportingPeriod()` (`lib/calc.ts`) is off by a month on machines ahead of UTC; two fiscal-period definitions (`calc.ts` vs `period.ts`).
- Big files to split when next touched: `portal-checklist.tsx` (750 lines), `clients/[id]/page.tsx`, `for-consultants/page.tsx`, `review/page.tsx`, `ledger-row.tsx`.
- Product calls still open: keep or drop `gapAnalysis` (recommended: drop); do spaced hyphens (" - ") break house style. Settled 2026-11-13: Scope 2 stays a checkbox; glyphs break house style; legacy tables drop after main runs v3.

## Untested (never walked end to end)
- The 2026-11-13 UI work on the preview: Cmd+K, Archive then Undo, ledger Exclude/Restore rollback, "How calculated", phone menu, client tabs, branded PDF download, Excel export of a new snapshot with manual entries (Line items sum = Total).
- Live prod smoke test: send a data request to your own email on sendrow.app, confirm the link resolves.
- Portal "Type it in" manual-entry path.
- Create client; Scope 2 manual override save; comment on a line item.
- Draft persistence for staged portal uploads (accepted gap; add if a pilot hits it).
- After the next deploy: verify the 2026-10-02 fixes live.

## Waiting on Malachi
| What | Where |
|---|---|
| Confirm `BLOB_READ_WRITE_TOKEN` in prod | Vercel |
| Review the "Ledger" look on the preview (keep, adjust, or mock alternatives) | v3 preview |
| UI plan decisions 1, 3, 4, 5 (account types, one link per client, supplier-calculated imports, who signs off regulatory dates) | docs/plan-ui.md |
| Reflect proposals 1-5 from the tech-debt pass, plus today's | this session |
| Real eGRID2024 / USEEIO v2.5 factor values | `/admin/factors` |
| Real email smoke test on prod | sendrow.app |
| A real buyer questionnaire to unblock W3 (CDP/EcoVadis/Walmart docs are public) | research or Masao |
| Design testing with consultants (Jasmin and others) | calls |
| Decide when to do the RLS driver migration | product call |
| Possibly stale (from 2026-09-02, check): Clerk prod Google OAuth, attorney ToS (tool, not advice), Calendly links to a business account | ops |

## Log
- 2026-11-13 (evening): 20-item UX pass (command menu, undo archive, optimistic ledger, safe areas, delayed skeletons, disabled create buttons). Then design-partner UI work by Haiku builders, each check rerun by the orchestrator: Ledger rebrand tokens and fonts, consultant nav and phone menu, client tabs, sourced regulatory dates and deadlines strip, Get started checklist, "How calculated" panel, Excel traceability. Fixed: snapshots didn't freeze manual calcs (exports didn't reconcile), PDF counted excluded rows and dropped manual entries. 248 to 263 tests.
- 2026-11-13 (later): Tech-debt audit by 4 Haiku workers, then fixes in 3 builder waves, each check rerun by the orchestrator. Fixed: stored XSS in the evidence page, cron blocked by Clerk, shared links leaking live data or another company's snapshot, consultant PDF report (401, gate, override), silent seed-factor fallback, 3 cross-tenant holes (requestChanges, flagSession, approveSession), broken /demo Calendly links. "Powered by Sendrow" on portal/shared/PDF. Removed QuickBooks/utility code (DB tables kept). Merged ownership checks (lib/guards.ts), portal route helpers (lib/portal-api.ts), Scope 2 formulas, id generators, formatters, pills. Added knip, tsx, auditor agent; untracked tsconfig.tsbuildinfo. 231 to 248 tests.
- 2026-11-13: Set up the orchestrator/worker workflow (CLAUDE.md, docs/, builder and reviewer agents, reflect skill). Retired MAPS, TASKS, NEXT, PLANS, ROADMAP, GOALS, success/, logs/ and ROUTE-TREE; their content moved into docs/.
- 2026-10-02: Full codebase and API audit, then fixed 8 findings. 231/231 tests.
- 2026-09-10: Landing relaunch (Plan L), S-mark rebrand, knip dead-code cleanup, schema push unblocked (BUG-12).
