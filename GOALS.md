# GOALS.md — Sendrow Project Goals

## What is Sendrow?
Sendrow automates GHG emissions **data ingestion, conversion, and audit trail** for CA mid-market companies (50–500 employees) and the ESG/sustainability consultants who serve them. The output is trustworthy, traceable Scope 1–3 data exportable to any reporting destination (CDP, EcoVadis, customer supplier portals, PDF, CSV).

## The Core Problem
The pain is not generating a report — it's that client source data is messy, inconsistent, and hard to trace. Sendrow makes that data trustworthy and replayable. The report is the last, easiest step.

## Business Model — Hybrid (land as service, scale as software)
- **Year 1 per client:** service-heavy onboarding — mapping their messy data sources into the standard schema, building their mapping profiles. Priced accordingly.
- **Year 2+:** mappings already exist, pipeline locked, software mostly runs itself. Cost to serve drops; margin improves per account over time.
- The service layer is how software coverage grows: every human-assisted onboarding produces a reusable template.

## Pricing (updated 2026-07-07 — supersedes one-time $400)
- **Companies:** annual. Year 1 ≈ $1,200–1,500 (onboarding + first inventory), renewal ≈ $500–800/yr (data refresh, updated factor vintages, data quality scorecard). Validate exact numbers in discovery; the annual structure is committed.
- **Consultants:** $300/mo — requires multi-client portfolio management to be viable (Plan K).
- Existing one-time customers grandfathered as founding accounts.

## Five Architecture Layers
1. **Client intake** — branches by what data the client actually has (clean export / semi-structured spreadsheet / no tracking). Not a single fixed form. Boundary approach + Scope 3 materiality screening happen here, BEFORE first upload.
2. **Standardized data model** — every data point normalized to Scope + category, tagged with source and confidence.
3. **Factor lookup engine** — versioned factor tables (activity-based + spend-based), each factor tagged with vintage year so historical results never silently change.
4. **Conversion & audit layer** — does unit math and writes a replayable calculation log per line item.
5. **Export adapters** — declarative mapping configs per destination (PDF, CSV, CDP, buyer-specific portals), built once and reused across all clients.

## The Audit Trail — Definition of Done
Structured, queryable data first; prose generated from it on demand. Every stored value carries:
- **Provenance** — source reference (invoice #, bill, survey answer)
- **Factor + vintage** — which factor, which year's release
- **Confidence tag** — actual / estimated / % actual if partial
- **Calculation log** — timestamped inputs → formula → output, replayable

Hard rule: **no data is ever silently dropped or silently reinterpreted.** Unmapped spend, unrecognized categories, and failed lookups are flagged, not ignored.

## Ingestion Tiers
- **Tier 1 (clean/structured):** known template, auto-mapped, no human step.
- **Tier 2 (semi-structured):** client's own spreadsheet — fuzzy-matched column mapping, client confirms once, saved as a versioned mapping profile.
- **Tier 3 (messy/unstructured):** confidence score below threshold → routed to human-assisted review queue (never shown to client as a bad guess). The resulting mapping becomes a reusable Tier 1/2 template.
- Mapping profiles are versioned by effective date — historical data stays linked to the version that produced it.

## Annual Deliverables (renewal drivers)
- Updated inventory with current factor vintages
- **Data quality scorecard** — % actual vs. estimated per category, what was flagged, and 2–3 concrete asks to improve next year's data (e.g., "add a gallons column to your fuel card export"). This is the artifact that justifies renewal and improves our own margin on the account.

## User Audiences
- **Company users (primary):** mid-market SMBs asked to report emissions to a customer, regulator, or framework.
- **Consultant users:** ESG/sustainability consultants managing 5–50+ client companies (portfolio mode ships in Plan K).

## Technical Stack
- Next.js 15 App Router, multi-tenant, shared infrastructure — per-client differences live in config (mapping profiles, intake answers), never forked code
- Clerk v6 (auth + plan metadata), NeonDB + Drizzle ORM, Stripe (annual company plans + consultant subscription), Resend

## Explicitly Out of Scope (for now)
- Custom per-client apps or forked dashboards
- Fully automated Tier 3 ingestion (human-assisted is fine)
- Export adapters for destinations no real client has requested
- Scope 4 (avoided emissions)
- Multi-year trend reporting (backlog — see ROADMAP.md)
