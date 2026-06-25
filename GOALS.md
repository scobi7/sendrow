# GOALS.md — Sendrow Project Goals

## What is Sendrow?
Sendrow is a B2B SaaS application that automates GHG (greenhouse gas) emissions reporting for small and mid-size businesses (SMBs). It also serves ESG consultants who manage multiple client companies.

## Core User Journeys

### Company User
1. Sign up → onboard with company name → setup wizard (industry, headcount, locations)
2. Connect QuickBooks (Scope 3 spend data) and Utility API (Scope 2 electricity/gas data)
3. Fill in Scope 1 inputs (fleet fuel, natural gas, refrigerants, stationary equipment)
4. Review Scope 2 (auto-populated from utility) and Scope 3 (auto-populated from QB + manual commute/waste)
5. Complete Social (workforce metrics) and Governance (policies, diversity) sections
6. Generate a GHG Inventory Report (PDF)
7. View gap analysis and action plan for improvement

### Consultant User
1. Sign up as consultant → manage client roster
2. Add clients (create company records), send invite tokens
3. Monitor all client progress from a single dashboard
4. Receive email notifications when clients complete sections

## Technical Goals
- Full audit trail for every data change (per GHG Protocol requirements)
- Both location-based and market-based Scope 2 accounting
- Spend-based Scope 3 via USEEIO v2.0 emission factors
- Emission factors sourced from: EPA GHG Hub, eGRID, USEEIO, IPCC AR6, EPA WARM
- PDF report export (react-pdf)
- QuickBooks OAuth and UtilityAPI integrations

## Business Goals
- Serve SMBs who cannot afford enterprise ESG tools
- Support consultants managing 5–50+ clients
- Enable CDP, EcoVadis, and GHG Protocol–aligned reporting
- Grow toward agency/team pricing tier

## Active Priorities
(Edit this section to reflect current sprint goals)
- [ ] TBD — populate with current priorities

## Out of Scope (for now)
- Scope 4 (avoided emissions)
- Scope 3 categories beyond current 6 (capital goods, fuel/energy activities, downstream transport, use of sold products, end-of-life, leased assets — currently "other" estimates only)
- Multi-year trend reporting
