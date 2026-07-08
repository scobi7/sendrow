# NEXT.md
> End-of-session summary. For build priorities see ROADMAP.md; for the active plan see PLANS.md.
> Last updated: 2026-07-08 (direction reset session)

## 🧭 Direction reset (2026-07-08)
Sendrow is now **the practice platform for climate consultants** — consultants are the only paying customer; inbound companies become referral revenue. White-label fulfillment funds the software build; the 2027 Scope 3 / limited-assurance wave is the timing thesis; vendor-mapping memory is the moat. Full rationale + industry research in GOALS.md; source doc: "Sendrow Model and Expansion Plan.docx".

**v1 is recoverable:** the company-first direction was never pitched (untested, not disproven). It's archived in `docs/direction-v1-company-first.md`; the full pre-pivot repo is branch `sendrow-v1`. Active development: branch `sendrow-v2` (the old `github-branch-tracking` branch was renamed/retired).

## 🔴 P0 — Ops blockers (user actions, not build work)
| # | What | Where |
|---|------|-------|
| 1 | Clerk production Google OAuth | Clerk dashboard → Social connections → Google |
| 2 | Attorney-reviewed ToS (**tool-not-advice positioning**) & Privacy copy | `app/terms/page.tsx`, `app/privacy/page.tsx` |
| 3 | `STRIPE_WEBHOOK_SECRET` in Vercel | Vercel env vars |
| 4 | Clerk **dev** keys for Preview deploys — prod keys only work on sendrow.app, so /login is blank on *.vercel.app previews | Vercel env vars: scope `pk_live_`/`sk_live_` to Production only; add `pk_test_`/`sk_test_` scoped to Preview |
| 5 | Update Calendly links | `app/demo/page.tsx`, `app/pricing/agency/page.tsx` |
| 6 | Fix prospectus "Live" integrations label — one caught exaggeration erases everything | prospectus / deck |

## 🟠 Business decisions the strategy doc assigns to you & Masao (not build work)
- Founding Partner terms → convert Kerri (free/near-free year for named case study + 3 intros)
- Bootstrap tripwire date (doc suggests: first paid contract by Oct 15, or re-decide with real numbers)
- Concierge cap: 3 engagements, then productize or raise price
- CARB 15-day comment window: publish the explainer within 24h + submit a comment letter when it opens

## 🟡 Current state (updated 2026-07-08, Plan N session)
- **Plan N phases N1–N5 + N7.1 BUILT on `sendrow-v2`** (158/158 tests): client-contact email repair (portal emails actually deliver now), one merged consultant workspace + practice board, evidence locker (original files on Vercel Blob, hash-always provenance), reporting periods + YoY, white-label branding (brand profiles, branded portal/emails, `/shared/[token]` client results links), `/admin/referrals` lead board.
- **N6 (questionnaire copilot) blocked** on one real buyer questionnaire from Kerri.
- **N7.2 open:** real EPA eGRID 2024 / USEEIO v2 factor values still needed before any client deliverable — load via /admin/factors.
- **New env vars to set in Vercel:** `BLOB_READ_WRITE_TOKEN` (evidence + logo storage), `CRON_SECRET` (reminders), `ADMIN_CLERK_ID` (admin pages).

## 🟡 Previous state
- **Plan J (Practice Platform Release) BUILT 2026-07-08 on `sendrow-v2`** — all 20 tasks, 154/154 tests, tsc clean, full build passes. See success/plan-j.md. Ships: magic-link portal (`/portal/[token]`), reminder cron, vendor-mapping memory + confirm UI in review queue, `/get-matched` referral flow, `/security` + `/dpa`.
- Landing + pricing repositioned to practice-platform; company checkout dormant (not deleted).
- Migrations 0004 (portal/vendor/referral tables) + 0003 auto-apply on next deploy of `sendrow-v2`.
- Production (`main`/`sendrow-v1`) still runs the pre-pivot version — deploy of v2 is a user decision.
- Manual QA of the v2 flow needed: create request → open portal link (incognito) → upload messy file → confirm vendor in review queue → see remap.
- Set `CRON_SECRET` in Vercel for the reminders cron (optional but recommended).

## ⚠ Carried-over flags from Plan I build
1. **Factor values are still "representative"** — the 22 new eGRID and 14 new USEEIO factors approximate published data. Before the first fulfillment engagement's deliverable goes out, load the real EPA eGRID 2024 + USEEIO v2 values (data-only task, fits Plan J).
2. **H9 never landed** — `/intake` still lists mapping profiles, not intake sessions. Superseded by the portal work in Plan J.
3. **Ingestion electricity default** now pinned to national average `egrid.USAVG.2024` (was implicitly CAMX). Forward-only.

## 🟢 Next session
1. Approve/amend Plan J → generate TASKS.md → build Phase 1 (magic-link portal)
2. Get from Kerri: one real buyer questionnaire (unlocks the Plan K copilot) and her footprint-sprint data checklist (shapes the portal checklist templates)

## Completed (recent)
| Item | Status |
|------|--------|
| Direction reset — doc analysis, industry research, GOALS/ROADMAP/PLANS rewrite | ✅ 2026-07-08 |
| Plan I — onboarding gates, full eGRID map, QB→USEEIO 9→29, silent drops killed, review emails; `/consultant` route-collision fix | ✅ 2026-07-07 |
| Plan H — sessions, scoring, auto-routing, review queue, data requests, pipeline lock | ✅ 2026-07-07 |
| Plans A–G — cleanup through full client pipeline | ✅ 2026-06-26 → 2026-07-06 |
