# Invariants — Hard Contracts

These invariants must hold at all times. Tests and code must enforce them.

## Calculation Engine

1. **Two calc engines exist today — both must agree, and don't yet.** `recalcCompany()` in `lib/calc.ts` (tons-based) derives CO2e for manually-entered company data; `applyFactor()` in `lib/factor-engine.ts` (kg-based) derives CO2e for portal-ingested line items. Never write co2e values directly in either path — always go through `persist()`/`recalcCompany()` or `applyFactor()`. **Known open violation (TASKS.md CALC-2):** `combinedTotals()` sums both paths into one number, but only the manual path applies the REC/residual-mix adjustment to market-based Scope 2 — a client mixing both entry methods gets a partially-wrong market-based total. Fix before trusting this invariant again.

2. **Factor lookup never falls through silently.** `getFactor(id)` throws if the factor_id is unknown. Code must never pass an unrecognized factor_id.

3. **Reporting period filters are always applied.** Utility and QB data outside the 12-month fiscal window must never contribute to totals. `recalcCompany` filters `filteredTxns` and `filteredUtility` by `inPeriod`.

4. **Market-based and location-based are separate columns.** `co2eTons` = location-based; `marketBasedTons` = market-based. They must never be mixed when summing.

## Audit Log

5. **Every user-initiated data change is logged.** `logChange` must be called before `persist` for every field mutation. Silent changes (where prev === next) are deduplicated inside `logChange`.

## Auth / Access

6. **Company users see only their own company.** `requireUser()` always loads the company for the authenticated user's `companyId`. No company ID should ever come from untrusted input for company-scoped operations.

7. **Consultants can only access clients they own.** All consultant actions verify the `consultantClients` link exists and is not archived before operating on a company. (Enforced app-layer only — see TRUST item in TASKS.md for the DB-level-RLS gap and the limits of `test/separation.test.ts`'s static coverage.)

8. **Magic-link portal tokens expire and are single-purpose.** `portalTokenValid()` in `lib/portal.ts` rejects a cancelled request or a token past `expiresAt` (30-day TTL, `crypto.randomBytes(24)` — 192 bits). This replaced the old pre-pivot `acceptInvite`/7-day invite-token flow, which no longer exists in the codebase.

## Practice Platform (added 2026-07-08, direction reset)

11. **Requests wear the consultant's brand; Sendrow is the neutral vault.** (Re-scoped 2026-07-08 per the master doc.) Anything sent *on behalf of a consultant* — data requests, portal pages, reminder emails, deliverables — carries the consultant's brand, never Sendrow's. But the supplier owns their data on Sendrow: when they claim their free account or export it, Sendrow appears as the neutral platform. Sendrow still never markets to or contacts a consultant's client uninvited.

12. **Vendor mappings require human confirmation, and global scope is opt-in.** Confirmations default to this-client-only; a consultant explicitly marks a mapping "all clients" (real vendors like PG&E). Truck IDs, account numbers, and other non-vendor references must never enter the shared memory. Auto-applied vendor mappings record the mapping id/version used in the calc log; mapping changes apply forward only, like factor vintages. The same doctrine applies to file-format memory: AI suggests, a human (the supplier) confirms.

13. **Snapshots are immutable once shared.** Only frozen, dated, approved snapshots ever leave the system. A shared snapshot is never edited; corrections create a new snapshot and trigger restatement alerts to every recipient of the old one.

14a. **Output formats are config, never code** (pipeline Ground Rule #1). Every format (SB 253, CDP, buyer questionnaires) is a template/config the engine reads. Writing `if (format === "CDP")` is a stop-the-line violation — it's what makes the format library and the future EPR module possible.

14b. **Vendor memory is workspace-scoped** (pipeline doc, 2026-07-10). Mappings apply per consultant workspace (or per client); cross-platform suggestions are explicitly LATER for privacy. Nothing a consultant confirms leaks to another consultant's workspace.

14. **Suppliers are never scored.** No grades, badges-as-report-cards, or rankings of suppliers, ever. Trust-level labels describe *verification status of data* ("self-reported" / "consultant-reviewed" / "assured"), never quality of the company.

## Data Integrity

9. **Calcs are always replaced on persist.** `persistCompany` deletes and re-inserts all `gt_calcs` rows. Stale calc rows must never accumulate.

10. **Section status is always recalculated on persist.** `refreshSectionStatus` is called inside every `persist()`. The stored `sectionStatus` must match `evaluateSections(company)` output at rest.
