# Progress

Update at the end of every session. Keep it current, not historical: git holds the history.

## Now (2026-11-13)
- Branch `sendrow-v3`, pushed. Preview of the latest push: https://sendrow-git-sendrow-v3-malachinguyenn-4218s-projects.vercel.app. `main` (sendrow.app) caught up to v3 on 2026-11-15 (fast-forward to bfbb793; the build's schema push reported no changes). `main` at fad911b (request access page) on 2026-11-15. Vercel Blob store `sendrow-evidence` (public access, Production and Preview) created 2026-11-15; production redeployed and a logo upload confirmed files save. Clerk production sign-up is in Waitlist mode (2026-11-15): strangers request access on /request-access and land in the Clerk dashboard's Waitlist tab; design partners are invited from Users > Invitations or from that tab.
- Today on v3: tech-debt pass (security fixes, QuickBooks code removed), 20-item UX pass, design-partner fixes from `docs/plan-ui.md` (Ledger rebrand tokens, consultant nav and phone menu, client tabs, deadlines strip and sourced dates config, "Get started" checklist, per-row "How calculated" panel, Excel traceability columns, snapshot and PDF totals fixes, branded PDF).
- Also today: homepage turned into self-serve onboarding (deadline bar and sourced deadlines section, supplier "no account needed" box, design-partner pitch and waitlist removed); dashes swept from consultant, admin, marketing, legal, portal and email copy; supplier-calculated core logic (hidden from the request form until its rows are labeled).
- UI: direction 4c approved and built on v3 (theme tokens, Archivo, one radius, homepage, shared nav and footer); `DESIGN.md` holds the theme. Site copy went through /no-ai-slop.
- Checks: `npm run lint` clean, `npm test` 316/316, `npm run e2e` all passing on 2026-11-13 (Playwright, a production build against a Neon test branch, since deleted; make a new one before the next run, see docs/known-issues.md). knip last showed only the 5 known items.
- E2E found 17 bugs on 2026-11-13; 16 fixed with tests (see CHANGES.html). All found bugs are fixed as of 2026-11-14.
- Phases: W3 format engine still blocked on a real buyer questionnaire. UI plan: Phase 0, most of 1, 3.1 and the Phase 4 foundation are built; the rest waits on Malachi's decisions (below).
- Current goal (set 2026-07-21): get real consultants using it and collect their feedback.

## Before / after the next production deploy
- Data check done 2026-11-13: the only QuickBooks/utility data belongs to pre-pivot internal test companies ("Greentrack", "masao inc.", June 2026; no active consultant links, no snapshots), so removing that code changes no real client's numbers.
- After `main` deploys: confirm in Vercel's cron logs that `/api/cron/reminders` runs (Vercel crons only run on production; it was likely blocked by Clerk before).
- Set `NEXT_PUBLIC_CALENDLY_URL`, or `/demo` hides its booking link.
- AFTER `main` runs the v3 code, drop the four legacy tables (Malachi approved 2026-11-13): `connections` (5 rows, incl. 1 plaintext QuickBooks OAuth token for test company "Greentrack"), `qb_transactions` (249), `utility_data` (22), `invite_tokens` (2, expired). Steps: remove them from `lib/db/schema.ts` and from `app/api/clients/[id]/export/route.ts`, drop them with SQL by hand (so drizzle-kit never hits its interactive prompt), then deploy. Never do this from v3 first: preview builds push the schema to the production DB.

## Next
P0, before a design partner touches real client data:
- Load real EPA eGRID2024 and USEEIO v2.5 factor values via `/admin/factors`.

P1:
- Upgrade Next to 16.3+ as its own job (fixes the server action stall upstream; then restore the consultant loading skeleton). Then: preview builds on their own Neon branch with migrations instead of `push --force`, and the `neon-serverless` driver for transactions (see the stack write-up, 2026-11-14).
- W3 format engine: replace the hardcoded CDP/EcoVadis/Walmart branches in `lib/mapping.ts` with config (invariant §14a).
- Supplier-response work (Y3/Z4): reminder 48 to 72h after send, checklist and time estimate in the request email, per-item progress on the portal, named-buyer "why" framing. The homepage's response-rate claim depends on this.
- Tenant isolation: add one real two-tenant integration test (seed two consultants, assert cross-access 404s).
- Refrigerant rows via CSV/portal: teach `applyFactor()` about kgCO2e/kg units first.
- Shared-store rate limiting (see known-issues).

UI:
- Look over the 4c app screens on the preview while signed in (e2e covers behavior, not looks).
- Supplier-calculated batch 2 (portal: template download and upload, no mapping panel) and batch 3 (labels on ledger, trace panel, review, overview subtotal, Excel origin column, PDF note); then add `existing_inventory` back to `DATA_TYPE_OPTIONS`.
- Regulatory dates: CARB fee notices once a primary source confirms the date.
- Phase 2 data in: supporting documents on any checklist item, manual Scope 2 kWh entry. One link per client: decided no.
- Split the client overview page into its tabs' content; consolidate type sizes and inline styles; the /for-consultants marketing pass (mock dashboard, hover shadows).

Deferred tech debt (from the 2026-11-13 audit, not yet approved or decided):
- Propane with no price set is priced as gasoline in `lib/ingestion/ingest.ts`; `lib/ledger.ts` returns null for the same case.
- `lib/ratelimit.ts` never prunes expired keys.
- `reportingPeriod()` (`lib/calc.ts`) is off by a month on machines ahead of UTC; two fiscal-period definitions (`calc.ts` vs `period.ts`).
- Big files to split when next touched: `portal-checklist.tsx` (750 lines), `clients/[id]/page.tsx`, `for-consultants/page.tsx`, `review/page.tsx`, `ledger-row.tsx`.
- Product call still open: keep or drop `gapAnalysis` (recommended: drop). Settled 2026-11-13: Scope 2 stays a checkbox; glyphs and spaced-hyphen dashes break house style; legacy tables drop after main runs v3.

## Untested (never walked end to end)
- E2E covers the app on a test server with email, Blob and Stripe off. Still untested: real email delivery, evidence files in Blob, and anything on the production deploy.
- Live prod smoke test: send a data request to your own email on sendrow.app, confirm the link resolves.
- Draft persistence for staged portal uploads (accepted gap; add if a pilot hits it).
- After the next deploy: verify the 2026-10-02 fixes live.

## Waiting on Malachi
| What | Where |
|---|---|
| Look over the 4c site on the preview, signed in | preview |
| Drop `gapAnalysis`? (dead code from the company self-serve product) | this session |
| Reflect proposals 1-5 from the tech-debt pass, plus today's | this session |
| Real eGRID2024 / USEEIO v2.5 factor values | `/admin/factors` |
| Real email smoke test on prod | sendrow.app |
| A real buyer questionnaire to unblock W3 (CDP/EcoVadis/Walmart docs are public) | research or Masao |
| Design testing with consultants (Jasmin and others) | calls |
| Decide when to do the RLS driver migration | product call |
| Possibly stale (from 2026-09-02, check): Clerk prod Google OAuth, attorney ToS (tool, not advice), Calendly links to a business account | ops |

## Log
- 2026-11-15: main fast-forwarded to fad911b and deployed. Blob store created with a read-write token (the code reads `BLOB_READ_WRITE_TOKEN`; Vercel's default OIDC-only connection would not set it); redeployed; logo upload works on prod. Uploads before today are hash-only. Design partner invited.
- 2026-11-15: Request access page (Clerk <Waitlist/>, 4c); every "Get started" button now says "Request access"; a bare /signup with no invite ticket redirects there. 4 new browser tests; public and snapshot suites green on a fresh Neon branch (deleted). Fixed a sign-out race in the snapshot tests.
- 2026-11-15: Merged v3 to main (fast-forward, 27 commits); production deploy Ready, schema push no changes; smoke test on www.sendrow.app passed (homepage 4c, unknown path 404, signed-out /consultant to /login, cron 401). Clerk sign-up set to Invite-only by Malachi.
- 2026-11-14: Malachi's calls on the open items: signed-out unknown paths now 404 (middleware protects only app sections, guarded by test/middleware-routes.test.ts); no loading skeleton until Next 16.3; Reports page shows Scope 2 market-based. Found and fixed: the market-based override was added to the line items' market figure instead of replacing it. Neon test branch deleted; a fresh one made and deleted for the rerun.
- 2026-11-13 (overnight): 4c on every page (marketing, legal, app, portal, shared page, PDF, emails). Playwright e2e in the repo (6 suites) on a Neon branch and a production build. Found 17 bugs, fixed 16: the server action stall (`loading.tsx`, React #35399), soft 404, no archived-client restore, share email never sent, restatement and delegation sends unrecorded or misreported, reports and questionnaire totals missing line items, irreproducible snapshot hash, kWh header unit, request changes never reaching the client, flag and approve logging, factor source fallback, consultant PDF 500 (React 18 vs 19). Haiku builders' checks rerun by the orchestrator; caught a claimed console allowance that wasn't in the file, and a request link that missed typed-in entries. 283 to 316 unit tests. CHANGES.html added.
- 2026-11-13 (late night): Homepage directions: 5 prototypes, then 3 layered versions of "worked examples"; Malachi picked 4c (one green, layered sheets, still 3D stack) with upright headings. Built it: theme tokens, Archivo, one radius, homepage rebuild, shared nav and footer on every marketing and legal page, labels above headings removed. Installed /no-ai-slop and ran a site-wide wording pass (36 files: dashes, arrows, slop, unsourced stats and time promises, one contact address). Every Haiku builder's check rerun by the orchestrator; it caught invented example numbers, a dropped set of footer links, a "Built in California" claim, and an accent that failed contrast. 283 tests.
- 2026-11-13 (night): Homepage made self-serve, with a sourced deadline bar and deadlines section (Ninth Circuit ruling: SB 253 Scope 3 and SB 261 on hold). Dash sweep over consultant, admin, marketing, legal, portal and email copy. Supplier-calculated core logic with factor guards on every recompute path (orchestrator added the vendor-remap guard the builder missed). DESIGN.md adopted. 263 to 283 tests.
- 2026-11-13 (evening): 20-item UX pass (command menu, undo archive, optimistic ledger, safe areas, delayed skeletons, disabled create buttons). Then design-partner UI work by Haiku builders, each check rerun by the orchestrator: Ledger rebrand tokens and fonts, consultant nav and phone menu, client tabs, sourced regulatory dates and deadlines strip, Get started checklist, "How calculated" panel, Excel traceability. Fixed: snapshots didn't freeze manual calcs (exports didn't reconcile), PDF counted excluded rows and dropped manual entries. 248 to 263 tests.
- 2026-11-13 (later): Tech-debt audit by 4 Haiku workers, then fixes in 3 builder waves, each check rerun by the orchestrator. Fixed: stored XSS in the evidence page, cron blocked by Clerk, shared links leaking live data or another company's snapshot, consultant PDF report (401, gate, override), silent seed-factor fallback, 3 cross-tenant holes (requestChanges, flagSession, approveSession), broken /demo Calendly links. "Powered by Sendrow" on portal/shared/PDF. Removed QuickBooks/utility code (DB tables kept). Merged ownership checks (lib/guards.ts), portal route helpers (lib/portal-api.ts), Scope 2 formulas, id generators, formatters, pills. Added knip, tsx, auditor agent; untracked tsconfig.tsbuildinfo. 231 to 248 tests.
- 2026-11-13: Set up the orchestrator/worker workflow (CLAUDE.md, docs/, builder and reviewer agents, reflect skill). Retired MAPS, TASKS, NEXT, PLANS, ROADMAP, GOALS, success/, logs/ and ROUTE-TREE; their content moved into docs/.
- 2026-10-02: Full codebase and API audit, then fixed 8 findings. 231/231 tests.
- 2026-09-10: Landing relaunch (Plan L), S-mark rebrand, knip dead-code cleanup, schema push unblocked (BUG-12).
