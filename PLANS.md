# PLANS.md
> Awaiting human approval before any implementation begins.

---

## Plan A — Codebase Cleanup

### What I found

| # | File | Issue | Severity |
|---|------|--------|----------|
| 1 | `components/ui.tsx:13` | Logo square shows `"G"` (GreenTrack relic) — should be `"S"` | High — visible to all users |
| 2 | `lib/utilityapi.ts:57` | `console.log` debug statement leaks raw bill payload to server logs | Medium |
| 3 | `app/(app)/connections/page.tsx:287` | Support email `malachinguyenn@gmail.com` hardcoded in JSX | Medium |
| 4 | `lib/email.ts:5` | `ADMIN_EMAIL` hardcoded (not behind env var like the admin page uses) | Medium |
| 5 | `app/globals.css:6` | Comment says "Canopy Light palette" (old brand name) | Low |
| 6 | `components/ui.tsx:239` | Tailwind class `bg-canopy-text` — stale rebrand relic (non-breaking due to inline style override, but dead) | Low |
| 7 | `lib/ratelimit.ts` | Entire file is dead code — never imported anywhere in the project | Low |
| 8 | `app/api/auth/quickbooks/callback/route.ts:62` | `console.error` — fine to keep but should write to `logs/` instead | Low |

### Cleanup changes (all small, targeted)
- Fix logo letter `"G"` → `"S"`
- Remove `console.log` from utilityapi.ts
- Move support email to `process.env.SUPPORT_EMAIL` with `malachinguyenn@gmail.com` fallback
- Standardize `ADMIN_EMAIL` in `lib/email.ts` to use env var (already done in `admin/factors`)
- Update CSS comment: "Canopy Light palette" → "Sendrow palette"
- Remove dead `bg-canopy-text` class from InfoTip
- Delete `lib/ratelimit.ts` (dead file)
- Write QB callback error to `logs/errors.log` instead of stderr

---

## Plan B — First Customer Readiness: What's Missing

This is a summary of gaps between the current state and a live paying customer. Organized by priority.

### 🔴 Blocking (must-have before any customer goes live)

| Gap | Why it blocks |
|-----|---------------|
| **No payment/billing** — no Stripe, no subscription gating | Can't charge anyone; app is fully free with no paywall |
| **No Terms of Service page** | Legal requirement; B2B procurement will ask |
| **No Privacy Policy page** | Legal requirement; Clerk processes PII |
| **Rate limiting is wired but never called** — demo form, agency quote, and sign-up have no rate protection | Vulnerable to spam/abuse at launch |
| **Admin route (`/admin/...`) not protected in middleware** — only email-checked inside the page component | Any logged-in user can attempt the URL; security gap |

### 🟡 Important (needed for a smooth customer experience)

| Gap | Why it matters |
|-----|---------------|
| **No error page / 404 page** | Next.js falls back to default; looks unprofessional |
| **No loading states on server actions** — buttons don't disable during submission | Users can double-submit (especially on Resync, Connect) |
| **Calendly link is personal** (`calendly.com/malachinguyenn`) | Looks unprofessional on marketing pages |
| **Export routes unverified** — `/api/export` and `/api/export/zip` exist but haven't been tested | Customer may try to export data and hit a broken endpoint |
| **PDF report** — `/api/report/pdf` route exists; needs end-to-end verification | Core deliverable for the product |
| **No "forgot password" or account recovery flow** | Clerk handles it, but needs to be tested |
| **Welcome email is minimal** | One email with no follow-up or onboarding nudge sequence |

### 🟢 Nice-to-have (can ship without, but improves conversion)

| Gap | Description |
|-----|-------------|
| **Pricing page has no payment CTA** — shows tiers but no checkout | Users read pricing and have nowhere to go |
| **No customer-facing changelog** | Builds trust during early sales |
| **No in-app help/tooltips on complex fields** | Emission factor inputs can confuse non-experts |
| **eGRID subregion mapping is incomplete** — only 5 regions; many states default to national average | May be inaccurate for some customers |

---

## Execution Order (if approved)

1. **Plan A — Cleanup** (15-20 min, no approval risk)
2. **Admin route protection** in middleware (5 min, security fix)
3. **Rate limiting** — wire `checkRateLimit` to demo form and agency quote endpoints
4. **ToS + Privacy Policy** — stub pages (user writes content, I create the pages)
5. **Error/404 pages**
6. **Loading states** on server action buttons
7. **PDF + Export verification** — run the routes and confirm they produce correct output
8. Summary doc in `docs/` outlining what remains for billing/Stripe integration

> Items 2–8 each need their own TASKS.md cycle if you approve them.
> Billing/Stripe is a larger feature — needs its own plan.

---

## Approval

**Reply "approved" (or "approved A" / "approved B") to proceed.**
If you want to skip or modify anything, note it and I'll revise.
