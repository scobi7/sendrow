# First Customer Readiness — Sendrow

## Status: Ready for first customer with caveats below

### What works today

| Feature | Status |
|---------|--------|
| Company onboarding (signup → setup wizard) | Ready |
| QuickBooks OAuth + demo mode | Ready |
| UtilityAPI + demo mode | Ready |
| Scope 1 manual inputs | Ready |
| Scope 2 (location + market-based) | Ready |
| Scope 3 (spend-based + commuting + waste + other) | Ready |
| Social & Governance sections | Ready |
| GHG Inventory PDF report | Ready |
| Audit trail (all changes logged) | Ready |
| Questionnaire helper (CDP, EcoVadis, Walmart) | Ready |
| JSON + ZIP data export | Ready |
| Consultant dashboard + client management | Ready |
| Invite token flow (consultant → company) | Ready |
| Email notifications (welcome, section complete, invite) | Ready |
| Admin emission factor overrides (/admin/factors) | Ready |
| 404 and error pages | Ready |
| Terms of Service page (stub) | Ready (needs legal copy) |
| Privacy Policy page (stub) | Ready (needs legal copy) |

### Not yet done — needed before public launch

| Item | Priority | Notes |
|------|----------|-------|
| **Billing / Stripe integration** | P0 | No way to charge customers. Needs subscription gating. |
| **ToS & Privacy legal review** | P0 | Stubs exist; attorney review required |
| **ADMIN_CLERK_ID env var** | P0 | Set this before deploying to protect /admin route |
| **Production env vars** | P0 | ADMIN_EMAIL, SUPPORT_EMAIL, FROM_EMAIL, RESEND_API_KEY must all be set |
| **Calendly links** | P1 | Currently point to personal Calendly; switch to business account |
| **eGRID coverage** | P2 | Only 5 US regions mapped; ~40 states default to national average |
| **Multi-year reporting** | P3 | Single fiscal year only today |
| **Welcome email sequence** | P3 | Only one email sent at sign-up; no follow-up nurture |

### Required environment variables checklist

```
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
ADMIN_CLERK_ID=          # Your Clerk user ID — protects /admin route

# Database
DATABASE_URL=            # Neon connection string

# Email (Resend)
RESEND_API_KEY=
FROM_EMAIL=hello@sendrow.app
ADMIN_EMAIL=             # Where demo/quote notifications go
NEXT_PUBLIC_SUPPORT_EMAIL=hello@sendrow.app

# App
NEXT_PUBLIC_APP_URL=https://sendrow.app

# Integrations (optional — demo mode if absent)
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
QUICKBOOKS_REDIRECT_URI=
QUICKBOOKS_ENV=production
UTILITYAPI_KEY=
UTILITYAPI_FORM_URL=
```

### Architecture notes for first customer call
- All emissions calculated server-side on every save (`recalcCompany` in `lib/calc.ts`)
- Factors sourced from EPA GHG Hub, eGRID 2024, USEEIO v2.0, IPCC AR6, EPA WARM
- Full audit trail in `gt_audit_log` table — every field change with prev/next values
- Scope 2 reports both location-based and market-based
- QB integration uses spend-based USEEIO methodology (Category 1, 4, 6 Scope 3)
- Rate limiting applied to demo form and agency quote form (5 req/hour/IP)
