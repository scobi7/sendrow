# NEXT.md
> End-of-session summary. For build priorities see ROADMAP.md; for the active plan see PLANS.md.
> Last updated: 2026-07-07 (Plan I build session)

## 🔴 P0 — Ops blockers (user actions, not build work)
| # | What | Where |
|---|------|-------|
| 1 | Clerk production Google OAuth | Clerk dashboard → Social connections → Google |
| 2 | Attorney-reviewed ToS & Privacy copy | `app/terms/page.tsx`, `app/privacy/page.tsx` |
| 3 | `STRIPE_WEBHOOK_SECRET` in Vercel | Vercel env vars |
| 4 | Re-enable payment gate before charging customers | `middleware.ts` |
| 5 | Update Calendly links | `app/demo/page.tsx`, `app/pricing/agency/page.tsx` |

## 🟡 Current state
- **Plan I (Integrity Release) built 2026-07-07** — all 16 tasks complete, 136/136 tests, tsc clean, pushed to `github-branch-tracking`. See `success/plan-i.md`.
- Migration `0003_eager_ikaris.sql` (line-item `status` column + Plan H tables) auto-applies on next deploy via the build script.
- Emails only fire with `RESEND_API_KEY` set (already in Vercel per Plan C).
- Manual QA of full company flow (signup → wizard incl. boundary → screening → intake → upload with a messy file → workpaper → PDF) still needed before first paying customer.

## ⚠ Flags found during the build (need a decision or follow-up)
1. **Factor values are still "representative"** — the 22 new eGRID and 14 new USEEIO factors follow the existing `SEED_FACTORS` convention (demo values approximating published data). Before defending "audit-grade" to a real client, load the actual EPA eGRID 2024 + USEEIO v2 releases. Candidate for Plan J or a data-only task.
2. **H9 was checked off but never landed** — `/intake` still lists mapping profiles, not intake sessions with status badges (last touched in Plan F). Small gap; sessions do show on the dashboard.
3. **Ingestion electricity default changed** — spreadsheet kWh rows previously picked CAMX (California) implicitly (first category match); now explicitly pinned to national average `egrid.USAVG.2024`. Forward-only; documented in the calc log of new imports.

## 🟢 Next session
1. Manual QA pass (above), verifying contracts/ invariants against live behavior
2. Plan J (Revenue Release) — draft PLANS.md for approval: annual Stripe subscription, data quality scorecard, renewal-year flow

## Completed (recent)
| Item | Status |
|------|--------|
| Plan I — onboarding gates, full eGRID map, QB→USEEIO 9→29, silent drops killed, review-queue emails | ✅ 2026-07-07 |
| Plan H — sessions, scoring, auto-routing, review queue, data requests, pipeline lock | ✅ 2026-07-07 |
| Plan G — reporting framework, Scope 3 screening page, data-type intake, fleet fuel $, PDF from line items | ✅ 2026-07-06 |
| Plan F — ingestion pipeline: fuzzy match, mapping profiles, emission_line_items, factor engine, workpaper | ✅ 2026-07-06 |
| Plans A–D — cleanup, first-customer readiness, domain/email, Stripe billing | ✅ 2026-06-26 |
