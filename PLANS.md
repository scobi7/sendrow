# PLANS.md
> Awaiting human approval before any implementation begins.

---

## Plan D — Stripe Billing Integration (2026-06-26)

### Price IDs
- Company Report: `price_1TmhpRCXd6KQb0HdOVmsmqst` ($400 one-time)
- Consultant Plan: `price_1TmhqGCXd6KQb0HdpQyG12jp` ($300/mo subscription)

---

### How it works (user flow)

**Company:**
1. `/signup` → Clerk signup → redirect to Stripe Checkout ($400 one-time)
2. Pay → Stripe fires webhook → Clerk user metadata set: `{ plan: "company", planStatus: "active" }`
3. Redirect to `/onboarding` → `/dashboard`
4. Middleware blocks app access if no active plan → redirects to `/checkout`

**Consultant:**
1. `/signup?role=consultant` → Clerk signup → redirect to Stripe Checkout ($300/mo)
2. Pay → webhook → Clerk metadata: `{ plan: "consultant", planStatus: "active" }`
3. Redirect to `/consultant`
4. If subscription cancels → Stripe fires webhook → metadata updated → access revoked

---

### Files to create/modify

| # | File | What |
|---|------|------|
| D1 | `lib/stripe.ts` | Stripe client + helpers |
| D2 | `app/api/checkout/route.ts` | Create Stripe checkout session |
| D3 | `app/api/webhooks/stripe/route.ts` | Handle `checkout.session.completed`, `customer.subscription.deleted` |
| D4 | `app/api/billing/portal/route.ts` | Billing portal redirect for consultants |
| D5 | `middleware.ts` | Gate app routes behind active plan check |
| D6 | `app/checkout/page.tsx` | Checkout landing page (choose plan + redirect to Stripe) |
| D7 | `app/checkout/success/page.tsx` | Post-payment success page |
| D8 | `app/onboarding/page.tsx` | Update redirect after onboarding to go to checkout first |
| D9 | `app/pricing/page.tsx` | Update CTAs to go to `/checkout?plan=company` etc. |

### Env vars needed in Vercel
| Var | Where to get |
|-----|-------------|
| `STRIPE_SECRET_KEY` | Stripe → Developers → API Keys → Secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API Keys → Publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → signing secret (after creating webhook) |
| `STRIPE_COMPANY_PRICE_ID` | `price_1TmhpRCXd6KQb0HdOVmsmqst` |
| `STRIPE_CONSULTANT_PRICE_ID` | `price_1TmhqGCXd6KQb0HdpQyG12jp` |

### Webhook to set up in Stripe
- URL: `https://sendrow.app/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`

---

## Approval
Reply "approved" to proceed to TASKS.md and implementation.
