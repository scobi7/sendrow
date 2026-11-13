# Sendrow

The system of record for supplier emissions data, operated through sustainability consultants. This file is just "how do I run it." Project rules, status and decisions live in `CLAUDE.md` and `docs/`.

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

- `CLAUDE.md`: what the project is, the working rules, and the full folder map. Start here.
- `docs/progress.md`: current state, what's next, what only Malachi can do
- `docs/decisions.md`: what's settled and why (product thesis, out-of-scope list, key dates)
- `docs/known-issues.md`: gotchas and their fixes
- `docs/plan-w-spec.md`: build spec for the open phases
- `contracts/invariants.md`: hard rules that must never be violated (tenant isolation, snapshot immutability, config-not-code, etc.)
- `test/`: unit tests (`npm test`)

## Architecture notes

- Next.js 15 App Router, Clerk v6 auth, NeonDB + Drizzle, Vercel Blob for evidence/branding, Stripe for billing (wired, gate disabled).
- Two calculation code paths currently exist: `lib/calc.ts` (tons-based, feeds the consultant's manual "manage/scope1-3" entry screens) and `lib/factor-engine.ts` (kg-based, feeds the portal-ingested line-item ledger). Both read the same factor table independently; see `docs/known-issues.md` before changing either.
- `npm run build` runs `drizzle-kit push --force` before `next build`, so schema changes apply automatically on deploy.
