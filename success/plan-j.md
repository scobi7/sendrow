# Success Criteria — Plan J: Practice Platform Release
> Verified 2026-07-08 on branch `sendrow-v2`. Evidence: 154/154 tests (`npx vitest run`), `tsc --noEmit` clean, full `next build` passes with all new routes.

## 1. A fulfillment engagement can run without ad-hoc email
- ✅ Consultant creates a data request with checklist items → magic-link token generated → client email carries the portal link
- ✅ `/portal/[token]` needs no login: guided checklist, file upload (parsed client-side, auto-mapped via data-type template + fuzzy match), or type-it-in entry grid
- ✅ Submissions flow through the shared `processImport` pipeline (scoring, review routing, no-silent-drops all preserved); checklist items flip to received; request auto-fulfills when complete
- ⚠ End-to-end (real email → portal → review) needs one manual QA pass

## 2. Vendor confirmed once = auto-mapped for the next client, traceably
- ✅ `gt_vendor_mappings` is global; confirmations only via `confirmVendorMapping` (human, consultant-verified — contracts/ §12)
- ✅ Ingest consults vendor memory before heuristics; applications record `vendor_mapping_id` in the calc log and increment `timesApplied`
- ✅ Confirming remaps the client's flagged rows immediately; QB spend path consults the same memory
- ✅ Proven in `test/vendor-mappings.test.ts` (client-A → client-B application; unconfirmed still flags; dollars never guessed as physical units)

## 3. Reminder emails fire per schedule
- ✅ Pure `dueReminders()` logic: 3/7/14-day tiers, highest-only, no repeats, consultant CC at 14 — `test/reminders.test.ts`
- ✅ `/api/cron/reminders` daily via vercel.json; CRON_SECRET honored when set

## 4. Marketing site routes companies to referral, not checkout
- ✅ Landing hero = practice-platform positioning; company card + pricing company plan → `/get-matched`
- ✅ Referral form logs to `gt_referral_leads` + admin email; rate-limited; checkout code untouched (dormant)

## 5. All tests pass; new coverage
- ✅ 154/154 (was 136): vendor-mappings, reminders, portal token/checklist suites added
- ✅ Trust basics live: `/security`, `/dpa`, footer links; export + delete flows already in settings
