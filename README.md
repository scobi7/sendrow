# Sendrow

The system of record for supplier emissions data, operated through sustainability consultants. See `GOALS.md` for the full product thesis — this file is just "how do I run it and where does everything live."

A consultant sends a client (supplier) a data request. The client responds through a magic-link portal — no account, upload or type it in, evidence attached to every figure. The consultant reviews, approves, and freezes a dated **snapshot** — the only thing ever shared externally, reshaped into whatever format the recipient needs (CDP/EcoVadis/Walmart questionnaire mapping, Excel, a draft SB 253 report, a PACT-shaped JSON draft).

**Consultants are the only paying customer.** Suppliers are always free to respond. Buyers (large companies demanding this data) are a 2027+ phase, not built.

## Run it

```bash
npm install
npm run dev
```

Needs `DATABASE_URL` (Neon Postgres), Clerk keys, and the other env vars below. Without `BLOB_READ_WRITE_TOKEN`, evidence uploads still record a sha256 hash but the file bytes aren't stored (the UI says so honestly, it doesn't fail silently).

## What's real vs. what's a placeholder

**Real:** the calculation engine, append-only audit log, magic-link portal with evidence hashing, snapshot freeze + restatement diffing, vendor-mapping and file-format memory (workspace-scoped), multi-office per-site collection, Stripe webhook wiring.

**Placeholder, not yet production-grade:**
- Emission factor *values* are labeled "representative" in `lib/factors.ts` — correct methodology, not the final EPA eGRID2024/USEEIO v2.5 dataset. Don't use current numbers on a real filing.
- The questionnaire-mapping helper (`lib/mapping.ts`) only supports 3 named buyers (CDP, EcoVadis, Walmart) via hardcoded branches — the config-driven format engine (the actual moat) isn't built yet.
- The PACT JSON export is a self-labeled draft (company-level totals in a PACT-shaped envelope), not conformance-tested against the real PACT Network spec.
- Billing/checkout gate is disabled in `middleware.ts` during active development.
- No DB-level row-level security — tenant isolation is app-layer (`ownsClient()` checks) plus a static contract test (`test/separation.test.ts`).

## Where things live

- `GOALS.md` — product thesis, business model, who pays, what's explicitly out of scope
- `ROADMAP.md` — phase status against the build-order source of truth
- `PLANS.md` — plan history (one-line-per-shipped-plan table) + what's still in flight
- `TASKS.md` — the live open-work list; this is the one to read for "what's broken / not done"
- `NEXT.md` — end-of-session state: what changed, what only Malachi can do, what's next
- `contracts/invariants.md` — hard rules that must never be violated (tenant isolation, snapshot immutability, config-not-code, etc.)
- `docs/` — research and design-direction docs (dated; check the date before trusting one as current)
- `test/` — unit tests (`npm test`)

## Architecture notes

- Next.js 15 App Router, Clerk v6 auth, NeonDB + Drizzle, Vercel Blob for evidence/branding, Stripe for billing (wired, gate disabled).
- Two calculation code paths currently exist: `lib/calc.ts` (tons-based, feeds the consultant's manual "manage/scope1-3" entry screens) and `lib/factor-engine.ts` (kg-based, feeds the portal-ingested line-item ledger). Both read the same factor table independently — see `TASKS.md` CALC-2 for a known inconsistency between them on market-based Scope 2.
- `npm run build` runs `drizzle-kit push --force` before `next build`, so schema changes apply automatically on deploy.
