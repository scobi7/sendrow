# GreenTrack — MVP (Company Customer Flow)

ESG compliance software for California mid-market companies. This is the **pitch-ready MVP**: the full 16-screen direct-customer flow from the Product Bible, with a real calculation engine, versioned emission-factor library, append-only audit trail, and report generation. QuickBooks and utility connections are **simulated** with realistic, industry-scaled sample data (real OAuth is a production step — see roadmap below).

## Run it

Requires Node.js 18+ (check with `node -v`; install from nodejs.org if needed).

```bash
cd greentrack-app
npm install
npm run dev
```

Open http://localhost:3000.

## Demo script for pitches (~5 minutes)

1. **Landing page** — the one-sentence pitch. For live pitching, click **"View a demo company"** at the bottom: it logs you into *Pacific Coast Logistics*, a fully populated 240-person logistics company (login: `demo@pacificcoastlogistics.example` / `greentrack-demo`).
2. **Dashboard** — show the progress checklist and the live emissions summary. "This is what your ops manager sees — no sustainability expertise required."
3. **Connections** — show the QuickBooks and utility cards and the *Review What We Pulled* tables. "We connect read-only to systems you already have. This is where months of data gathering disappear."
4. **Scope 2** — show dual location/market-based reporting and the REC section. "Most CA companies don't realize their green tariff already lowers their reportable number."
5. **Scope 3** — show pre-filled travel/purchased-goods/freight from spend data, plus the skip-with-justification options. "First-time reporters aren't penalized for incomplete data — every skip is documented."
6. **Reports** — run the pre-flight checklist, open the **GHG Inventory Report** (print to PDF from the browser), then the **Questionnaire Helper**: pick *Walmart* or *CDP* and show the field-by-field mapping. This is the money screen — "here's exactly what to paste into your customer's portal."
7. **Audit Trail** — open it last. "Every number traces to its source, factor, and formula. This is what separates us from a spreadsheet."
8. **Gap Analysis** — close with the retention story: "next year's to-do list lives here."

To demo the *empty → complete* journey instead, sign up fresh and walk the setup wizard + connect buttons live (each connect pulls in sample data instantly).

## What's real vs. simulated

**Real:** server-side calculation engine; versioned emission-factor table with sources (EPA Factors Hub, eGRID, USEEIO, IPCC AR6, WARM); append-only audit log on every field change; section completion logic and pre-flight gating; GHG report with methodology + data-quality notes; questionnaire mappings (CDP / EcoVadis / Walmart / Generic); gap analysis; auth with scrypt-hashed passwords and signed 24h session cookies; data export.

**Simulated / deferred:** QuickBooks OAuth and UtilityAPI (sample data generators in `lib/mockdata.ts`, deterministic per company); file uploads to S3 (checkbox placeholders); Stripe billing; email sending. The emission-factor *values* are representative of the cited sources — verify each against the source before any real customer submission.

**Architecture note:** persistence is a JSON file (`data/db.json`) behind a thin data-access layer (`lib/store.ts`). Every accessor takes a company ID, so swapping to Postgres with row-level security is a contained change, not a rewrite.

## Path to production (post-pitch)

Best done in Claude Code in your terminal, where a live dev server, real API keys, and deployments are available:

1. **Postgres + row-level security** — replace `lib/store.ts` with Prisma/Drizzle on Postgres (Supabase or Neon). RLS keyed to company ID at the DB level, per the Product Bible. Move the audit log to a DB trigger.
2. **QuickBooks OAuth** — Intuit developer account → OAuth 2.0 (developer.intuit.com), pull Bill/Purchase objects, automatic token refresh (60-min expiry). Note Intuit's data-out metering for the cost model.
3. **Utility data** — evaluate UtilityAPI vs Arcadia (coverage, per-account fee, docs), then integrate.
4. **S3 document storage** — signed URLs with 15-min expiry; naming `company_id/section/field/timestamp_filename`.
5. **Stripe** — Checkout + customer portal for the three company tiers (14-day trial, no card).
6. **Email** — Postmark/SendGrid: welcome, report-ready, annual reminder at FY-end minus 60 days.
7. **Hardening** — rate limiting on auth, HTTPS via the host (Vercel handles this), `npm audit` in CI, security scan before first real customer.
8. **Consultant platform** — Part 3 of the Product Bible: same data engine, junction table for consultant↔client, white labeling, team seats, Stripe per-active-client billing.

## Build verification status

`next build` passes cleanly (full type-check, all 22 routes compile). A live click-through on your machine is the remaining check: run it, click **View a demo company**, and walk the 8 demo steps above once before pitching.
