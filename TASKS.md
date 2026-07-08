# TASKS.md
Generated from PLANS.md (approved). Updated after each task completes.

---

## Plan V — Visual Identity Refresh (2026-07-08)
> Approved 2026-07-08, building on `sendrow-v2`. Baseline: 154/154 tests.

- [x] **V1** — Fonts: Fraunces (display serif) + Instrument Sans (body) + IBM Plex Mono (data) in `app/layout.tsx`; tailwind config
- [x] **V2** — Color tokens: paper/ink/forest retheme of `:root` in `globals.css`; new `--accent` + `--ink-band`
- [x] **V3** — Hardcoded-hex sweep onto tokens (exception: STATUS_COLOR maps that use the hex+alpha-suffix trick keep literal hex)
- [x] **V4** — Landing: remove gradient blobs, ink-band section, serif hero, one terracotta moment
- [x] **V5** — App surfaces: figures in mono/tabular; print styles unregressed
- [x] **V6** — Verify: tests + tsc + build; hydrate success/plan-v.md

---

## Plan J — Practice Platform Release (2026-07-08)
> Approved 2026-07-08, building on branch `sendrow-v2`. Baseline: 136/136 tests.

### Phase 1 — Magic-link data-request portal
- [x] **J1** — Schema: extend `gt_data_requests` with `token` (unique), `expiresAt`, `checklist` (jsonb), `remindersSentAt` (jsonb); drizzle migration
- [x] **J2** — `createDataRequest` generates token + checklist items (from data types); portal URL surfaced to consultant
- [x] **J3** — Middleware: public bypass for `/portal/*`
- [x] **J4** — `app/portal/[token]/page.tsx` — token validation (expiry), checklist view with per-item status, no login required
- [x] **J5** — Portal item flow: document upload → existing intake pipeline (`/api/portal/upload` wrapping import logic, tagged with `dataRequestId`, attributed to the company)
- [x] **J6** — Portal item flow: structured entry forms per data type (reuse `data-type-templates.ts` fields) → line items via existing ingest
- [x] **J7** — Checklist item status updates (pending → received) as uploads/entries land; request auto-fulfills when all items received

### Phase 2 — Reminders + consultant status board
- [x] **J8** — `sendPortalReminderEmail` in `lib/email.ts`; reminder selection as pure function (`lib/reminders.ts`) — nudges at 3/7/14 days, consultant CC on day 14
- [x] **J9** — `/api/cron/reminders` route + cron config (daily)
- [x] **J10** — `/consultant/review/[companyId]`: data-request cards show checklist item status + portal link

### Phase 3 — Vendor-mapping memory
- [x] **J11** — Schema: `gt_vendor_mappings` (vendorPattern, scope, category, factorId, confidence, confirmedBy, confirmedAt, sourceCompanyId, timesApplied); migration
- [x] **J12** — `lib/vendor-mappings.ts`: `normalizeVendor()`, `matchVendor()` (pure); hook into `rowToLineItem` before factor resolution; mapping id recorded in calc log
- [x] **J13** — Review write-back: unmapped-vendor confirmation UI in review detail; `confirmVendorMapping` server action inserts global mapping + remaps that session's flagged rows
- [x] **J14** — QB path in `lib/calc.ts` consults vendor mappings for categories missing from `QB_CATEGORY_TO_USEEIO`
- [x] **J15** — Tests: normalize/match; client-A confirmation auto-maps client B; unconfirmed vendors still flag `unmapped` (Plan I invariant preserved)

### Phase 4 — Referral routing
- [x] **J16** — Schema: `gt_referral_leads` (name, email, company, trigger, status, createdAt); migration
- [x] **J17** — Landing hero + `/pricing` become consultant-facing; company path becomes "Get matched with a consultant" form → lead logged + admin email (checkout code untouched, dormant)

### Phase 5 — Trust basics
- [x] **J18** — `/security` page + DPA template page; footer links
- [x] **J19** — Settings: data export button + delete-my-data request flow (audit-logged, admin-notified)

### Finalize
- [x] **J20** — success/plan-j.md; all tests + tsc clean; contracts invariants 11–12 verified; commit + push `sendrow-v2`

---

## Plan I — Integrity Release (2026-07-07)
> Approved 2026-07-07. Baseline at generation: 69/69 tests passing. Absorbs H17, H21, H22.

### Phase 0 — Onboarding gates (carryover H21/H22)
- [x] **I1** — Add boundary approach tile to setup wizard (`app/setup/wizard.tsx`, currently 5 steps → 6): equity share / financial control / operational control with one-line explanations; persist via `saveSetup` to `gt_companies.boundary_approach` (column already exists in schema)
- [x] **I2** — Move Scope 3 materiality screening into the setup flow (reuse `app/(app)/scope3-screening/` form); soft-gate `/intake` when no `gt_scope3_screening` rows exist — banner + redirect, not a hard block
- [x] **I3** — Test: new company cannot reach first upload without boundary + screening recorded

### Phase 1 — Factor engine depth
- [x] **I4** — Add missing eGRID subregion factor rows to `lib/factors.ts` (currently only CAMX, NWPP, AZNM, ERCT + USAVG; ~27 subregions total), each with vintage year
- [x] **I5** — Complete `egridForState()`: all 50 states + DC → correct subregion (currently 11 states mapped, rest silently default to national average); document the default choice for multi-subregion states (e.g. NY, TX, FL, MI)
- [x] **I6** — Unit tests: every state resolves to a real subregion; assert `applyFactor()` records `factor_vintage` in the calc log (implementation exists in `lib/factor-engine.ts:57` — lock it in with a test)
- [x] **I7** — Expand `QB_CATEGORY_TO_USEEIO` beyond the current 9 mappings — prioritize manufacturing + professional-services chart-of-accounts categories, with matching USEEIO factor rows

### Phase 2 — Kill silent drops (contracts/ invariant violation today)
- [x] **I8** — Schema: add `status` column to `gt_emission_line_items` (`mapped` default / `unmapped`); drizzle migration
- [x] **I9** — `rowToLineItem()` returns a flagged `unmapped` row (zero emissions, reason in calc log) instead of `null`; same for `fleetFuelToLineItems()` skip paths (`continue` on unknown fuel / missing price / no factor); remove the null-filter in `app/api/intake/import/route.ts:77-78`
- [x] **I10** — Surface unmapped rows: workpaper table + consultant review queue show them flagged; dashboard data quality bar counts unmapped rows against "% actual"
- [x] **I11** — Test: deliberately messy import file (unknown categories, missing quantities) produces row-count parity — zero silently dropped rows

### Phase 3 — Review-queue notifications (carryover H17)
- [x] **I12** — `lib/email.ts`: add `sendDataRequestEmail` (to client on new data request) + `sendUploadNeedsReviewEmail` (to consultant on new upload routed to review); wire into `createDataRequest` action and `/api/intake/import`
- [x] **I13** — Smoke test: both emails fire with mocked Resend send

### Finalize
- [x] **I14** — Write `success/plan-i.md`; verify all four success criteria from PLANS.md
- [x] **I15** — Full test suite passing + `tsc` clean
- [x] **I16** — Confirm `contracts/invariants.md` unviolated; commit + push to `github-branch-tracking` (never `main`)

---

## Plan H — Managed Intake & Two-Sided Dashboard (2026-07-07)

### Schema
- [x] **H1** — Add `boundary_approach` + `onboarding_complete` to `gt_companies` schema
- [x] **H2** — Add `gt_intake_sessions` table to schema
- [x] **H3** — Add `gt_data_requests` table to schema
- [x] **H4** — Add `gt_pipeline_status` table to schema
- [x] **H5** — `drizzle-kit push` (auto-runs on next deploy via build script)

### Scoring engine
- [x] **H6** — `lib/ingestion/session-score.ts` — pure `scoreSession()` function
- [x] **H7** — `test/session-score.test.ts` — unit tests for scoring logic

### Phase 1 — Session tracking + auto-routing
- [x] **H8** — Update `/api/intake/import` to create `gt_intake_sessions` row with score + auto-route
- [x] **H9** — Redesign `/intake` landing: sessions list with status badges, score, data type
- [x] **H10** — Update upload done screen: "auto-approved" vs "under review" messaging

### Phase 4 — Client dashboard redesign
- [x] **H11** — Redesign `app/(app)/dashboard/page.tsx`: pipeline banner, open requests, recent sessions, report CTA

### Phase 2 — Consultant review queue
- [x] **H12** — Consultant review queue client list (moved to `app/consultant/review/page.tsx` post-I16 — route collision fix)
- [x] **H13** — Review detail: pending sessions, approve/flag/reject (moved to `app/consultant/review/[companyId]/page.tsx` post-I16)
- [x] **H14** — Server actions: `approveSession`, `flagSession`, `rejectSession` (in `lib/consultant-actions.ts`)

### Phase 3 — Data requests + Phase 5 Notifications
- [x] **H15** — `createDataRequest` server action + `lockPipeline` server action
- [x] **H16** — Client dashboard shows open requests as action items (done in H11)
- [~] **H17** — Email client on new request, email consultant on new upload — **absorbed into Plan I (I12–I13)**

### Phase 6 — Pipeline lock
- [x] **H18** — `lockPipeline` server action — sets `gt_pipeline_status` to locked
- [x] **H19** — Upload API: if pipeline locked, skip mapping step, auto-approve (done in H8)
- [x] **H20** — Upload screen shows "auto-processed — pipeline locked" message (done in H10)

### Phase 0 — Onboarding extensions
- [~] **H21** — Add boundary approach tile to setup wizard — **absorbed into Plan I (I1)**
- [~] **H22** — Move scope 3 screening into setup wizard flow (soft gate on `/intake`) — **absorbed into Plan I (I2)**

### Finalize
- [x] **H23** — All tests passing (69/69 verified 2026-07-07)
- [x] **H24** — Commit + push (`e49ad66`)

---

## Plan F — V1 Spreadsheet Ingestion Pipeline (2026-07-06)

## Plan G — Full Client Pipeline (2026-07-06) ✅

### Phase 1 — Reporting destination
- [x] **G1** — Add `reporting_framework` column to `gt_companies` in schema
- [x] **G2** — Add `gt_scope3_screening` table to schema
- [x] **G3** — Generate + push migration (`0002_fantastic_darkstar.sql`)
- [x] **G4** — Add step 5 to setup wizard: "What's driving this report?" (4 tile options, skippable)
- [x] **G5** — Update `saveSetup` action + show framework badge on dashboard

### Phase 2 — Materiality screening UI
- [x] **G6** — `app/(app)/scope3-screening/page.tsx` + `screening-form.tsx` — 15-category checklist with inline reason
- [x] **G7** — `saveScreening` server action in `lib/actions.ts`
- [x] **G8** — Add "Scope 3 Screening" to nav

### Phase 3 — Data-type-aware intake
- [x] **G9** — `lib/ingestion/data-type-templates.ts` — pre-built column map templates per data type
- [x] **G10** — Add data type selector to upload flow (one dropdown before column mapping)
- [x] **G11** — When type selected, pre-fill column mapping from template

### Phase 4 — Fleet fuel $ processor
- [x] **G12** — Add fuel price input step when `fleet_fuel_dollar` type selected
- [x] **G13** — `fleetFuelToLineItems()` in `lib/ingestion/ingest.ts` — `$ ÷ $/gal = gallons → CO2e`
- [x] **G14** — Wire fleet fuel price through `/api/intake/import`

### Phase 5 — Report connected to line items
- [x] **G15** — `lib/report-totals.ts` — `getReportTotals(companyId)` sums emission_line_items by scope
- [x] **G16** — Update PDF report to use line items when they exist (fall back to gt_calcs)
- [x] **G17** — Add reporting framework to PDF header + materiality decisions to methodology section

### Finalize
- [x] **G18** — 63/63 tests passing
- [x] **G19** — Committed + pushed to `github-branch-tracking`

---

### Plan F — V1 Spreadsheet Ingestion Pipeline (2026-07-06) ✅

### Phase 1 — Schema
- [x] **F1** — Add `emission_line_items` table to `lib/db/schema.ts`
- [x] **F2** — Add `mapping_profiles` table to `lib/db/schema.ts`
- [x] **F3** — `drizzle-kit generate` done → `lib/db/migrations/0001_daffy_barracuda.sql`. **User action:** run `drizzle-kit push` with `DATABASE_URL` set locally, or deploy to Vercel (auto-applies).

### Phase 2 — Factor engine
- [x] **F4** — Created `lib/factor-engine.ts`: `lookupFactor()`, `applyFactor()`, `getFactorsFromDb()`
- [x] **F5** — `test/factor-engine.test.ts` — 8 tests, all passing

### Phase 3 — Ingestion logic
- [x] **F6** — Created `lib/ingestion/fuzzy-match.ts`: `STANDARD_FIELDS`, `FIELD_ALIASES`, `fuzzyMatchHeaders()`
- [x] **F7** — Created `lib/ingestion/ingest.ts`: `applyProfile()`, `rowToLineItem()`
- [x] **F8** — `test/ingestion.test.ts` — 13 tests, all passing

### Phase 4 — API routes
- [x] **F9** — Installed `xlsx` package
- [x] **F10** — `app/api/intake/preview/route.ts` — POST: fuzzy-match headers, return suggestions
- [x] **F11** — `app/api/intake/import/route.ts` — POST: save mapping profile + write emission_line_items

### Phase 5 — Intake UI
- [x] **F12** — `app/(app)/intake/page.tsx` — landing: profile list + upload CTA
- [x] **F13** — `app/(app)/intake/upload/page.tsx` — 3-step client component: upload → map → done

### Phase 6 — Workpaper view
- [x] **F14** — `app/(app)/workpaper/page.tsx` + `workpaper-table.tsx` — filterable line items table with expandable calc_log rows

### Finalize
- [x] **F15** — Added "Data Intake" + "Workpaper" to `components/nav.tsx`
- [x] **F16** — 63/63 tests passing
- [x] **F17** — Committed + pushed to `github-branch-tracking`

---

## Plan C — Domain & Email Infrastructure (2026-06-26)

- [x] **C1** — Updated `ADMIN_EMAIL` fallback in `lib/email.ts` to `malachi.nguyen@sendrow.app`
- [x] **C2** — Set Vercel env vars: `FROM_EMAIL`, `ADMIN_EMAIL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_APP_URL`
- [x] **C3** — Set up Resend sending domain `sendrow.app` + DNS verified via Cloudflare auto-configure
- [x] **C4** — `RESEND_API_KEY` already set in Vercel; redeployed to apply all env vars

---

## Plan B — First Customer Readiness

- [x] **B1** — Admin route protected in middleware via `ADMIN_CLERK_ID` env var
- [x] **B2** — Rate limiting wired to demo form and agency quote (5 req/hr/IP)
- [x] **B3** — Created stub `/terms` and `/privacy` pages with draft-warning banners
- [x] **B4** — Created `app/not-found.tsx` (404) and `app/error.tsx` (global error boundary)
- [x] **B5** — Added `SubmitButton` client component with `useFormStatus`; applied to connections and reports pages
- [x] **B6** — Verified PDF (`/api/report/pdf`) and export routes — structurally sound, no bugs
- [x] **B7** — Written `docs/first-customer-readiness.md` with full status, env var checklist, and gap list

## Plan A — Codebase Cleanup

- [x] **A1** — Fix Logo: replaced hardcoded "G" with inline SVG Sendrow mark
- [x] **A2** — Removed `console.log` debug statement from `lib/utilityapi.ts`
- [x] **A3** — Moved hardcoded support email to `NEXT_PUBLIC_SUPPORT_EMAIL` env var
- [x] **A4** — Standardized `ADMIN_EMAIL` in `lib/email.ts` to use env var
- [x] **A5** — Updated stale "Canopy Light palette" → "Sendrow palette" in `app/globals.css`
- [x] **A6** — Removed dead `bg-canopy-text` Tailwind class from `components/ui.tsx`
- [x] **A7** — Deleted dead `lib/ratelimit.ts` (re-created with proper IP-based implementation)
- [x] **A8** — QB callback errors now write to `logs/errors.log` via `lib/logger.ts`

## Smoke Tests

- [x] **T1** — Vitest setup; calc engine smoke tests (`test/calc.test.ts`) — 12 tests
- [x] **T2** — Section status smoke tests (`test/progress.test.ts`) — 12 tests
- [x] **T3** — Emission factor smoke tests (`test/factors.test.ts`) — 18 tests
- [x] **T4** — All 42 tests pass. TypeScript clean (0 errors).

---

## Plan D — Stripe Billing Integration (2026-06-26)

- [x] **D1** — `lib/stripe.ts` — Stripe client + `createCheckoutSession()`
- [x] **D2** — `app/api/checkout/verify/route.ts` — GET: verify payment + update Clerk metadata
- [x] **D3** — `app/api/webhooks/stripe/route.ts` — handle checkout.session.completed + subscription cancellations
- [x] **D4** — `app/api/billing/portal/route.ts` — billing portal for consultants
- [x] **D5** — `app/checkout/page.tsx` — plan picker or immediate Stripe redirect
- [x] **D6** — `app/checkout/success/page.tsx` — verify, reload session, redirect
- [x] **D7** — `middleware.ts` — payment gate on all app routes (skipped if no STRIPE_SECRET_KEY)
- [x] **D8** — `lib/actions.ts` — onboarding now redirects to `/checkout?plan=...`
- [x] **D9** — `app/pricing/page.tsx` — CTAs updated to `/signup?plan=...`
- [ ] **D10** — Set up Stripe webhook in dashboard + add `STRIPE_WEBHOOK_SECRET` to Vercel (user action)
