# ROADMAP.md — Release Themes & Priorities
> Order rationale: credibility before monetization, monetization before channel.
> Last updated: 2026-07-07

## Plan I — Integrity Release (next)
Make the core engine trustworthy enough to defend the "audit trail" pitch.
1. Finish onboarding gates — boundary approach tile + Scope 3 screening in setup wizard, soft gate on `/intake` (carries over H21/H22)
2. Full eGRID state → subregion mapping (~40 states currently default to national average — was N9)
3. Expand QuickBooks → USEEIO category mappings beyond the current 9 (was N10)
4. **Fix silent-drop:** uncategorized spend must surface as a flagged "unmapped" line, never be ignored — this is a contracts/ invariant violation today
5. Email notifications for review queue (carries over H17)

## Plan J — Revenue Release
Convert the business model from one-time to recurring.
1. Stripe: company plan → annual subscription (Year 1 price + renewal price); grandfather existing one-time accounts
2. Data quality scorecard — per-category % actual vs. estimated, flagged items summary, 2–3 concrete improvement asks; rendered as a page + included in PDF report
3. Renewal-year flow: new reporting period reuses locked pipeline + mapping profiles, applies current factor vintages

## Plan K — Channel Release
Make the consultant tier actually deliverable.
1. Consultant multi-client mode — one consultant account manages a portfolio of companies (was N7; schema: userCompanies many-to-many groundwork, was N17-adjacent)
2. White-label groundwork — consultant branding on client-facing pages (was N16)

## Backlog (post-K, roughly ordered)
- CSV export adapter (cheap; original product note — "choice of PDF or CSV")
- Multi-year trend reporting — new reporting periods table (was N13)
- Emissions reduction target setting (was N14)
- CSRD / SEC questionnaire export formats (was N15)
- Multi-user per company (was N17)
- Onboarding email sequence / stall nudges (was N11)
- In-app help tooltips — refrigerant GWP, eGRID subregion, USEEIO (was N12)

## Standing P0 ops items (not build work — user actions, tracked in NEXT.md)
- Clerk production Google OAuth
- Attorney-reviewed ToS & Privacy copy
- `STRIPE_WEBHOOK_SECRET` in Vercel
- Re-enable payment gate in middleware before charging customers
- Update Calendly links on demo/agency pages
