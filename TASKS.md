# TASKS.md
Generated from PLANS.md (approved). Updated after each task completes.

---

## Plan A — Codebase Cleanup

- [x] **A1** — Fix Logo: replaced hardcoded "G" with inline SVG recreation of Sendrow logo
- [x] **A2** — Removed `console.log` debug statement from `lib/utilityapi.ts`
- [x] **A3** — Moved hardcoded support email to `NEXT_PUBLIC_SUPPORT_EMAIL` env var
- [x] **A4** — Standardized `ADMIN_EMAIL` in `lib/email.ts` to use env var
- [x] **A5** — Updated stale "Canopy Light palette" → "Sendrow palette" in `app/globals.css`
- [x] **A6** — Removed dead `bg-canopy-text` Tailwind class from `components/ui.tsx`
- [x] **A7** — Deleted dead `lib/ratelimit.ts` file (re-created with proper implementation for B2)
- [x] **A8** — QB callback errors now write to `logs/errors.log` via new `lib/logger.ts`

## Plan B — First Customer Readiness

- [x] **B1** — Admin route protected in middleware via `ADMIN_CLERK_ID` env var
- [x] **B2** — Rate limiting wired to demo form and agency quote (5 req/hr/IP)
- [x] **B3** — Created stub `/terms` and `/privacy` pages with draft-warning banners
- [x] **B4** — Created `app/not-found.tsx` (404) and `app/error.tsx` (global error boundary)
- [x] **B5** — Added `SubmitButton` client component with `useFormStatus`; applied to connections and reports pages
- [x] **B6** — Verified PDF (`/api/report/pdf`) and export routes (`/api/export`, `/api/export/zip`) — structurally sound, no bugs
- [x] **B7** — Written `docs/first-customer-readiness.md` with full status, env var checklist, and gap list

## Smoke Tests

- [x] **T1** — Set up vitest; wrote calc engine smoke tests (`test/calc.test.ts`) — 12 tests
- [x] **T2** — Wrote section status smoke tests (`test/progress.test.ts`) — 12 tests
- [x] **T3** — Wrote emission factor smoke tests (`test/factors.test.ts`) — 18 tests
- [x] **T4** — All 42 tests pass. TypeScript clean (0 errors).

---

## Summary

All tasks complete. New files:
- `components/submit-button.tsx` — pending-state form button
- `lib/logger.ts` — file + stderr error logger
- `lib/ratelimit.ts` — IP-based rate limiter (used by demo + agency quote)
- `app/not-found.tsx`, `app/error.tsx` — error pages
- `app/terms/page.tsx`, `app/privacy/page.tsx` — legal stub pages
- `test/calc.test.ts`, `test/progress.test.ts`, `test/factors.test.ts` — smoke tests
- `test/setup.ts`, `vitest.config.ts` — test infrastructure
- `docs/first-customer-readiness.md` — gap analysis doc
