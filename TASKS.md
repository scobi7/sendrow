# TASKS.md
Generated from PLANS.md (approved). Updated after each task completes.

---

## Plan C — Domain & Email Infrastructure (2026-06-26)

- [x] **C1** — Updated `ADMIN_EMAIL` fallback in `lib/email.ts` to `malachi.nguyen@sendrow.app`
- [x] **C2** — Set Vercel env vars: `FROM_EMAIL`, `ADMIN_EMAIL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_APP_URL`
- [x] **C3** — Set up Resend sending domain `sendrow.app` + DNS verified via Cloudflare auto-configure
- [x] **C4** — `RESEND_API_KEY` already set in Vercel; redeployed to apply all env vars

---

## Plan B — First Customer Readiness

- [x] **B1** — Admin route protected in middleware via `ADMIN_CLERK_ID` env var
- [x] **B2** — Rate limiting wired to demo form and agency quote (5 req/hr/IP)
- [x] **B3** — Created stub `/terms` and `/privacy` pages with draft-warning banners
- [x] **B4** — Created `app/not-found.tsx` (404) and `app/error.tsx` (global error boundary)
- [x] **B5** — Added `SubmitButton` client component with `useFormStatus`; applied to connections and reports pages
- [x] **B6** — Verified PDF (`/api/report/pdf`) and export routes — structurally sound, no bugs
- [x] **B7** — Written `docs/first-customer-readiness.md` with full status, env var checklist, and gap list

## Plan A — Codebase Cleanup

- [x] **A1** — Fix Logo: replaced hardcoded "G" with inline SVG Sendrow mark
- [x] **A2** — Removed `console.log` debug statement from `lib/utilityapi.ts`
- [x] **A3** — Moved hardcoded support email to `NEXT_PUBLIC_SUPPORT_EMAIL` env var
- [x] **A4** — Standardized `ADMIN_EMAIL` in `lib/email.ts` to use env var
- [x] **A5** — Updated stale "Canopy Light palette" → "Sendrow palette" in `app/globals.css`
- [x] **A6** — Removed dead `bg-canopy-text` Tailwind class from `components/ui.tsx`
- [x] **A7** — Deleted dead `lib/ratelimit.ts` (re-created with proper IP-based implementation)
- [x] **A8** — QB callback errors now write to `logs/errors.log` via `lib/logger.ts`

## Smoke Tests

- [x] **T1** — Vitest setup; calc engine smoke tests (`test/calc.test.ts`) — 12 tests
- [x] **T2** — Section status smoke tests (`test/progress.test.ts`) — 12 tests
- [x] **T3** — Emission factor smoke tests (`test/factors.test.ts`) — 18 tests
- [x] **T4** — All 42 tests pass. TypeScript clean (0 errors).

---

## Plan D — Stripe Billing Integration (2026-06-26)

- [x] **D1** — `lib/stripe.ts` — Stripe client + `createCheckoutSession()`
- [x] **D2** — `app/api/checkout/verify/route.ts` — GET: verify payment + update Clerk metadata
- [x] **D3** — `app/api/webhooks/stripe/route.ts` — handle checkout.session.completed + subscription cancellations
- [x] **D4** — `app/api/billing/portal/route.ts` — billing portal for consultants
- [x] **D5** — `app/checkout/page.tsx` — plan picker or immediate Stripe redirect
- [x] **D6** — `app/checkout/success/page.tsx` — verify, reload session, redirect
- [x] **D7** — `middleware.ts` — payment gate on all app routes (skipped if no STRIPE_SECRET_KEY)
- [x] **D8** — `lib/actions.ts` — onboarding now redirects to `/checkout?plan=...`
- [x] **D9** — `app/pricing/page.tsx` — CTAs updated to `/signup?plan=...`
- [ ] **D10** — Set up Stripe webhook in dashboard + add `STRIPE_WEBHOOK_SECRET` to Vercel (user action)
