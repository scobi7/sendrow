# ROADMAP.md — Build Order
> Sendrow = the system of record for supplier emissions data, consultant-operated (GOALS.md). Build order source of truth: **Masao's pipeline, `docs/build-pipeline-2026-07-10.pdf`** — work top to bottom, don't skip ahead. Active plan detail: PLANS.md.
> Last updated: 2026-07-12

## Status by pipeline phase
| Phase | Goal | Status |
|-------|------|--------|
| 1 — Core loop | request → respond → evidence → approve → snapshot, flawless | ✅ built + hardened (U1) |
| 2 — Demo readiness | demo anyone in 5 minutes; Kerri-ready | ✅ built (U2; `scripts/reset-demo.ts`) |
| 3 — Format engine | "answer once, output many formats" as config — the moat | 🔨 NEXT (U3; SB 253 + Kerri configs blocked on Masao) |
| 4 — Supplier trust | claimable accounts, attestation, export, delegation | queued (U4) |
| 5 — Audit depth | method labels, trust badges, factor versioning, IMP | queued (U5) |
| 6 — Retention engine | calendar, digests, hotspots, score-gap flags | queued (U6, after design partner) |
| Parallel | PACT V3 data model · SOC 2 readiness practices | ongoing |

## Explicitly LATER (do not build)
AI suggestions · buyer features (2027) · QuickBooks/utility integrations · peer benchmarking · EPR module · referral-routing software (spreadsheet).

## Standing P0 ops (user actions — tracked in NEXT.md)
Vercel env (`BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`, `ADMIN_CLERK_ID`) · real eGRID/USEEIO factor data · Clerk prod Google OAuth · attorney ToS (tool-not-advice) · Calendly links · production deploy of v2.

## Key facts in force
SB 253 first Scope 1/2 deadline **Aug 10, 2026** · 2027 = Scope 3 + limited assurance (**ISSA 5000**) · **PACT V3 only** · vendor memory workspace-scoped.
