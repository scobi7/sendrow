# NEXT.md
> Current state + what only the user can do. History lives in git; build order in PLANS.md; priorities source: `docs/build-pipeline-2026-07-10.pdf`.
> Last updated: 2026-07-12

## 🟢 Where the product stands
- **Branch `sendrow-v2`** = active, all work pushed. `main` (production, sendrow.app) is **stale** — deploying v2 to prod is your call.
- **Built end-to-end:** request → magic-link portal (confirm-mapping, walkthrough, save-&-resume, stuck button, templates) → evidence + events logged → ledger review (recategorize/exclude/mark-actual/comments/$-fuel conversion) → immutable snapshots → restatement alerts → exports (Excel / SB 253 draft / questionnaire CSV / PACT draft) → white-label portal/emails/shared results.
- **Theme:** Aurora Green (your mockup) — glass cards, aurora orbs, Plus Jakarta + JetBrains Mono; landing rebuilt to the mockup layout.
- **Demo:** `npx tsx scripts/reset-demo.ts` seeds 3 clients at 3 stages; run before every demo.
- Tests: 199/199 · tsc + build clean.

## 🔴 Only you can do these
| # | What | Where |
|---|------|-------|
| 1 | Vercel env: `BLOB_READ_WRITE_TOKEN` (evidence/logos), `CRON_SECRET` (reminders), `ADMIN_CLERK_ID` (/admin) | Vercel → env vars |
| 2 | Get from Masao: CARB SB 253 draft template + Kerri's buyer questionnaire (unblocks U3), scoring rubrics (U6) | Masao |
| 3 | Real EPA eGRID 2024 / USEEIO v2 factor values → /admin/factors — **pre-deliverable blocker** | datasets |
| 4 | Decide production deploy of v2; Clerk prod Google OAuth; Calendly links; attorney ToS (tool-not-advice) | various |

## 🟡 Next build: U3 — the format engine as config
Masao's "most careful engineering" phase: versioned template registry (formats as data, not code — Ground Rule #1), admin mapping builder, template versioning, answer-once/share-many. U3.1/2/3 can start without the blocked inputs; the SB 253 + Kerri configs slot in when files arrive.

## Key corrections in force (from the pipeline doc)
SB 253 first Scope 1/2 deadline = **Aug 10, 2026** · assurance term = **ISSA 5000** · **PACT V3 only** · vendor memory **workspace-scoped** (global/cross-platform = LATER) · referral routing stays Masao's spreadsheet.
