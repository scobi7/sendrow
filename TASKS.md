# TASKS.md — Open Work
> Only unchecked/open items live here. Everything shipped (A–N, T, U1–U2, W1–W2, X, Y, Z, MO, Plan L, rebrand, cleanup pass, security pass, BUG-1/2/3/4/5/6/8/9/10/11/12) is in git history and `PLANS.md`'s Built table — don't duplicate it here. Last hydrated 2026-10-02 (full codebase + API audit, then a same-session fix pass — see "Fixed this session" below).

## P0 — before any design partner touches real client data
- [ ] **ENV** Confirm `BLOB_READ_WRITE_TOKEN` is actually set in production. If not, "evidence stapled to every number" silently degrades to hash-only for every upload — can't pilot on this.
- [ ] **DATA** Real EPA eGRID2024 + USEEIO v2.5 factor values via `/admin/factors` — current values are explicitly labeled "representative" placeholders (`lib/factors.ts:4-8`). Both datasets have been publicly available for months; this is a data-entry job, not an architecture change. No number produced today is defensible on an actual filing.
- [ ] **MIGRATE** `userCompanies.stripeCustomerId` is a new nullable column added to `lib/db/schema.ts` this session (fixes the billing/portal bug below). Additive/nullable, same pattern as every prior schema change — applies automatically via `npm run build`'s `drizzle-kit push --force` on next deploy, or run it manually first if you want to verify before deploying.

## P1 — the moat, and the claim the homepage makes
- [ ] **W3 — Format engine.** `lib/mapping.ts`'s questionnaire helper hardcodes exactly 3 buyers (CDP, EcoVadis, Walmart) as `if/else`, which `contracts/invariants.md` §14a calls a stop-the-line violation of its own config-not-code rule. Blocked on a real buyer questionnaire to design against (Kerri/Masao). (Note: `lib/formats.ts`, the actual downloadable-export engine, is already a clean config lookup table — the hardcoding is specifically in the question-mapping display helper.)
- [ ] **Y3/Z4 — Conversion P0** (still not started, same list carried since July): early-engagement reminder 48-72h after send (biggest single lift, ≤4 total touches) · checklist items + time estimate shown inside the request email · per-item progress on the portal ("2 of 3 done, ~4 min left") · named-buyer "why" framing ("Whole Foods needs this for SB 253 by [date]"). The homepage's ≥60-70% response-rate claim is unvalidated with a single real supplier until these ship — industry baseline is ~41% (CDP).
- [ ] **TRUST** No DB-level tenant isolation (RLS shelved — `neon-http` driver has no transaction support, confirmed; fix requires a full driver migration to `neon-serverless`+`Pool`, not just adding policies). Current safety net is app-layer `ownsClient()` checks + `test/separation.test.ts`, which is a static text-containment check (greps for the guard call-site), not a runtime test. Recommend adding at least one real two-tenant integration test (seed two consultants/companies, assert cross-access 404s) before scaling past a handful of design partners.
- [ ] Refrigerant rows still can't be ingested via CSV/portal (`resolveFactorQuery` in `lib/ingestion/ingest.ts` has no refrigerant branch) — falls through to `unmapped` (fails safe, not silently wrong). Deliberately not fixed this session: refrigerant factors are `kgCO2e/kg` while `applyFactor()` assumes `tCO2e/x` everywhere, so wiring this through the generic path without also teaching `applyFactor()` about the unit difference would introduce a new 1000x unit bug. Needs that done properly, not as a quick patch. Only the manual-entry path (`lib/calc.ts:105-112`) handles refrigerants today.

## Fixed this session (2026-10-02) — verify after next deploy
- [x] **SEC-1** `app/api/checkout/verify/route.ts` now rejects if `session.client_reference_id !== userId`, matching the webhook's correct pattern. Confirmed `lib/stripe.ts` always sets `client_reference_id` on session creation, so this doesn't break the real flow.
- [x] **CALC-1** `lib/ingestion/ingest.ts`'s gallon-fuel resolver no longer defaults an unrecognized fuel label to gasoline — it now requires an explicit gasoline/diesel/propane match or flags the row `unmapped` for review.
- [x] **CALC-2** Market-based Scope 2 now applies the REC/residual-mix adjustment to portal-ingested electricity line items too (`recContextFor()` + updated `lineItemTotals()`/`combinedTotals()` in `lib/calc.ts`), not just manual entry. Fixed in all three places that computed this (`lib/calc.ts`, `lib/report-totals.ts`'s separate `getLineItemTotals()`, and the snapshot-freeze call site in `lib/consultant-actions.ts` that was stripping the needed fields). New test: `test/ledger.test.ts`.
- [x] Billing/portal bug: added `userCompanies.stripeCustomerId` (DB column, see MIGRATE above); webhook + checkout/verify now write it there; `billing/portal` reads it from the DB instead of the Clerk session claim that was never populated.
- [x] `app/api/cron/reminders` now fails closed if `CRON_SECRET` is unset.
- [x] Rate limiting added to all 6 previously-unlimited public portal routes (`stuck`, `request-new-link`, `import`, `line-comment`, `mapping-preview`, `delegate`), keyed per-token.
- [x] `lib/factor-engine.ts` `lookupFactor()` now throws on a genuinely ambiguous category+unit query with no keyword (grouped by `factor_name`, so multi-year vintages of the same factor aren't falsely flagged) instead of silently picking one. New tests in `test/factor-engine.test.ts`.
- [x] Em-dash fixed in `app/admin/accounts/page.tsx`.
- [ ] `lib/ratelimit.ts` is still an in-process `Map` — doesn't survive across serverless instances on Vercel, so the new rate limits above (and the existing one on `/api/track`) are weaker in production than they look in code. Not fixed — would need a shared store (e.g. a DB table or Upstash) to be real.

## Untested (not confirmed broken, just never walked end-to-end)
- [ ] **BUG-B1** — live smoke-test on prod: create a real data request to your own email on sendrow.app, confirm the link resolves (Malachi).
- [ ] **QA-1** — walk the portal "Type it in" (manual entry) path end-to-end; file-upload path is verified, manual entry isn't.
- [ ] Untested mutations: create client, scope-2 manual override save, comment on a line item.
- [ ] **Z5.1** — draft-persistence for staged portal uploads (survive tab close) — accepted gap in the batch-submit model, add if a pilot hits it.

## Dormant by design (not bugs)
- [ ] **BUG-7 (P2)** — payment gate disabled in `middleware.ts`; make sure no demo/pilot path links into `/checkout` while it's off.

## Roadmap (not started, no urgency — see `PLANS.md` for detail)
- **W4** — Supplier journey: portal attestation, claim-account flow, supplier trust page, section delegation, reply-by-email.
- **W5-W7** — Audit-grade depth (method labels, trust badges, restatement UI) and retention engine (digests, hotspots, YoY) — after first design partner.

## Standing ops (user-only)
- `CRON_SECRET` and `ADMIN_CLERK_ID` are set and working in prod.
- Calendly links still point to a personal account — switch to business before wider outreach.
