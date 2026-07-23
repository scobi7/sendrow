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
| W1–W2 | Consultant app restructured to Figma wireframes: dashboard/client hub/new request + Review & Approve → Snapshot & Share | 2026-07-13, a7d8734 |
| X | Demo-feedback fixes: portal crash-proofing + PDF path, completeness fix, flag/reply loop, clarity pass, QuickBooks/connections removed, minimal /for-companies, emoji sweep | 2026-07-14, `sendrow-v2` (not yet on main) |
| BUGS | BUG-2/3/5/8/10 fixes (review-email repoint + orphan delete, loading skeletons, flag-reply visibility, Node<20 File upload fix); SB 253 date → Nov 10 | 2026-07-21→23, `sendrow-v3` |
| Y6 | Portal: multiple files per checklist item (≤12) + batch-submit staging (files held private until one Submit) | 2026-07-23, `sendrow-v3` |
| — | Pipeline board (Y1) built then reverted to the table dashboard (Malachi's call) | 2026-07-23, `sendrow-v3` |

---

# Plan W — Wireframe Workflow Alignment (ACTIVE)

> **UI spec:** Malachi's Figma wireframes, decoded 2026-07-13 → `docs/wireframes-2026-07-13.md` (screen inventory) + `-raw-outline.txt` (exact microcopy). Frame titles carry Masao's pipeline #s, so the wireframes ARE the UI for Plan U's remaining phases — W absorbs U3–U6 scope and adds the IA restructure the wireframes define.
> **Scope source unchanged:** `docs/build-pipeline-2026-07-10.pdf`. Ground rules as invariants: config-driven formats (§14a), snapshots-only sharing (§13), audit-everything, absolute client separation (ownsClient guard + contract tests), PACT V3 only, workspace-scoped vendor memory (§14b).
> U1 — BUILT (03e55cf) · U2 — BUILT (89d55d9). Details in git history.

**W1 — BUILT** (a7d8734): sidebar per wireframe, dashboard #19 (stat cards + status/due/completeness table), client detail hub #19/#6/#13 (stats row, requests → review/snapshot, event timeline, threads), New Data Request page #1, engagement templates page #23, format library page #35 (builder = W3 placeholder), compliance calendar #44 (regulatory preloads + live due dates), chasing schedule page #21, settings #22 live email preview. `manage/scope1-3` + full ledger kept as quiet power tools under "More".

**W2 — BUILT** (a7d8734): Review & Approve #7/#6/#18 (category groups w/ files + threads, vendor confirm, dollar-fuel, session actions) → **Approve, freeze & go to snapshot** (approves pending sessions, freezes, redirects — one continuous action) · open-flag warning modal (unmapped + stuck notes) · Snapshot & Share #8/#10/#9 (locked header, scope cards, format chips, recipient shares + receipts, correction note). Deferred within W2: supplier attestation line + supplier-OK share gate (need W4's attestation), "New for this client" slots (W7). Open: W2.5 click-through with demo data (Malachi — needs Clerk login).

## X — Demo-feedback fixes (APPROVED 2026-07-14; full triage in QA.md Part 1)
Source: first external feedback round. Ordered by user pain; X1/X2 before W3.
Malachi's calls (2026-07-14): remove QuickBooks + UtilityAPI from consultant UI (→X4) · /for-companies redone super-minimal, get-matched funnel only (→X4) · Resend + env vars + preflight/walkthrough repro = backlog.

- **X1 Correctness & crash fixes:** guard `res.json()` in portal-checklist + client-side file-size check + try/catch in `/api/portal/import` so every failure is a readable message, never `Unexpected end of JSON input` (#4) · PDF uploads become evidence + guided-entry path instead of a parse failure; portal copy stops promising auto-read PDFs (#3) · `completenessPercent` counts fulfilled requests so finished rounds don't reset to 0% (#8) · `lib/email.ts` checks Resend response, logs + writes audit event + surfaces send failures in UI (#1) · evidence without blob shows "hash recorded, file not stored" instead of 404 (#2/#13) · complete Activity `VERB_LABEL` map + humanize subjects (#21).
- **X2 Close the supplier↔consultant loop (pulls minimal W4 slice forward):** portal shows per-item threads — supplier's own stuck message, consultant comments, replies (#5/#7) · consultant reply box on the flag card (reply → portal thread + email) · review page renders stuck notes as visible flag cards, not just a count (#18) · review "inspect" links carry context (filtered to upload, row expanded) (#19).
- **X3 Clarity pass:** time-period presets matching due-date input pattern (#14) · reminder cadence in plain English (#15) · excluded-filter chip contrast (#17) · format library gets a real "send us your format" intake instead of circular links (#20) · scope 2 manual market-based override w/ audit event (#10) · scope 3 estimate undo + inline confidence explanation (#11) · activity page notes it's the permanent audit log, methodology ships inside exports (#21b).
- **X4 Removals & minimal company page (Malachi 2026-07-14):** QuickBooks + UtilityAPI gone from consultant UI (`manage/connections` page, nav links, email copy; dormant lib code stays) · `/for-companies` rebuilt super-minimal: one screen, get-matched funnel only.
- **Absorbed elsewhere:** format preview/edit before download → W3.1/W3.2 (#6) · supplier dashboard → W4 (#7b).
- **Needs repro from testers:** "preflight checklist" (#12) and ledger "guided walkthrough link" (#16) — neither exists under that name in the code.
- **Env (only Malachi, blocks QA of email/evidence):** BLOB_READ_WRITE_TOKEN · CRON_SECRET · ADMIN_CLERK_ID · Resend domain verification.

## Y — MVP for pilots + CRM reshape (ACTIVE on branch `sendrow-v3`, from 2026-07-21 team meeting)
> Phase goal (GOALS.md): get real consultants using it as a tool, get feedback. Meeting calls: consultants-only confirmed · supplier persona UNCONFIRMED (validate via discovery) · pricing/vertical/data-asset deferred · "we're essentially building a CRM" → reshape IA around a familiar CRM model · conversion is existential ("if we can't extract data we're cooked").
> Branch split: `sendrow-v2` keeps Plan D (Azoulay demo prep). `sendrow-v3` = active build branch (everything below).

**Y1 — Pipedrive-style pipeline board — BUILT then REVERTED (2026-07-23).**
Built the kanban home (New → Requested → Responding → In review → Approved, derived stage, no drag) and it worked live. **Malachi reviewed it and reverted to the old stat-cards + table dashboard** — preferred the old style. `pipelineStage()`/`STAGE_META`/`isOverdue()` in `lib/client-status.ts` + `components/pipeline-board.tsx` are KEPT but unused, so the board can be toggled back cheaply. Delete moved to client detail. Deeper CRM client-detail reshape (Y1.1) not built — revisit only if the board returns.

**Y6 — Portal multi-file + batch-submit — BUILT (2026-07-23).**
- Multiple files per checklist item (up to 12): a supplier uploads separate electricity + gas sheets, or monthly bills, to one item; "+ Add another file" button; cap enforced server + client.
- **Batch-submit / true staging:** confirmed files are held client-side and never hit the server until one "Submit all N files" button — the consultant sees nothing until Submit (verified live: ledger empty while staged → data lands on submit). Tradeoff Malachi accepted: closing the tab before Submit loses staged uploads (manual-entry rows still draft-save). Also fixed a latent `File is not defined` (Node <20) bug that killed all file uploads.

**Y2 — Discovery (Malachi-led, not code): confirm the supplier persona** ("who at the supplier does the data work?") + validate consultant need before pricing. Berkeley network + Azoulay intros → target consultants. Every conversation asks: who provides the data, which formats they answer most, would they pilot. Findings feed GOALS.md persona + vertical calls.

**Y3 — Data-provisioning conversion (existential; research in `docs/research-supplier-conversion.md`).** P0, all small, build for the demo:
- Y3.1 Early-engagement reminder 48–72h after send (biggest single lift, +14%), total touches ≤4 — fixes the due-date-anchored cadence's silent gap.
- Y3.2 Show checklist items + est. time inside the request email (client sees the ask is small before clicking).
- Y3.3 Per-item time estimates + overall progress on the portal ("2 of 3 done, ~4 min left").
- Y3.4 Named-buyer "why" framing in the request ("Whole Foods needs this for SB 253 by [date]").
P1 (bigger, after pilots): SMS channel + missing-item nudges · mobile photo upload (pairs with X1 PDF path) · supplier gets a mini-footprint back on completion (reciprocity + seeds answer-once) · prefill callout in email.

**Y4 — House style enforcement:** no emojis / no em dashes in any product UI or copy (GOALS.md standing constraint) — grep-verify before v3 is called demo-ready.

**Y5 — Data asset (research thread only, NOT scoped):** what a cleaned cross-supplier dataset is worth (missing-data estimation, anomaly flags at review, sector benchmarking) — respects workspace-scoped privacy line. Explore, don't build.

## W3 — Format engine UI (= U3, the moat)
- **W3.1 (U3.1) Config-driven reshaping (#9):** refactor `lib/formats.ts` → versioned template registry (DB): mappings + layout as data, conditional/branching (CDP). Ship configs: SB 253 (**CARB draft — Masao**), generic Excel, one real buyer questionnaire (**Kerri**).
- **W3.2 (U3.2) Format Library + Mapping Builder (#35):** library list (built-ins + consultant-added, private-until-buyer-confirmed) · builder: upload → connect questions to fields → save as template → appears as format option.
- **W3.3 (U3.3) Template versioning (#33):** snapshots/exports record version used.
- **W3.4 (U3.4) Answer once, share many (#26) + duplicate detection:** overlap popup in portal → share existing snapshot (consultant notified) or start fresh.

## W4 — Supplier journey (= U4)
Portal alignment #2/#4/#5 (section N-of-M, dropzone/file rows, note field, delegation + extension links) · Review & Submit step w/ per-snapshot attestation checkbox (#37) · Confirmation → Claim Account (#24, never gates responding) · Supplier Account trust page (#37/#38/#25): share receipts, download-all PACT V3 + CSV, Q&A threads, flag-categorization path · Section delegation modal (4.6) · Deadline extension request + consultant one-click approve/deny (4.7) · Supplier mini-report PDF, VSME skeleton (4.9) · reply-by-email v1 (#3 — needs inbound-email provider). (#27 waits on Masao's calculator.)

## W5 — Consultant management screens
White-label settings #22 alignment: live request-email preview · Automatic Chasing page #21: per-touch toggles + scheduled dates, reminder log, calendar-driven cadence, extension auto-pause · Engagement Templates page #23: cards w/ used-on-N + start-request · Historical import wizard #36 (upload → map columns → rows marked "imported"; = U5.7, pulled forward as adoption unlock).

## W6 — Audit-grade depth (= U5)
Methodology & Trust detail expanding from line items (#17/#14/#15: method label, factor + relevance check, trust badge, % activity-based CARB ratio) · estimate→actual restatement alert #11 (was/now/reason, all recipients) · factor-update recalc preview #39 (old snapshots frozen) · vendor memory global option removed (#18) · IMP generator 5.8 (5 sections from stored labels).

## W7 — Retention engine (= U6, after first design partner)
Compliance calendar #44 (regulatory preloaded, drives chasing cadence; Masao owns dates) · monthly digest #45 (forward-as-is) · commentary blocks #43 (in every export) · hotspot report #40 (auto on approval, "turn into client pitch") · YoY narratives (#41) · score-gap flags #42 (blocked: rubrics) · completeness meter 6.7 (shared component: dashboard, client detail, digest — build early in W1, reuse here).

## Sequencing note (for approval)
W1–W2 jump ahead of Masao's "U3 next" ordering: they're pure frontend reshaping with zero blocked inputs, they make every later phase land in its final home, and demos immediately match the wireframes. U3 scope is untouched — it becomes W3 and starts as soon as W1–W2 ship (or in parallel if preferred).

## Blocked on Masao
CARB SB 253 draft template (W3.1) · Kerri's buyer questionnaire (W3.1) · CDP/EcoVadis scoring rubrics (W7) · calculator data model (#27).

## Explicitly NOT building (doc's LATER list)
AI suggestions (#16) · buyer features (#28–30) · integrations (#34) · peer benchmarking (#47) · EPR (#50) · referral-routing software (#48 — Masao's spreadsheet; /admin/referrals frozen as-is).

## Verification per phase
Tests + tsc + build green; TASKS.md hydrated; commit + push to `sendrow-v2` per phase. W3 gets the deepest test coverage. Every screen checked against `docs/wireframes-2026-07-13.md` microcopy + layout before a phase closes.
