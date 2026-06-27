# NEXT.md
> Summary table of what needs to be done next. Updated at end of each session.
> Last updated: 2026-06-27

---

## 🔴 P0 — Blocking (must ship before first paying customer)

| # | What | Why | Where |
|---|------|-----|-------|
| N2 | **ToS & Privacy legal copy** | Stub pages exist but have "draft" warning banners — needs attorney-reviewed copy | `app/terms/page.tsx`, `app/privacy/page.tsx` |

---

## 🟡 P1 — Important (smooth first customer experience)

| # | What | Why | Where |
|---|------|-----|-------|
| N5 | **Update Calendly links** | Demo and agency pages link to personal `calendly.com/malachinguyenn` | `app/demo/page.tsx`, `app/pricing/agency/page.tsx` |
| N6 | **Full company flow QA** | No one has run sign-up → pay → connect → scope → report end-to-end with live API keys | Manual QA |
| N7 | **Consultant invite flow QA** | add-client → invite token → company accept → consultant sees progress | Manual QA |
| N8 | **PDF report end-to-end test** | `/api/report/pdf` untested against a real populated company | Manual QA with seeded data |
| N9 | **Footer with ToS / Privacy links** | Marketing pages have no footer — B2B prospects will look for legal links | Landing pages |
| N10 | **Verify Vercel git integration** | Repo renamed `greentrack` → `sendrow`; Vercel may still point to old name | Vercel dashboard |

---

## 🟢 P2 — Nice-to-have (conversion + retention)

| # | What | Why | Where |
|---|------|-----|-------|
| N11 | **Expanded eGRID state mapping** | ~40 states default to national average — inaccurate for most US regions | `lib/factors.ts` |
| N12 | **More QB → USEEIO category mappings** | Only 9 categories mapped; uncategorized spend silently ignored | `lib/factors.ts` |
| N13 | **Onboarding email sequence** | Single welcome email only; no nudge when users stall | `lib/email.ts` |
| N14 | **In-app help tooltips** | Refrigerant GWP, eGRID subregion inputs confuse non-experts | Scope pages |
| N16 | **CSV / manual spend import** | Companies without QuickBooks need another way to enter Scope 3 data | Scope 3 page |

---

## 🔵 P3 — Backlog (future growth)

| # | What | Why | Where |
|---|------|-----|-------|
| N17 | **Multi-year trend reporting** | Customers need YoY emissions reduction tracking | New reporting periods table |
| N18 | **Emissions reduction target setting** | Natural next step after baseline | `app/(app)/targets/` |
| N19 | **CSRD / SEC questionnaire format** | Regulatory demand growing | `lib/mapping.ts` |
| N20 | **Full Scope 3 category coverage** | 6 of 15 GHG Protocol categories covered | `lib/calc.ts`, `lib/factors.ts` |
| N21 | **White-label for agencies** | Consultant-tier customers want their branding | Theming system |
| N22 | **Multi-user per company account** | One user per company today | Schema migration |
| N23 | **Rate limiter → Redis/Upstash** | In-memory rate limiter resets on cold start | `lib/ratelimit.ts` |

---

## Completed (2026-06-25 → 2026-06-27)

| Item | Status |
|------|--------|
| Logo: G → Sendrow SVG mark | ✅ |
| Codebase cleanup — stale refs, dead code, debug logs | ✅ |
| lib/logger.ts — errors write to logs/errors.log | ✅ |
| /admin route protected in middleware via ADMIN_CLERK_ID | ✅ |
| Rate limiting wired to demo + agency quote | ✅ |
| /terms and /privacy stub pages | ✅ |
| 404 and global error page | ✅ |
| SubmitButton with useFormStatus | ✅ |
| 42 smoke tests passing | ✅ |
| Suspense on login/signup — fixes blank flash | ✅ |
| sendrow.app domain registered (Cloudflare) | ✅ |
| App live at sendrow.app (Vercel DNS) | ✅ |
| Zoho Mail — malachi.nguyen@sendrow.app + contact@sendrow.app + masao.honda@sendrow.app | ✅ |
| Resend domain verified on sendrow.app | ✅ |
| All production env vars set in Vercel | ✅ |
| ADMIN_CLERK_ID set in Vercel | ✅ |
| Stripe billing — checkout, webhooks, payment gate | ✅ |
| Stripe webhook registered + STRIPE_WEBHOOK_SECRET in Vercel | ✅ |
