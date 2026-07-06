# GOALS.md — Sendrow Project Goals

## What is Sendrow?
Sendrow automates GHG emissions **data ingestion, conversion, and audit trail** for CA mid-market companies (50–500 employees) and the ESG/sustainability consultants who serve them. The output is trustworthy, traceable Scope 1–3 data that can be exported to any reporting destination (CDP, EcoVadis, customer supplier portals, PDF).

## The Core Problem
The pain is not generating a report — it's that client source data is messy, inconsistent, and hard to trace. Sendrow makes that data trustworthy and replayable. The report is the last, easiest step.

## Five Architecture Layers
1. **Client intake** — branches by what data the client actually has (clean export / semi-structured spreadsheet / no tracking). Not a single fixed form.
2. **Standardized data model** — every data point normalized to Scope + category, tagged with source and confidence.
3. **Factor lookup engine** — versioned factor tables (activity-based + spend-based), each factor tagged with vintage year so historical results never silently change.
4. **Conversion & audit layer** — does unit math and writes a replayable calculation log per line item.
5. **Export adapters** — declarative mapping configs per destination (CDP, CSV/PDF, buyer-specific portals), built once and reused across all clients.

## Data Model Requirements
Every stored value carries:
- Source reference (invoice #, bill, survey answer)
- Factor used + its vintage year
- Confidence tag (actual / estimated / % actual if partial)
- Timestamped calculation log (inputs → formula → output)

Support: Scope 1, Scope 2 (location- and market-based), Scope 3 (all 15 GHG Protocol categories), materiality screening records for excluded categories.

## Ingestion Tiers
- **Tier 1 (clean/structured):** known template, auto-mapped, no human step.
- **Tier 2 (semi-structured):** client's own spreadsheet — column-mapping step (fuzzy match, client confirms once), saved as a versioned mapping profile.
- **Tier 3 (messy/unstructured):** flagged for human-assisted onboarding; result becomes a reusable Tier 1/2 template.
- Mapping profiles are versioned by effective date — historical data stays linked to the old version.

## User Audiences
- **Company users (primary):** mid-market SMBs asked to report emissions to a customer, regulator, or framework.
- **Consultant users:** ESG/sustainability consultants managing 5–50+ client companies.

## Technical Stack
- Next.js 15 App Router, multi-tenant, shared infrastructure
- Clerk v6 (auth + metadata for plan state)
- NeonDB + Drizzle ORM
- Stripe (company one-time $400, consultant $300/mo)

## Explicitly Out of Scope (for now)
- Custom per-client apps or forked dashboards
- Fully automated Tier 3 ingestion (human-assisted is fine)
- Export adapters for destinations no real client has requested
- Scope 4 (avoided emissions)
- Multi-year trend reporting
