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
- The ledger "How calculated" panel reads each row's `calcLog`. Rows imported before factor fields were logged show "Not recorded" for them, and manual-entry calcs (`CalcResult`) carry only a formula and basis, no factor name, value or unit. The gaps are shown on purpose.
- Excel exports of snapshots frozen before 2026-11-13 fill factor source and site name from today's tables (those snapshots never stored them), and have no evidence file column values.
- Supplier-calculated line items (`calcLog.origin === "supplier_calculated"`) must never get one of our factors. Every path that recomputes or remaps a line item checks `isSupplierCalculated()` first (ledger.ts recompute and dollar-fuel, consultant-actions recategorize, edit quantity, mark actual, bulk dollar-fuel, and the vendor-confirm remap of unmapped rows). A new recompute path needs the same guard.
- Snapshot sha256 is computed over canonical JSON (keys sorted at every depth) since 2026-11-13, so a stored snapshot re-hashes to its own sha256. Snapshots frozen before that keep their insertion-order hash, which can't be re-derived from the stored jsonb (Postgres reorders keys). Nothing recomputes stored hashes; never rewrite old rows (§13).
- The Scope 2 market-based override replaces the whole market figure, line items included (`combinedTotals`, fixed 2026-11-14). Before, the line items' market figure was added on top of the override, inflating market-based Scope 2 in the PDF, snapshots, shared page and CDP and EcoVadis answers. Snapshots frozen before the fix keep the figure they were frozen with (§13); a client with an override and billed electricity needs a corrected snapshot.
- A portal upload links to its data request only through `intake_sessions.uploaded_by = "portal:<requestId>"`; intake_sessions has no request column. `evidence.data_request_id` exists only for file uploads, not typed-in entries, so don't join through evidence.
- A utility file with no unit column gets its unit from the quantity header ("kWh Used" becomes kWh electricity; MWh, therms, gallons likewise) in `lib/ingestion/ingest.ts` `unitFromHeader`. Before 2026-11-13 those rows imported with no unit and stayed unmapped.
- Regulatory dates (`lib/regulatory-dates.ts`) are compliance facts shown to consultants. Check each against its source before changing it; the dashboard strip hides dated entries once they pass.

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

## UI
- The look lives in the `:root` tokens and shared classes in `app/globals.css` (`card`, `glass-panel`, `btn`, `chip`, `badge`, `input`). Change those before touching pages; class names like `glass-panel` are kept for compatibility even though nothing is glass any more. Token names predate the 4c theme (`--primary`, `--text-muted`), so their values, not their names, carry the look; the client portal overrides `--primary` with the consultant's brand color.
- Green text on the tint: the mockup's accent #0B7A4B on #DCEAE1 is 4.33:1 and fails AA for small chips, so the site uses #0A7346 (4.76:1). Check contrast before changing either.
- The homepage's styles are a CSS module (`app/home.module.css`). CSS modules reject bare attribute selectors such as `[data-scroll-x]` ("not pure selector", the whole site 500s in dev); put a class on the element instead.
- The Cmd+K command menu sits in the desktop sidebar, which is hidden below 640px, so it doesn't open on phones. Phones use the Menu button instead.
- React and React DOM are 19.2.0 to match the React Next bundles. Next keeps `@react-pdf/renderer` external, so it loads React from node_modules; a mismatch makes the PDF route 500 with React error #31. Upgrade React together with Next, never alone.
- No `loading.tsx` under `app/consultant` (both removed 2026-11-13). On Next 15.5 production builds, a server action on a page under a `loading.tsx` leaves a React transition suspended: the write lands but the page doesn't update until a reload or Clerk's token refresh (about 50 seconds). Dev mode never shows it. Upstream: facebook/react#35399, vercel/next.js#86055, fixed by react#36134 in Next 16.3, with no 15.5.x patch. Removing the files also turned the soft 404 (status 200) on another consultant's client pages into a real 404. Don't add a `loading.tsx` back before upgrading Next; the e2e tests for Restore, Renew link and the ledger totals line catch it.

## Tooling
- In zsh, `F="a b c"; grep ... $F` passes one filename with spaces in it, so grep fails and a "no hits" check passes falsely (a dash-sweep builder reported clean while 3 dashes remained, 2026-11-13). Run multi-file greps under `bash -c` with an array, or list the files inline, and check that grep didn't print "No such file".
- `process.env.X ?? "fallback"` keeps an empty string: `.env.local` sets `NEXT_PUBLIC_SUPPORT_EMAIL=""` and `FROM_EMAIL=""`, so `??` rendered a blank contact address. Use `||` for env fallbacks.
- Local `next dev` runs Clerk in keyless mode, so only public pages can be screenshotted locally; `/login` never reaches "networkidle" (wait for "load"). A dev-only Clerk box covers the lower right of screenshots. When several builders share one dev server, one builder's half-saved file can 500 every page for a minute.
- End-to-end tests: `npm run e2e` (Playwright, `e2e/`) builds and starts a production server on port 3200 (`e2e/serve.ts`) against the Neon branch in `.env.e2e.local` (`E2E_DATABASE_URL`); `e2e/env.ts` refuses the production host. Email, Blob and Stripe are off there. The server is built once at start, so after an app change stop it and start again; `E2E_REUSE_SERVER=1` only when the running build is current. Stop any `next dev` on 3000 or 3100 first (they share `.next`). Users A and B are Clerk dev users; A owns the demo data. The test branch is deleted after a run; before the next one, make a fresh copy of production with `npx neonctl branches create --project-id rapid-dew-63222172 --name qa-<date>` (org "Malachi"), put its connection string in `.env.e2e.local` as `E2E_DATABASE_URL`, and delete the branch when done.
- Playwright can't write traces in this repo path (the spaces and parentheses give ENOENT on `coding)/code/sendrow`); failure screenshots still land in `e2e/results`.
- Optimistic UI (ledger Exclude, archive) changes before the server action writes. An e2e test that reads the database after a click must poll for the stored value (snapshots test 2 raced on this).
- The Clerk dev instance's handshake can fail a link prefetch with "Failed to fetch RSC payload" (seen once, review suite, 2026-11-13). Not an app bug; allow it in that test only if it recurs.
- In zsh, `echo =====` fails (`=word` is filename expansion); quote it.
- `lib/format.ts` is display formatters; `lib/formats.ts` is the export-format engine. Easy to mix up.
- `npm run knip` reports 5 items kept on purpose: `components/pricing-calculator.tsx`, `PRICE_IDS`, `gapAnalysis`, `Gap`, `Location`. (`gapAnalysis`/`Gap`: leftover from the company self-serve product, shown nowhere; recommended for deletion, awaiting Malachi.)
- CI (`.github/workflows/ci.yml`) runs tsc twice (`npm run lint` is tsc) and never runs `npm test`. It uses Node 20, which is deprecated.
- Excel and Numbers can turn dates into serial numbers (`45657.66`). `normalizeDateInput()` in `lib/period.ts` handles it; use it for any new date input.
