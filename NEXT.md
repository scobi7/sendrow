# NEXT.md
> Summary table of what needs to be done next. Updated at end of each session.
> Last updated: 2026-07-07

---

## 🔴 P0 — Blocking

| # | What | Why | Where |
|---|------|-----|-------|
| N1 | **Clerk production Google OAuth** | Users want Google sign-in; currently requires email/password | Clerk dashboard → Social connections → Google |
| N2 | **ToS & Privacy legal copy** | Stub pages exist — need attorney-reviewed copy | `app/terms/page.tsx`, `app/privacy/page.tsx` |
| N3 | **Stripe webhook secret** | Billing webhooks will silently fail without it | Vercel → `STRIPE_WEBHOOK_SECRET` |

---

## 🟡 P1 — Important (smooth first customer experience)

| # | What | Why | Where |
|---|------|-----|-------|
| N4 | **Full company flow QA** | Sign-up → onboarding → intake → scope3 screening → workpaper → PDF report | Manual QA with real data |
| N5 | **Re-enable payment gate** | Currently commented out in middleware — must re-enable before charging customers | `middleware.ts` |
| N6 | **PDF report end-to-end test** | Test with imported line items vs legacy gt_calcs fallback | Manual QA with seeded data |
| N7 | **Consultant multi-client mode** | One account = one company today; consultants need to manage multiple | Future plan |
| N8 | **Update Calendly links** | Demo and agency pages link to personal calendly | `app/demo/page.tsx`, `app/pricing/agency/page.tsx` |

---

## 🟢 P2 — Nice-to-have

| # | What | Why | Where |
|---|------|-----|-------|
| N9 | **Expanded eGRID state mapping** | ~40 states default to national average — inaccurate for most US regions | `lib/factors.ts` → `egridForState()` |
| N10 | **More QB → USEEIO category mappings** | Only 9 categories mapped; uncategorized spend silently ignored | `lib/factors.ts` |
| N11 | **Onboarding email sequence** | Single welcome email only; no nudge when users stall | `lib/email.ts` + scheduled job |
| N12 | **In-app help tooltips** | Refrigerant GWP, eGRID subregion, USEEIO — confusing without context | Scope pages |

---

## 🔵 P3 — Backlog

| # | What | Why | Where |
|---|------|-----|-------|
| N13 | **Multi-year trend reporting** | Customers need YoY emissions reduction tracking | New reporting periods table |
| N14 | **Emissions reduction target setting** | Natural next step after establishing a baseline | `app/(app)/targets/` |
| N15 | **CSRD / SEC questionnaire format** | Regulatory demand growing | `lib/mapping.ts` |
| N16 | **White-label for agencies** | Consultant-tier want their branding on client pages | Theming system |
| N17 | **Multi-user per company** | One user per company today; enterprises need team access | Schema: `userCompanies` → many-to-one |

---

## Completed (2026-07-06 / 07-07)

| Item | Status |
|------|--------|
| Plan F — V1 spreadsheet ingestion pipeline (fuzzy match, mapping profiles, emission_line_items, workpaper) | ✅ |
| Plan G — Full client pipeline (reporting framework, scope3 screening, data-type intake, fleet fuel $, PDF from line items) | ✅ |
| Clerk production instance set up (DNS CNAMEs, live keys in Vercel) | ✅ |
| DB migrations auto-run on deploy (drizzle-kit push in build script) | ✅ |
| Post-login redirect → /onboarding (fixes new-user dashboard loop) | ✅ |
| Null guards on all app pages (redirect to /onboarding if no company) | ✅ |
| Payment gate disabled for dev testing | ✅ |
| 63/63 tests passing | ✅ |
