# Known issues and gotchas

Traps that cost time, with the fix or workaround. Add one when something bites; remove it once it's fixed for good.

## Data and calculations
- Emission factor values in `lib/factors.ts` are labeled "representative", not final EPA eGRID2024/USEEIO v2.5. Correct method, placeholder numbers: don't use them on a real filing. Fix: load real data via `/admin/factors`.
- Two calc paths: `lib/calc.ts` (tons, manual entry) and `lib/factor-engine.ts` (kg, portal line items). Change one and you probably need to change the other. Electricity (Scope 2) only flows through line items now; see invariant §1.
- Refrigerant factors are kgCO2e/kg while `applyFactor()` assumes tCO2e per unit. Routing refrigerants through the generic ingest path without fixing that creates a 1000x bug. Only manual entry (`lib/calc.ts`) handles refrigerants today.
- `lib/mapping.ts` hardcodes CDP/EcoVadis/Walmart (breaks invariant §14a). `lib/formats.ts`, the export engine, is already config.
- The PACT JSON export is a self-labeled draft, not conformance-tested.
- QuickBooks/utility code is gone (2026-11-13) but its DB columns and tables remain (`qb_*`, `utility_*` on company connections, `qb_transactions`, `utility_data`, `invite_tokens`). Never remove them from `lib/db/schema.ts` casually: the build's `drizzle-kit push --force` would drop them in prod. The client export (`app/api/clients/[id]/export`) still includes `qb_transactions`/`utility_data`.
- Scope 2 has no manual kWh input. Electricity reaches totals only through imported line items.

## Database and deploy
- **Preview and Production share ONE `DATABASE_URL`** (Vercel env, checked 2026-11-13). Every preview build (any branch, e.g. `sendrow-v3`) runs `drizzle-kit push --force` against the production database. A schema change on a branch hits prod immediately, while `main` may still run code that needs the old schema. Only additive changes are safe on a branch; removals wait until `main` runs code that no longer needs them.
- `npm run build` runs `drizzle-kit push --force` first. If drizzle-kit needs a yes/no answer (for example, adding a unique constraint), it crashes on Vercel with "Interactive prompts require a TTY" and schema changes silently stop applying. Fix: run the push locally, or apply the change by hand in SQL, then redeploy. (BUG-12, 2026-09-10.)
- The `neon-http` driver has no transactions at all. Anything that needs one (RLS, atomic multi-statement writes) needs `neon-serverless` + `Pool`.
- `NEXT_PUBLIC_APP_URL` must be the real domain. It once pointed at `greentrack-sigma.vercel.app` and every email link 404'd. Always give it a fallback in code.
- The old product name was GreenTrack. Any leftover `gt_` names are from before the rename.

## Security and infrastructure
- No DB-level row-level security. Tenant isolation is app-layer `ownsClient()`; `test/separation.test.ts` is a static check (it greps for the guard), not a runtime test.
- `lib/ratelimit.ts` is an in-process `Map`, so limits don't hold across Vercel instances. Needs a shared store to be real.
- Private Blob access needs `@vercel/blob` 1.1.1 to 2.x (multi-major). Meanwhile evidence downloads stream through `/api/evidence/[id]`, so the raw blob URL never reaches the browser.
- Without `BLOB_READ_WRITE_TOKEN`, uploads record only a sha256 hash, not the file.
- `/admin/*` is gated once, in `middleware.ts` via `ADMIN_CLERK_ID`. Don't add a second check in pages (that caused the BUG-1 hang). `/api/cron/reminders` fails closed without `CRON_SECRET`.
- The billing gate is disabled in `middleware.ts`.

- Ownership checks go through `lib/guards.ts` (`findOwnedLink`, `requireOwnedClient`). `test/separation.test.ts` is a static source check over `ACTION_FILES` (consultant-actions, workflow-actions, actions): a new server-action file must be added to that list or it isn't covered. Any action taking a companyId plus another entity id must also check the entity belongs to that company (flagSession/approveSession lacked this until 2026-11-13).
- `lib/guards.ts` imports `server-only`, so a vitest test can't import it (or anything importing it) without mocking.

## Tooling
- `lib/format.ts` is display formatters; `lib/formats.ts` is the export-format engine. Easy to mix up.
- `npm run knip` reports 5 items kept on purpose: `components/pricing-calculator.tsx`, `PRICE_IDS`, `gapAnalysis`, `Gap`, `Location`.
- CI (`.github/workflows/ci.yml`) runs tsc twice (`npm run lint` is tsc) and never runs `npm test`. It uses Node 20, which is deprecated.
- Excel and Numbers can turn dates into serial numbers (`45657.66`). `normalizeDateInput()` in `lib/period.ts` handles it; use it for any new date input.
