# Invariants — Hard Contracts

These invariants must hold at all times. Tests and code must enforce them.

## Calculation Engine

1. **recalcCompany is the single source of truth.** All CO2e values in the DB are derived by `recalcCompany()` in `lib/calc.ts`. Never write co2e values directly — always call `persist()` which calls `recalcCompany`.

2. **Factor lookup never falls through silently.** `getFactor(id)` throws if the factor_id is unknown. Code must never pass an unrecognized factor_id.

3. **Reporting period filters are always applied.** Utility and QB data outside the 12-month fiscal window must never contribute to totals. `recalcCompany` filters `filteredTxns` and `filteredUtility` by `inPeriod`.

4. **Market-based and location-based are separate columns.** `co2eTons` = location-based; `marketBasedTons` = market-based. They must never be mixed when summing.

## Audit Log

5. **Every user-initiated data change is logged.** `logChange` must be called before `persist` for every field mutation. Silent changes (where prev === next) are deduplicated inside `logChange`.

## Auth / Access

6. **Company users see only their own company.** `requireUser()` always loads the company for the authenticated user's `companyId`. No company ID should ever come from untrusted input for company-scoped operations.

7. **Consultants can only access clients they own.** All consultant actions verify the `consultantClients` link exists and is not archived before operating on a company.

8. **Invite tokens expire after 7 days.** `acceptInvite` must reject tokens where `expiresAt < now` or `usedAt` is set.

## Practice Platform (added 2026-07-08, direction reset)

11. **White-label surfaces never show Sendrow's name.** Any client-facing surface rendered on behalf of a consultant (portal, emails, PDFs) carries the consultant's brand; Sendrow never contacts the end client directly.

12. **Vendor mappings require human confirmation before becoming global.** Auto-applied vendor mappings record the mapping id/version used in the calc log; mapping changes apply forward only, like factor vintages.

## Data Integrity

9. **Calcs are always replaced on persist.** `persistCompany` deletes and re-inserts all `gt_calcs` rows. Stale calc rows must never accumulate.

10. **Section status is always recalculated on persist.** `refreshSectionStatus` is called inside every `persist()`. The stored `sectionStatus` must match `evaluateSections(company)` output at rest.
