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
| MO | Multi-office collection Phase 1: CFO delegates per-site links, each facility calcs on its own grid factor | 2026-07-31 built, deployed to `main` 2026-09-02 |
| — | Admin gate fix (removed BUG-1's redundant double auth check) + new `/admin/accounts` (grant/revoke free access) + billing-portal URL fallback fix | 2026-09-02, `main` |
| — | Site delegation follow-ups: editable/multi-contact emails, optional personal note on send, reminders fixed to nudge the site's own contact instead of the CFO | 2026-09-02, `main` |
| — | Security pass: closed a real cross-tenant read (`getCommentsForCompany`), rewrote `separation.test.ts` to auto-discover coverage instead of a drifting allowlist, evidence downloads now stream instead of redirecting to a public blob URL | 2026-09-02, `main` |
| — | GreenTrack-era cleanup: dead QuickBooks/UtilityAPI code removed (BUG-6), orphaned `/api/demo` route removed, reverted pipeline-board helpers removed, all 27 DB tables renamed off the `gt_` prefix | 2026-09-02, `main` |
| — | Marketing/product copy fixed to match reality (removed stale "auto-connects your QuickBooks/utility" claims); nav decluttered (for-companies page + both nav links removed, for-consultants kept) | 2026-09-02, `main` |
| — | BUG-11 (Excel serial dates) + BUG-4 (query parallelization, one real fix on the snapshot page) | 2026-09-02, `main` |
| — | RLS investigated: `neon-http` driver confirmed to have zero transaction support; `neon-serverless`+`Pool` confirmed as the fix but requires a full DB-driver migration. Shelved by design decision, not by default. | 2026-09-02, research only, no code shipped |
| L | Landing relaunch: homepage rebuilt to "Option B" (concise pitch + waitlist + design-partner ask), `waitlist_signups`/`marketing_events` tables, `/api/track` beacon, `/admin/waitlist` view | 2026-09-10, `sendrow-v3` |
| — | Rebrand: new S-mark glyph (per-corner rounding, not a pill) replaces the old letter-S icon everywhere via `SendrowMark`; wordmark bumped to extrabold/text-xl; favicon matches | 2026-09-10, `main` |
| — | Codebase cleanup: `knip`-driven dead-code pass - 3 orphaned files removed (`data-request-form.tsx` superseded by `requests/new/request-form.tsx`, `lock-pipeline-button.tsx` + its `lockPipeline` action with zero callers, `lib/logger.ts` never wired in), 5 zero-usage functions removed (`auditForCompany`, `createShareLink`, `consultantMarkQBReviewed`/`consultantMarkUtilityReviewed`, `getCommentsForCompany`), 2 dead `lib/store.ts` writers removed (`saveQBTransactions`/`saveUtilityData` - their read-side calc code in `lib/calc.ts` stays live per the standing N7.2-era decision not to touch that data model), 5 unused `components/ui.tsx` primitives from the pre-Aurora-Green "Canopy" era removed (`StatusDot`/`ProgressBar`/`ScopeBarChart`/`ScopeDonutChart`/`ComplianceTracker`), unused `AuditRow`/`ConsultantClient`/`InviteToken` types removed from `lib/types.ts` (kept `Location` - still referenced by `Company.locations`), unused `resend` npm dependency removed (email sends go through a raw `fetch` to Resend's REST API, not their SDK). 229/229 tests + tsc + build green throughout. | 2026-09-10, `sendrow-v3` |

---

# Plan L — Landing relaunch + design-partner funnel (APPROVED 2026-09-10, branch `sendrow-v3`)
> Source: Malachi's design-partner recruitment notes (Berkeley network + startup-advisor framing) + three homepage directions mocked as a Claude artifact, iterated live, "Option B" (product-first, ask-second) chosen. Goal: a concise homepage that pitches Sendrow, captures early-access signups, and lets Malachi see engagement without a third-party analytics tool.

**L1 — Schema (additive/nullable, safe with the existing `drizzle-kit push --force` on deploy):**
- `waitlist_signups` — one row per email (unique), `wants_design_partner` boolean, `source` (`hero` | `partner`), `created_at`. Upserted, not inserted twice, so re-submitting from the partner card just flips the flag on an existing row.
- `marketing_events` — lightweight page-engagement log (`page_view`, `nav_how_it_works_click`, `nav_signin_click`), fixed allowlist enforced server-side. Deliberately separate from the existing `events` table (that one is the product's per-company audit log; this is anonymous homepage traffic, no `companyId`).

**L2 — Capture:** `lib/waitlist.ts` (`"use server"`) — `submitWaitlist()` as a Server Action called directly from the form (no new public API route needed; Server Actions post back to `/`, already public). `app/api/track/route.ts` — the one new public route, for fire-and-forget `sendBeacon` clicks/pageviews that can't wait on a page-bound action. Both rate-limited via the existing `lib/ratelimit.ts` (`clientIp` + `checkRateLimit`), same pattern as the rest of the app.

**L3 — Homepage rebuild (`app/page.tsx`), Option B:** concise hero (one headline, one line of pitch, single-field "Get early access" form - no newsletter checkbox, matches GOALS.md's "no in-app newsletter" call) - three real, shipped steps (send a link / auto-calculate / export) - one unnumbered line on automated chasing (shipped, Plan Y3/Z4 reminders) - a condensed two-column "design partner" card (short ask + its own email field, SB 253 date on the right) - **no seat-count chip** (removed per review - true, verifiable numbers only). Copy claim "Scope 1, 2, and 3" stays: confirmed Scope 3 is real, tested calculation logic (`test/vendor-mappings.test.ts`), not a placeholder - the only caveat is the underlying factor *values* are still labeled representative pending real eGRID/USEEIO data (standing item N7.2), which is a data-precision note, not a "we don't calculate it" gap.

**L4 — Admin visibility (`/admin/waitlist`):** signup count (total + design-partner-interested split), a plain table of signups, and engagement counts by event name - so "how many signups / how many clicked through" has an answer inside the product instead of a manual SQL query.

**L5 — House style:** grep-verify no emoji / no em dash on all new copy before calling this done (GOALS.md standing constraint).

**Explicitly not in this pass:** no newsletter (parked per GOALS.md), no third-party analytics/ad pixel, no A/B test harness for Option C - those stay ideas until there's a reason to build them.

---

# Plan W — Wireframe Workflow Alignment (ACTIVE)

> **UI spec:** Malachi's Figma wireframes, decoded 2026-07-13 → `docs/wireframes-2026-07-13.md` (screen inventory) + `-raw-outline.txt` (exact microcopy). Frame titles carry Masao's pipeline #s, so the wireframes ARE the UI for Plan U's remaining phases — W absorbs U3–U6 scope and adds the IA restructure the wireframes define.
> **Scope source unchanged:** `docs/build-pipeline-2026-07-10.pdf`. Ground rules as invariants: config-driven formats (§14a), snapshots-only sharing (§13), audit-everything, absolute client separation (ownsClient guard + contract tests), PACT V3 only, workspace-scoped vendor memory (§14b).
> U1 — BUILT (03e55cf) · U2 — BUILT (89d55d9). Details in git history.

W1/W2/X/Y1/Y6/Z1-Z3/MO full bodies lived here through 2026-09; all shipped and already one-lined in the Built table above — full detail is in git history (tag/search the commit messages referenced there) if you need to reconstruct the original spec. `docs/research-supplier-conversion.md` still holds the live research behind the not-yet-shipped conversion work below.

**Still open from that era (not shipped, carried forward — see TASKS.md for current status):** Y3/Z4 conversion P0 (early reminder, checklist-in-email, per-item progress, named-buyer framing — unified list, was duplicated under both Y3 and Z4), Y2 (discovery — confirm the supplier persona, Malachi-led, not code), Y5 (data-asset research thread, not scoped), Z3.3/BUG-7 (payment gate stays unlinked while disabled), Z5 (draft-persistence, untested mutations).

## Roadmap — Future CONSULT/reduce layer (NOT this cycle; captured, do not build yet)
> These make the consultant's *own* offering more valuable (upsell reduction advice), justifying a higher per-client price later. All ride on the existing data layer + config-driven format engine.
- **Data protection / access control** — buyer sees only the aggregate snapshot, never raw proprietary inputs (a supplier won't hand over a chemical formula). Mechanism = data minimization + role-based visibility (NOT hashing — one-way, can't calc from it). Partly built (snapshots-only sharing, §13); tighten buyer-vs-consultant visibility. *Near-future, MVP-adjacent.*
- **Assurer / third-party sign-off role** — auditor approves a frozen snapshot; fits the 2027 assurance wave (ISSA 5000) + audit-trail moat.
- **Reduction insights (hotspots)** — "your biggest emissions are X; switching saves $Y." Sendrow supplies the data; the consultant gives the advice.
- **Anonymized sector benchmarking** — "you're above your industry average." Percentile benchmarks (NOT ML early); respects the hard privacy line (aggregate only).
- **ESG expansion (Social + Governance; ESRS/CSRD, IFRS S1/S2, double materiality)** — the format engine makes S/G "just another config." Latent S/G fields already in schema. Keeps climate focus for MVP; expand only after California is won.
- **GRI community listing** — cheap distribution experiment; can run independently.
- **Explicitly NOT doing:** blockchain traceability (our hash-stamped immutable ledger already gives tamper-evidence, without the complexity) · international expansion (contradicts "win California first") · ML on the dataset (premature — percentiles first).

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
