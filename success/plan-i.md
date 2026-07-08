# Success Criteria — Plan I: Integrity Release
> Verified 2026-07-07. Test evidence: 136/136 passing (`npx vitest run`), `tsc --noEmit` clean.

## 1. New-company flow: signup → onboarding (boundary + screening) → first upload, no path around onboarding
- ✅ Setup wizard step 5 requires a boundary approach (Next disabled until selected); saved to `gt_companies.boundary_approach`
- ✅ `/intake` and `/intake/upload` redirect to `/scope3-screening?from=intake` until screening rows exist; screening page shows the onboarding banner and a "Continue to Data Intake" CTA after save
- ✅ Guarded by `test/onboarding-gate.test.ts` (source-contract smoke tests)
- ⚠ Full end-to-end flow (Clerk signup through upload) still needs one manual QA pass — noted in NEXT.md

## 2. All 50 states resolve to a real eGRID subregion
- ✅ `egridForState()` maps all 50 states + DC to one of 26 subregion factors; multi-subregion states use the largest load center, documented inline
- ✅ Legacy mappings preserved (CA→CAMX, TX→ERCT, WY→NWPP, …) so nothing recalculates differently
- ✅ Proven per-state by `test/egrid-states.test.ts` (51 assertions + vintage checks)

## 3. A deliberately messy test file produces zero silently dropped rows
- ✅ `rowToLineItem()` and `fleetFuelToLineItems()` return flagged `status: "unmapped"` items (0 kgCO₂e, reason in calc log) instead of null/skip; import route no longer filters
- ✅ Unmapped rows force the session to `pending_review` even when auto-approval would otherwise apply
- ✅ QB spend in unmapped categories surfaces as a flagged zero-ton calc row (was silently skipped in `lib/calc.ts`)
- ✅ Proven by the "no silent drops" suite in `test/ingestion.test.ts` (row-count parity)

## 4. All existing tests still pass; new tests cover phases 0–3
- ✅ 136/136 tests (was 69) — new: egrid-states, emails, onboarding-gate, no-silent-drops suites
- ✅ Phase 3 emails proven with mocked Resend in `test/emails.test.ts`
