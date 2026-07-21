# NEXT.md
> Current state + what only the user can do. History lives in git; build order in PLANS.md; UI spec: `docs/wireframes-2026-07-13.md`.
> Last updated: 2026-07-21

## 🟢 Where the product stands
- **Active branch = `sendrow-v3` (CRM reshape, Plan Y).** `sendrow-v2` holds Plan X (demo-feedback fixes) + Plan D (Azoulay prep). `main` = production (742405c), still **pre-Plan-X**. Deploying v2 or v3 to main runs a drizzle push (adds nullable comment columns — additive, safe). **Deploy = your call.**
- **Y1 built (2026-07-21):** consultant home reshaped to a **Pipedrive-style pipeline board** — client book as a kanban (New / Requested / Responding / In review / Approved), cards w/ completeness, overdue, flags, "shared to X", next-action; stage is derived (no drag). Verified live against demo data: the 3 seed clients land in 3 columns. `pipelineStage()` in `lib/client-status.ts`.
- **Plan X (on v2, not yet deployed):** portal crash-proofing + PDF path, completeness fix, supplier↔consultant flag/reply loop, review-page flags, clarity pass, QuickBooks/connections removed, minimal /for-companies, emoji + em-dash sweep.
- **Bugs cataloged 2026-07-21** (full page-by-page sweep) → TASKS.md "BUGS" section. Headline: no page 500s or broken core links; real issues are missing `loading.tsx` (blank during 2-7s loads, looks like a hang), orphaned `/consultant/review` routes, `/admin/factors` hydration hang, slow authed loads. Email + evidence untested (blocked on env).
- **Demo kit:** demo consultant `contact@sendrow.app` (Clerk `user_3GVr5Css8qERqxyWiySrhNeX3WF`), reseed w/ `npx tsx scripts/reset-demo.ts user_3GVr5Css8qERqxyWiySrhNeX3WF` before each demo · pitch deck (12 slides, editable PPTX in ~/Downloads): https://claude.ai/code/artifact/8cfbdcd9-aa65-4226-a901-92d46bc1b2e7
- **Theme:** Aurora Green. Tests: **218/218** · tsc + `next build` clean.

## 🔴 Only you can do these
| # | What | Where |
|---|------|-------|
| 1 | **Azoulay demo (Thu ~07-23) hosting decision:** deploy `v3` to a Vercel preview, or run local + screenshare. The board is v3-only. Tell me which and I'll set it up | decision |
| 2 | **Deploy decision:** ship `v2` (Plan X) and/or `v3` (board) to `main`? Pre-deploy QA of Plan X fixes waits on this | decision |
| 3 | Vercel env: `BLOB_READ_WRITE_TOKEN` (evidence/logos), `CRON_SECRET` (reminders), `ADMIN_CLERK_ID` (/admin) — unblocks BUG-B1/B2 | Vercel → env vars |
| 4 | Resend: verify sending domain so request/reminder/reply emails deliver — the "client gets a link" beat depends on it | Resend |
| 5 | Get from Masao: CARB SB 253 draft template + Kerri's buyer questionnaire (unblocks W3 format engine) | Masao |
| 6 | Real EPA eGRID 2024 / USEEIO v2 factor values → /admin/factors (BUG-1 gates this) | datasets |
| 7 | Discovery (Plan Y2): confirm who at the supplier does the data work; validate consultant need before pricing | consultant convos |

## 🟡 Next build (Plan Y): pipeline board is live — choose next
- **Y3 conversion P0** (highest leverage; "if we can't extract data we're cooked"): early-engagement reminder 48-72h after send, checklist+time in the request email, per-item progress on portal, named-buyer "why" framing.
- **Y1.1 deeper CRM reshape:** client detail as a record (timeline-primary, tasks, contact block).
- Then W3 format engine (blocked on Masao's templates).

## Key corrections in force (from the pipeline doc)
SB 253 first Scope 1/2 deadline = **Nov 10, 2026** (confirmed 2026-07-21) · assurance term = **ISSA 5000** · **PACT V3 only** · vendor memory **workspace-scoped** (global/cross-platform = LATER) · referral routing stays Masao's spreadsheet.
