# PLANS.md
> Plan F pending approval.

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
