# TASKS.md
Generated from PLANS.md (approved). Updated after each task completes.

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
- [x] **H12** — `app/(app)/consultant/clients/page.tsx` — client list with pending badge counts
- [x] **H13** — `app/(app)/consultant/clients/[companyId]/page.tsx` — pending sessions, approve/flag/reject actions
- [x] **H14** — Server actions: `approveSession`, `flagSession`, `rejectSession` (in `lib/consultant-actions.ts`)

### Phase 3 — Data requests + Phase 5 Notifications
- [x] **H15** — `createDataRequest` server action + `lockPipeline` server action
- [x] **H16** — Client dashboard shows open requests as action items (done in H11)
- [ ] **H17** — Email client on new request, email consultant on new upload (via `lib/email.ts`)

### Phase 6 — Pipeline lock
- [x] **H18** — `lockPipeline` server action — sets `gt_pipeline_status` to locked
- [x] **H19** — Upload API: if pipeline locked, skip mapping step, auto-approve (done in H8)
- [x] **H20** — Upload screen shows "auto-processed — pipeline locked" message (done in H10)

### Phase 0 — Onboarding extensions
- [ ] **H21** — Add boundary approach tile to setup wizard
- [ ] **H22** — Move scope 3 screening into setup wizard flow (soft gate on `/intake`)

### Finalize
- [ ] **H23** — All tests passing
- [ ] **H24** — Commit + push

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
