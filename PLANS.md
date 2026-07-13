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

# Plan W — Wireframe Workflow Alignment (ACTIVE)

> **UI spec:** Malachi's Figma wireframes, decoded 2026-07-13 → `docs/wireframes-2026-07-13.md` (screen inventory) + `-raw-outline.txt` (exact microcopy). Frame titles carry Masao's pipeline #s, so the wireframes ARE the UI for Plan U's remaining phases — W absorbs U3–U6 scope and adds the IA restructure the wireframes define.
> **Scope source unchanged:** `docs/build-pipeline-2026-07-10.pdf`. Ground rules as invariants: config-driven formats (§14a), snapshots-only sharing (§13), audit-everything, absolute client separation (ownsClient guard + contract tests), PACT V3 only, workspace-scoped vendor memory (§14b).
> U1 — BUILT (03e55cf) · U2 — BUILT (89d55d9). Details in git history.

## The gap (current app vs wireframes)
Functionality largely exists (requests → portal → ledger → snapshots → exports) but the **shape** differs:
- Current `/consultant` is not the wireframe dashboard (stat cards Overdue/Ready/Awaiting + client table w/ status·due·completeness + sidebar nav incl. Compliance calendar / Request templates / Format library).
- `/consultant/clients/[id]/manage/scope1-3` is v1 data-entry-centric; wireframes are **request-centric**: client hub (stats, requests list, timeline, comment threads) → per-request Review & Approve → Snapshot & Share as one continuous action.
- Supplier portal exists but lacks: Review & Submit step w/ scoped attestation, Confirmation → claim-account path, the whole supplier account area (trust page, share receipts, mini-report), and the three utility modals.
- No UI at all yet for: format library + mapping builder (U3), compliance calendar, chasing schedule page, digest, hotspot, score-gap, methodology detail, IMP, historical import.

## W1 — Consultant IA shell + core-loop reshape (no new backend)
Sidebar nav per wireframe (Dashboard, New request, Compliance calendar*, Request templates, Format library*, Settings — *placeholder until W3/W7) · Dashboard #19: stat cards + client table (status badge, due, completeness meter) · Client Detail #19/#6/#13: stats row, requests list (click → snapshot view or Review & Approve), activity timeline, comment threads · New Data Request #1: template-first dropdown, data-type chips, cadence preview + edit link, save-as-template · retire/fold `manage/scope1-3` pages into the request-centric flow (decision: keep ledger as the line-item engine under Review & Approve).

## W2 — Review & Approve → Snapshot & Share as one continuous action
Review & Approve #7/#6/#18 on top of existing ledger: line items w/ evidence + comment threads (resolve state), vendor-memory confirmation row ("remembered from last year"), Request changes / **Approve, freeze & go to snapshot** · open-flag warning modal · Snapshot & Share #8/#10/#9: locked header, scope cards, attestation status line, share panel (recipient + format chips), supplier-OK gate before external share, correction path note, "New for this client" slots (wired in W7).

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
