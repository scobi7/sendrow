# Success Criteria

These are the conditions that define a successful, shippable feature or release.

## Core Flow — Success

- [ ] Company can complete the full onboarding → setup → connect → scope 1-3 → social → governance → generate report flow without errors
- [ ] GHG report PDF renders with correct scope totals (scope1 + scope2 + scope3)
- [ ] Audit log records every field change with correct prev/next values
- [ ] Section status transitions correctly: not_started → in_progress → complete
- [ ] Progress percentage matches section completion count / 7

## Consultant Flow — Success

- [ ] Consultant can add a client, generate an invite token, and see the client after they accept
- [ ] Consultant dashboard shows accurate progress % and total CO2e for each client
- [ ] Section-complete email fires when a client finishes a section
- [ ] Archived clients do not appear on the consultant dashboard

## Calculation Accuracy — Success

- [ ] Scope 1 fleet: gallons × factor = tCO2e (verified against EPA published values)
- [ ] Scope 2 location-based: kWh × eGRID subregion factor = tCO2e
- [ ] Scope 2 market-based: kWh × residual mix × (1 - REC%) = tCO2e
- [ ] Scope 3 spend-based: spend × USEEIO factor = tCO2e (per category)
- [ ] Only data within the fiscal reporting period is included in totals

## Auth & Security — Success

- [ ] Unauthenticated users cannot access /dashboard, /scope1, /consultant, etc.
- [ ] Company user cannot view or modify another company's data
- [ ] Consultant cannot manage clients belonging to another consultant
- [ ] Expired or used invite tokens are rejected

## Integration — Success

- [ ] QuickBooks OAuth flow completes and transactions are pulled
- [ ] UtilityAPI flow completes and meter data is aggregated by location/month
- [ ] Demo mode (no API keys) loads mock data correctly for both integrations
