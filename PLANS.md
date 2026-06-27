# PLANS.md
> Plan E approved implicitly ("yea go ahead and build").

---

## Plan E — Last Touches (2026-06-27)

### What's being built

| # | What | Details |
|---|------|---------|
| E1 | **Footer** | `LandingFooter` component — © Sendrow, Terms, Privacy, contact@sendrow.app. Added to all marketing pages. |
| E2 | **Calendly → env var** | `NEXT_PUBLIC_CALENDLY_URL` with fallback. User sets in Vercel when they have a business Calendly. |
| E3 | **Billing portal in Settings** | Replace placeholder text with real "Manage billing →" link to `/api/billing/portal` |
| E4 | **Terms/Privacy banner → env-gated** | Draft warning banner only shows if `NEXT_PUBLIC_DRAFT_LEGAL=true`. User removes it by deleting that env var when legal copy is ready. |
