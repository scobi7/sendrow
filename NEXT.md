# NEXT.md
> Current state + what only the user can do. History lives in git; build order in PLANS.md; UI spec: `docs/wireframes-2026-07-13.md`.
> Last updated: 2026-07-23

## 🟢 Where the product stands
- **Active branch = `sendrow-v3`.** `sendrow-v2` holds Plan X (demo-feedback fixes) + Plan D (Azoulay prep). `main` = production (742405c), still **pre-Plan-X**. Deploying v2 or v3 to main runs a drizzle push (adds nullable comment columns — additive, safe). **Deploy = your call.**
- **Dashboard: pipeline board was built (Y1) then REVERTED to the old stat-cards + table view** (2026-07-23, Malachi preferred the old style). `pipelineStage()` in `lib/client-status.ts` + `components/pipeline-board.tsx` are kept but UNUSED — easy to toggle the board back later.
- **Portal upgrades (2026-07-23, big):**
  - **Multiple files per checklist item (up to 12)** — a supplier can upload separate electricity + gas sheets, or 12 monthly bills, to one item. Explicit "+ Add another file (N of 12 added)" button.
  - **Batch-submit / true staging** — confirmed files are held CLIENT-SIDE (never hit the server or consultant) until one sticky "Submit all N files to your consultant" button. Item badges: "N staged" (amber) → "N sent" after submit. Verified live E2E: ledger stayed empty while staged, Submit → data landed. Tradeoff: closing the tab before Submit loses staged uploads (manual-entry rows still auto-save as draft).
- **Bug fixes (2026-07-23):** BUG-2 (repointed review emails + deleted orphan `/consultant/review`), BUG-3 (loading.tsx skeletons), BUG-5 (board scroll pad), BUG-8 (flag replies now visible to consultant), + **`File is not defined` on Node <20 that silently killed all file uploads** (import route now duck-types the Blob). SB 253 date → Nov 10 everywhere.
- **Plan X (on v2, not yet deployed):** portal crash-proofing + PDF path, completeness fix, supplier↔consultant flag/reply loop, review-page flags, clarity pass, QuickBooks/connections removed, minimal /for-companies, emoji + em-dash sweep.
- **QA:** full page-by-page sweep + mutation pass done → TASKS.md "BUGS". Core flows verified live (create request, reply-to-flag, approve/freeze, share, portal staged-submit). Open: **BUG-9 diesel/propane use the gasoline factor** (auto-mapper can't disambiguate); BUG-1 /admin/factors hydration hang; email + evidence blocked on env. **QA test kit** in `~/Downloads/qa-*.csv` (+ combined) with ground-truth calcs — Malachi cross-referencing.
- **Demo kit:** demo consultant `contact@sendrow.app` (Clerk `user_3GVr5Css8qERqxyWiySrhNeX3WF`), reseed w/ `npx tsx scripts/reset-demo.ts user_3GVr5Css8qERqxyWiySrhNeX3WF` before each demo · pitch deck (12 slides, editable PPTX in ~/Downloads): https://claude.ai/code/artifact/8cfbdcd9-aa65-4226-a901-92d46bc1b2e7
- **Theme:** Aurora Green. Tests: **218/218** · tsc + `next build` clean.

## 🔴 Only you can do these
| # | What | Where |
|---|------|-------|
| 1 | **Deploy decision:** ship `v3` (all the portal/bug work) and/or `v2` (Plan X) to `main`? Everything since v2 prod is on v3 | decision |
| 2 | Vercel env: `BLOB_READ_WRITE_TOKEN` (evidence/logos), `CRON_SECRET` (reminders), `ADMIN_CLERK_ID` (/admin) — unblocks BUG-B1/B2 | Vercel → env vars |
| 3 | Resend: verify sending domain so request/reminder/reply emails deliver — the "client gets a link" beat depends on it | Resend |
| 4 | Get from Masao: CARB SB 253 draft template + Kerri's buyer questionnaire (unblocks W3 format engine) | Masao |
| 5 | Real EPA eGRID 2024 / USEEIO v2 factor values → /admin/factors (BUG-1 gates this) | datasets |
| 6 | Discovery (Plan Y2): confirm who at the supplier does the data work; validate consultant need before pricing | consultant convos |

## 🟡 Next build — choose next
- **BUG-9 (quick, high-value): fix diesel/propane factor** so fuel isn't calculated with the gasoline factor. Small change to `resolveFactorQuery` + `lookupFactor` to pass the specific fuel type.
- **Y3 conversion P0** (highest leverage; "if we can't extract data we're cooked"): early-engagement reminder 48-72h after send, checklist+time in the request email, per-item progress on portal, named-buyer "why" framing.
- Optional: draft-persistence for staged uploads (survive tab close); Excel-serial-date parsing (files opened in Excel show dates as `45657.66`).
- Then W3 format engine (blocked on Masao's templates).

## Key corrections in force (from the pipeline doc)
SB 253 first Scope 1/2 deadline = **Nov 10, 2026** (confirmed 2026-07-21) · assurance term = **ISSA 5000** · **PACT V3 only** · vendor memory **workspace-scoped** (global/cross-platform = LATER) · referral routing stays Masao's spreadsheet.
