# NEXT.md
> Summary table of what needs to be done next. Updated at end of each session.
> Last updated: 2026-07-06

---

## 🔴 P0 — Blocking

| # | What | Why | Where |
|---|------|-----|-------|
| N2 | **ToS & Privacy legal copy** | Stub pages exist — need attorney-reviewed copy | `app/terms/page.tsx`, `app/privacy/page.tsx` |
| N3 | **Run DB migration in prod** | `0001_daffy_barracuda.sql` adds `gt_mapping_profiles` + `gt_emission_line_items` — required for intake/workpaper to work | Deploy to Vercel (auto-runs) or `drizzle-kit push` locally with `DATABASE_URL` |
| N4 | **Verify Vercel env vars** | `ADMIN_CLERK_ID`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` | Vercel dashboard |

---

## 🟡 P1 — Important (smooth first customer experience)

| # | What | Why | Where |
|---|------|-----|-------|
| N5 | **Update Calendly links** | Demo and agency pages link to personal `calendly.com/malachinguyenn` | `app/demo/page.tsx`, `app/pricing/agency/page.tsx` |
| N6 | **Full company flow QA** | No one has run sign-up → connect → scope → report with live API keys | Manual QA, QB + utility sandbox |
| N7 | **Consultant invite flow QA** | add-client → invite token → company accept → consultant sees progress | Manual QA |
| N8 | **PDF report end-to-end test** | `/api/report/pdf` is structurally correct but untested against a real populated company | Manual QA with seeded data |
| N9 | **Footer with ToS / Privacy links** | Marketing pages have no footer — B2B prospects will look for legal links | Landing pages + `app/layout.tsx` |
| N10 | **Verify Vercel git integration** | Repo renamed `greentrack` → `sendrow` on GitHub; Vercel may still point to old name | Vercel dashboard |

---

## 🟢 P2 — Nice-to-have (conversion + retention)

| # | What | Why | Where |
|---|------|-----|-------|
| N11 | **Expanded eGRID state mapping** | ~40 states default to national average (USAVG) — inaccurate for most US regions | `lib/factors.ts` → `egridForState()` |
| N12 | **More QB → USEEIO category mappings** | Only 9 categories mapped; uncategorized QB spend is silently ignored | `lib/factors.ts` → `QB_CATEGORY_TO_USEEIO` |
| N13 | **Onboarding email sequence** | Single welcome email only; no nudge when users stall at the Connections step | `lib/email.ts` + scheduled job |
| N14 | **In-app help tooltips** | Refrigerant GWP, eGRID subregion, USEEIO — confusing without context | Scope pages → `InfoTip` component |
| N15 | **Pricing page buy button** | Pricing page shows tiers but has no checkout CTA — depends on N1 (Stripe) | `app/pricing/page.tsx` |
| N16 | **CSV / manual spend import** | Companies without QuickBooks need another way to enter Scope 3 spend data | New upload flow in scope3 page |

---

## 🔵 P3 — Backlog (future growth)

| # | What | Why | Where |
|---|------|-----|-------|
| N17 | **Multi-year trend reporting** | Customers need YoY emissions reduction tracking | New: reporting periods table in schema |
| N18 | **Emissions reduction target setting** | Natural next step after establishing a baseline | New: `app/(app)/targets/` |
| N19 | **CSRD / SEC questionnaire format** | Regulatory demand growing; CDP + EcoVadis already covered | `lib/mapping.ts` |
| N20 | **Full Scope 3 category coverage** | 6 of 15 GHG Protocol Scope 3 categories covered; upstream/downstream missing | `lib/calc.ts`, `lib/factors.ts` |
| N21 | **White-label for agencies** | Consultant-tier customers want their branding on client-facing pages | Theming system |
| N22 | **Multi-user per company account** | One user per company today; enterprises need team access | Schema: `userCompanies` → many-to-one |
| N23 | **Rate limiter → Redis/Upstash** | In-memory rate limiter resets on cold start — breaks at scale | `lib/ratelimit.ts` → Upstash |

---

## Completed this session (2026-06-25)

| Item | Status |
|------|--------|
| Logo: G → Sendrow SVG mark | ✅ |
| Remove debug console.log from utilityapi | ✅ |
| All hardcoded emails moved to env vars | ✅ |
| Stale Canopy / GreenTrack brand refs removed | ✅ |
| lib/logger.ts — errors write to logs/errors.log | ✅ |
| /admin route protected in middleware via ADMIN_CLERK_ID | ✅ |
| Rate limiting wired to demo form + agency quote | ✅ |
| /terms and /privacy stub pages created | ✅ |
| 404 (not-found.tsx) and global error page (error.tsx) | ✅ |
| SubmitButton with useFormStatus — prevents double-submit | ✅ |
| 42 smoke tests passing — calc engine, progress, factors | ✅ |
| docs/first-customer-readiness.md written | ✅ |
| contracts/invariants.md, success/criteria.md | ✅ |
| Pushed to github.com/scobi7/sendrow main | ✅ |
