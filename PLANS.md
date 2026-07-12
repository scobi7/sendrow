# PLANS.md — Active Plan
> Full text of built plans lives in git history and `success/`. This file carries only what's in flight.

## Built (one line each)
| Plan | What | Shipped |
|------|------|---------|
| A–I | v1 company-first pipeline through integrity release | ≤ 2026-07-07 (branch `sendrow-v1`) |
| J | Practice platform: magic-link portal, vendor memory, referrals, trust pages | 2026-07-08 |
| V | "The Ledger" visual identity (superseded by Aurora Green) | 2026-07-08 |
| M | Company self-serve deleted from v2 (v1 is the archive) | 2026-07-08, cae02c1 |
| N | N1–N5+N7.1: contact emails, one workspace, evidence locker, periods/YoY, white-label + /shared, referral admin | 2026-07-08 (success/plan-n.md) |
| — | Master-doc alignment: system-of-record positioning, /how-it-works, §11 re-scope, §13/§14 | 2026-07-08, 4222c6e |
| T | Deliverable machine: Data Ledger, intake repair (confirm-mapping, unit norm, format memory), snapshots + restatements, reshaping v1 | 2026-07-09 (success/plan-t.md) |
| T5+QA | Spreadsheet-view mapping, sheet picker, header detection, stuck button, walkthrough, template CSV, $-fuel conversion, scoped vendor memory | 2026-07-09/10 |
| U1–U2 | Core loop hardened + demo-ready (see below) | 2026-07-10 |
| — | Aurora Green retheme + landing rebuilt to Malachi's mockup | 2026-07-10, 217cb94 |

---

# Plan U — The Build Pipeline (ACTIVE)

> Source of truth: Masao's priority list, `docs/build-pipeline-2026-07-10.pdf`. Ground rules as invariants: config-driven formats (§14a), snapshots-only sharing (§13), audit-everything, absolute client separation (ownsClient guard + contract tests), PACT V3 only, workspace-scoped vendor memory (§14b).

**U1 — BUILT** (03e55cf): reporting periods on requests, expired-link rescue, unified event log + Activity page + CSV export, prefill-from-last, comment threads, portal save-&-resume, estimate/actual flags, per-row evidence.

**U2 — BUILT** (89d55d9): demo workspace (`npx tsx scripts/reset-demo.ts`), client-separation contract tests (caught + fixed real cross-client holes), "Powered by Sendrow" footer, engagement templates, deadline-relative chasing (7/2/0/overdue + per-request pause), NAICS capture, submission notifications.

## U3 — The format engine as config (NEXT; the moat)
- **U3.1 Config-driven reshaping (#9):** refactor `lib/formats.ts` (hardcoded TS — violates Ground Rule #1) into a **versioned template registry** (DB): field mappings + layout as data, conditional/branching support (CDP routes questions by size/modules). Ship as configs: SB 253 (**against CARB's real Oct-2025 draft — Masao supplies**), generic Excel, one real buyer questionnaire (**Masao gets from Kerri**).
- **U3.2 Format Mapping Builder (#35):** admin tool — upload questionnaire, map questions to Sendrow fields once, save as reusable template. Adding a format = an afternoon of clicking.
- **U3.3 Template versioning (#33):** version on templates; snapshots/exports record the version used.
- **U3.4 Answer once, share many (#26) + duplicate detection (3.5):** overlapping request → offer the snapshot-share path.

## U4 — Supplier trust & stickiness
Free claimable supplier account (#24) · attestation checkbox (#37) · share receipts (#38) · supplier export PACT V3 + CSV (#25) · reply-by-email v1 unfiled inbox (#3; needs inbound-email provider) · section delegation (4.6) · deadline extension request (4.7) · supplier mini-report PDF, VSME skeleton (4.9). (#27 waits on Masao's calculator.)

## U5 — Audit-grade depth
Method labeling + % activity-based (#17) · methodology label schema relevant/recent/geo (#14) · trust badges per dataset AND metric (#15) · estimate→actual triggers restatements (#11) · factor-update recalc preview (#39) · vendor memory: remove global option, workspace-scoped only (#18) · consultant-side historical import (#36) · IMP generator (5.8).

## U6 — Retention engine (after first design partner)
Compliance calendar (#44, Masao owns dates) · monthly digest (#45) · commentary blocks (#43) · hotspot report (#40) · YoY narrative templates (#41) · score-gap flags (#42, blocked on rubrics) · completeness meter (6.7).

## Blocked on Masao
CARB SB 253 draft template (U3.1) · Kerri's buyer questionnaire (U3.1) · CDP/EcoVadis scoring rubrics (U6) · calculator data model (#27).

## Explicitly NOT building (doc's LATER list)
AI suggestions (#16) · buyer features (#28–30) · integrations (#34) · peer benchmarking (#47) · EPR (#50) · referral-routing software (#48 — Masao's spreadsheet; /admin/referrals frozen as-is).

## Verification per phase
Tests + tsc + build green; TASKS.md hydrated; commit + push to `sendrow-v2` per phase. U3 gets the deepest test coverage.
