# PLANS.md
> Plan H pending approval.

---

## Plan H — Managed Intake & Two-Sided Dashboard (2026-07-07)

### Vision
Move from "self-serve upload tool" to "managed intake service": client uploads raw data, consultant reviews and locks a pipeline, the two sides communicate through structured requests, and future years auto-process. Sendrow becomes the operating layer between client and consultant — not just a report generator.

### What's already built (reuse)
- `mapping_profiles` — versioned column mapping per company ✅
- `emission_line_items` — normalized data with calc_log ✅
- Upload flow (`/intake/upload`) ✅
- Workpaper view ✅
- `company` / `consultant` user roles in `userCompanies` ✅

### New schema tables

**`gt_intake_sessions`** — one row per file upload event
```
id, company_id, uploaded_by (clerk_id), filename, data_type,
status: "pending_review" | "needs_info" | "approved" | "rejected",
reviewer_notes, row_count, mapping_profile_id,
created_at, reviewed_at
```

**`gt_data_requests`** — consultant asks client for specific missing data
```
id, company_id, requested_by (clerk_id),
description (e.g. "Please upload Q3 utility bills for Oakland facility"),
status: "open" | "fulfilled" | "dismissed",
due_date, created_at, fulfilled_at
```

**`gt_pipeline_status`** — one row per company, tracks whether pipeline is locked
```
id, company_id,
status: "not_started" | "in_progress" | "locked",
locked_at, locked_by, notes
```

### Phase 1 — Intake session tracking
- Tag every upload with a session record (status starts at `pending_review`)
- Upload completion screen shows "Your data is under review" instead of just "imported N rows"
- `/intake` landing page shows sessions with their status badges

### Phase 2 — Consultant review interface
- New page `/consultant/clients` — list of all companies consultant manages
- New page `/consultant/clients/[companyId]/review` — see all pending sessions for a client
  - View file, data type, row count, mapping used
  - Approve (status → `approved`) or flag (status → `needs_info` with notes)
- Approved sessions: line items confirmed, pipeline profile promoted

### Phase 3 — Data requests
- Consultant can create a `gt_data_requests` entry from review page
- Client sees open requests on their dashboard: "Action needed — please upload Q3 utility bills"
- Client uploads → request marked `fulfilled` → consultant notified
- Email sent to client when request is created

### Phase 4 — Client status dashboard
- Redesign `/dashboard` for company users:
  - Pipeline status banner (not started / in progress / locked)
  - Open data requests (if any) — prominent CTA
  - Recent uploads with status badges
  - Quick link to workpaper once approved
  - "Generate report" only enabled when pipeline is approved or locked
- Remove the old section-by-section checklist (Connections, Scope 1–3, Social, Governance) — replace with intake-centric flow

### Phase 5 — Notifications
- Email client when consultant creates a data request
- Email consultant when client uploads a new file
- Both use existing `lib/email.ts` + Resend

### Phase 6 — Pipeline lock
- Consultant clicks "Lock pipeline" once all sessions are approved
- Pipeline status → `locked`
- Future uploads against this company auto-apply the locked mapping profile (no mapping step shown)
- Upload completion screen changes to "Auto-processed against your locked pipeline"

### Build order
1. Schema + migrations (all 3 tables)
2. Phase 1 — session tracking wired into upload flow
3. Phase 4 — client dashboard redesign (drives the visible change)
4. Phase 2 — consultant review interface
5. Phase 3 — data requests
6. Phase 5 — notifications
7. Phase 6 — pipeline lock

### What stays unchanged
- Upload flow mechanics (file parsing, column mapping, factor engine)
- Workpaper view
- PDF report generation
- Billing / auth / marketing

---

## Plan G — Full Client Pipeline (2026-07-06)

### Context
Reviewed two practice client files (Pacific Ridge Foods). Real client data has 7 distinct data types across separate tabs — utility bills, fleet fuel (dollar-based, no gallons), price references, vendor invoices, commute survey, business travel. Five gaps block an end-to-end walkthrough. This plan closes them.

### The "which report" answer
Add one field to the onboarding setup wizard: **"What are you reporting to?"** — dropdown with GHG Protocol PDF, CDP, EcoVadis, Supplier questionnaire, Other. Stored on the company record. V1 only generates the GHG Protocol PDF; the field seeds future adapters and tells the app which Scope 3 categories to flag as required.

### Phase 1 — Reporting destination in onboarding

- Add `reportingFramework` field to `gt_companies` schema (`text`, nullable)
- Add a step to the setup wizard (`app/(app)/setup/`) asking "What will you use this report for?" — single select: GHG Protocol PDF | CDP | EcoVadis | Supplier questionnaire | Other
- Display the selected framework on the dashboard and in the report header

### Phase 2 — Data-type-aware intake

Upgrade the upload flow so the user declares **what kind of data** each sheet contains before column mapping. Each data type has a pre-built column map template so the fuzzy-match step is pre-filled and minimal.

Data types supported in V1:
| Type key | What it covers | Key columns |
|----------|---------------|-------------|
| `utility_bills` | Electricity (kWh), natural gas (therms), propane (gallons) | month, kwh, therms, propane_gallons, meter_read_type |
| `fleet_fuel_dollar` | Fleet fuel spend in $ (requires price-per-gallon step) | month, vehicle_id, fuel_type, total_dollars |
| `vendor_invoices` | Spend-based Scope 3 (packaging, freight, services) | vendor, category, amount, date |
| `commute_survey` | Employee commute (mode + miles) | employee_id, one_way_miles, mode |
| `business_travel` | Flight city pairs | origin, destination, round_trip |
| `custom` | Anything else — fall back to current fuzzy-match flow |

UI change: after file upload + sheet selection, user picks a data type from the list above before the column-mapping step.

### Phase 3 — Fleet fuel $ → gallons processor

Fleet fuel cards give total $ spent, not gallons. Before line items can be created, quantity must be derived:

- After selecting `fleet_fuel_dollar` data type, an extra step appears: **"Enter fuel prices"** — two inputs: Diesel $/gallon, Gasoline $/gallon (with a note that monthly averages can be found from CA Energy Commission or EIA)
- Alternatively: if the user's file has a separate price reference sheet, they can upload that as a second file and map month + fuel_type + price_per_gallon columns
- Processing: `total_$ ÷ $/gal = gallons`, then `gallons × emission_factor = CO2e`
- Simple V1: single price input (user enters their best estimate). Price reference sheet upload is V2.

### Phase 4 — Scope 3 materiality screening

New page `app/(app)/scope3-screening/page.tsx`:
- Shows all 15 GHG Protocol Scope 3 categories with a short description
- For each: toggle Included / Excluded
- Excluded requires a reason (select: Not material | No operations in this category | Data unavailable | Below threshold) + free-text notes
- Saves to a new `gt_scope3_screening` table (`company_id`, `category_number`, `category_name`, `status`, `reason`, `notes`, `updated_at`)
- Results flow into the workpaper and appear in the report's methodology section

New schema table: `gt_scope3_screening`

### Phase 5 — Report connected to line items

The existing PDF report (`app/api/report/pdf/route.ts`) reads from `gt_calcs`. Update it to pull totals from `gt_emission_line_items` when they exist (line items take precedence; falls back to `gt_calcs` if none imported yet).

- `lib/report-totals.ts` — new helper: `getReportTotals(companyId)` — sums `co2e_kg` from `emission_line_items` grouped by scope and category, converts to tCO2e
- Report PDF header: shows `reportingFramework` from company record
- Methodology section: shows materiality screening decisions from `gt_scope3_screening`

### Full walkthrough (Pacific Ridge Foods — after Plan G)

1. Consultant creates client "Pacific Ridge Foods" in setup wizard → selects "GHG Protocol PDF" as reporting framework
2. **Data Intake → Upload utility bills tab** → select type "Utility bills" → pre-filled mapping (kWh, therms, propane_gallons, month) → import → Scope 1 (nat gas + propane) + Scope 2 (electricity) line items created with calc_log
3. **Data Intake → Upload fleet fuel tab** → select type "Fleet fuel ($-based)" → enter diesel $4.20/gal + gasoline $3.80/gal → import → Scope 1 mobile combustion line items
4. **Data Intake → Upload vendor invoices tab** → select type "Vendor invoices" → map category column → import → Scope 3 Cat 1 line items
5. **Data Intake → Upload commute survey tab** → select type "Commute survey" → import → Scope 3 Cat 7 line items (with estimated confidence + partial-survey note)
6. **Scope 3 Screening** → mark Cat 4 (upstream transport) as excluded (data unavailable) and other non-material categories
7. **Workpaper** → review all line items, verify calc_log, check confidence flags
8. **Reports** → generate PDF → report pulls from line items, includes data quality notes + framework header

### What stays unchanged
- Auth, billing, marketing, existing connections (QB, UtilityAPI)
- `gt_calcs` and legacy calc path — not deleted, report falls back to it

### Build order
1. Phase 1 — schema + onboarding field
2. Phase 4 — materiality screening (schema + UI, no dependency on other phases)
3. Phase 2 — data-type-aware intake upgrade
4. Phase 3 — fleet fuel $ processor
5. Phase 5 — report connected to line items

---

---

## Plan F — V1 Spreadsheet Ingestion Pipeline (2026-07-06)

### Scope
V1 handles Excel/CSV spreadsheets only. Clients upload whatever spreadsheet they have; the app fuzzy-matches columns, user confirms once, profile is saved, future uploads auto-process. No PDF parsing, no UtilityAPI rewiring, no CDP adapter yet. Existing app untouched.

### Phase 1 — Schema

Three new Drizzle tables added to `lib/schema.ts`, one migration:

| Table | Columns |
|-------|---------|
| `factor_entries` | `id`, `activity_type`, `unit`, `co2e_per_unit` (numeric), `vintage_year` (int), `source` (text), `scope` (1/2/3), `category` (text) |
| `emission_line_items` | `id`, `company_id`, `source_ref` (filename + row), `scope`, `category`, `raw_value`, `raw_unit`, `co2e_kg`, `confidence` (actual/estimated), `factor_entry_id`, `calc_log` (jsonb), `mapping_profile_id`, `created_at` |
| `mapping_profiles` | `id`, `company_id`, `name`, `column_map` (jsonb — `{ theirHeader: ourField }`), `effective_from`, `created_at` |

`calc_log` jsonb shape: `{ raw_value, raw_unit, factor, factor_vintage, formula, co2e_kg, computed_at }` — self-contained, replayable.

### Phase 2 — Factor engine

New `lib/factor-engine.ts`:
- `lookupFactor(activityType, unit)` — queries `factor_entries`, returns best match
- `applyFactor(rawValue, rawUnit, factorEntry)` — converts to CO2e, returns `{ co2e_kg, calc_log }`

New `scripts/seed-factors.ts` — seeds `factor_entries` with GHG Protocol Cross-Sector Tools activity factors (stationary combustion, mobile combustion, grid electricity by region). Run once against the DB.

Existing `lib/factors.ts` stays — no migration of old calc path.

### Phase 3 — Upload + column mapping UI

New pages under `app/(app)/intake/`:

**`page.tsx`** — landing: "Upload a spreadsheet to get started" + list of existing mapping profiles for this company

**`upload/page.tsx`** — file input (xlsx/csv), parses headers + first 5 rows client-side using `xlsx` package, POSTs to `/api/intake/preview`

**`/api/intake/preview/route.ts`** — receives headers, runs fuzzy match against known fields (`date`, `quantity`, `unit`, `activity_type`, `source_ref`, `scope`, `notes`), returns `{ header, suggestedField, confidence }[]`

**`map/page.tsx`** — shows mapping table: each column header with a dropdown pre-set to the suggested field. User adjusts, hits "Looks good." Saves as a `mapping_profile` (or updates existing one for this company).

**`review/page.tsx`** — shows parsed rows mapped through the confirmed profile, with CO2e calculated per row via factor engine. User hits "Import [N] rows." Server action writes to `emission_line_items`.

### Phase 4 — Workpaper view

New `app/(app)/workpaper/page.tsx`:
- Table of all `emission_line_items` for the company
- Filter by scope, category, confidence
- Expandable row: renders `calc_log` as a readable workpaper entry (raw value → factor applied → CO2e result)
- Summary totals by scope at the top

### What's out of scope for V1
- PDF/image ingestion
- UtilityAPI rewiring to line items
- CDP or other export adapters
- Tier 3 (fully manual entry form)
- Materiality screening UI

### Build order
1. Phase 1 — schema + migration
2. Phase 2 — factor engine + seed script
3. Phase 3 — upload → map → review → import flow
4. Phase 4 — workpaper view

### Dependencies
- `xlsx` npm package (parse Excel/CSV client-side)
- No new auth/infra needed

---

## Plan E — Last Touches (2026-06-27) ✅

| # | What | Status |
|---|------|--------|
| E1 | Footer on all marketing pages | ✅ |
| E2 | Calendly → `NEXT_PUBLIC_CALENDLY_URL` env var | ✅ |
| E3 | Billing portal link in Settings | ✅ |
| E4 | Terms/Privacy draft banners → env-gated | ✅ |
