# NEXT.md
> Current state + what only the user can do. History lives in git; build order in PLANS.md; UI spec: `docs/wireframes-2026-07-13.md`.
> Last updated: 2026-07-13

## 🟢 Where the product stands
- **Branch `sendrow-v2`** = active. `main` = **deployed to production 2026-07-14** (742405c, same as v2) — sendrow.app now runs the wireframe workflow.
- **W1+W2 built (2026-07-13):** consultant app restructured to your Figma wireframes — sidebar (Dashboard / New request / Templates / Format library / Calendar / Settings), dashboard stat cards + client table w/ status·due·completeness, client detail hub (stats row, requests → review or snapshot, timeline, threads), standalone New Data Request page, Review & Approve w/ open-flag warning modal → **Approve, freeze & go to snapshot** → Snapshot & Share page (format chips + recipient shares), chasing schedule page, compliance calendar, engagement templates page, format library, white-label settings w/ live email preview.
- Backend flow unchanged underneath: request → magic-link portal → evidence + events → ledger → immutable snapshots → restatements → exports. Old power tools still reachable (full ledger, enter-on-behalf, activity CSV).
- **Theme:** Aurora Green throughout.
- **Demo:** `npx tsx scripts/reset-demo.ts` seeds 3 clients at 3 stages; run before every demo.
- Tests: 210/210 · tsc + `next build` clean.

## 🔴 Only you can do these
| # | What | Where |
|---|------|-------|
| 1 | **Click through W1/W2 with demo data** (`npm run dev` → login → dashboard → client → review → approve → snapshot). I can't drive the Clerk login | local |
| 2 | Vercel env: `BLOB_READ_WRITE_TOKEN` (evidence/logos), `CRON_SECRET` (reminders), `ADMIN_CLERK_ID` (/admin) | Vercel → env vars |
| 3 | Get from Masao: CARB SB 253 draft template + Kerri's buyer questionnaire (unblocks W3), scoring rubrics (W7) | Masao |
| 4 | Real EPA eGRID 2024 / USEEIO v2 factor values → /admin/factors — **pre-deliverable blocker** | datasets |
| 5 | Verify the prod deploy on sendrow.app (Vercel dashboard → latest deployment); Clerk prod Google OAuth; Calendly links; attorney ToS | various |

## 🟡 Next build: W3 — format engine as config (= U3, the moat)
Versioned template registry (formats as data, not code), Format Mapping Builder to replace the library's placeholder card, template versioning, answer-once/share-many. W3.1/2/3 can start without the blocked inputs. Then W4 (supplier journey: review & submit + attestation, claim account, trust page, delegation/extension modals).

## Key corrections in force (from the pipeline doc)
SB 253 first Scope 1/2 deadline = **Aug 10, 2026** · assurance term = **ISSA 5000** · **PACT V3 only** · vendor memory **workspace-scoped** (global/cross-platform = LATER) · referral routing stays Masao's spreadsheet.
