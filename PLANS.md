# PLANS.md

## Plan V — Visual Identity Refresh ("The Ledger")
> STATUS: BUILT 2026-07-08 on `sendrow-v2` — see success/plan-v.md. Spec: docs/design-direction.md.

### Objective
Kill the "AI-generated SaaS" look. Move from pastel-green wash + geometric sans to paper/ink/forest with an editorial serif — the visual language of an audit-grade practice platform (Watershed's restraint, Clio's order, the Paymark template's single-accent discipline).

### Phases
1. **V1 — Fonts:** `app/layout.tsx` swaps Manrope/Space Mono → Fraunces (display serif) + Instrument Sans (body/UI) + IBM Plex Mono (data); `--font-body` becomes a real token; tailwind config updated
2. **V2 — Color tokens:** retheme `:root` in `globals.css` per docs/design-direction.md table (paper bg, white cards + hairlines, ink text, forest primary, new `--accent` terracotta + `--ink-band`)
3. **V3 — Hardcoded-hex sweep:** move ~20 inline hex values (`#fef9c3`, `#fecaca`, `#dc2626`, `#d97706`…) onto tokens so the theme is fully centralized (white-label prerequisite)
4. **V4 — Landing polish:** remove hero gradient blobs, one ink-band section, Fraunces hero, terracotta used once per screen
5. **V5 — App surfaces check:** dashboard/workpaper/portal numbers in mono with tabular figures; no regressions in PDF print styles
6. **V6 — Verify:** visual pass on landing, portal, dashboard, review queue; tests + tsc + build clean

### Acceptance
- No Manrope/Space Mono references remain; no gradient blobs; no inline status-color hex in pages
- The portal and app shell remain fully tokenized (consultant white-label can override via CSS variables alone)
- All tests pass; `next build` clean

### Out of scope
Layout restructuring, new sections/pages, consultant branding upload (that's Plan K white-label), logo redesign.

---

# Plan J: Practice Platform Release
> STATUS: BUILT 2026-07-08 on branch `sendrow-v2` — see success/plan-j.md and TASKS.md (J1–J20).
> Prior plan: Plan I (Integrity Release) — BUILT 2026-07-07, see success/plan-i.md.

## Objective
Make a white-label fulfillment engagement (footprint sprint) runnable end-to-end through software: consultant sends a data request → client fills a guided magic-link portal → data lands in the existing intake pipeline → every vendor confirmation feeds permanent cross-client mapping memory. Plus: turn the inbound company flow into consultant referral routing.

## Phase 1 — Magic-link data-request portal (client side)
The client receives a link, needs no account, and sees exactly what to provide.
- Schema: extend `gt_data_requests` with `token` (unique), `expiresAt`, `checklist` (jsonb: array of items — data type, label, instructions, status), `remindersSentAt` (jsonb)
- `app/portal/[token]/page.tsx` — public route (middleware bypass like `/terms`): validates token, shows checklist with per-item status, consultant branding placeholder
- Per-item flows reusing existing machinery: document upload (file → existing `/api/intake/preview` + `import` pipeline, tagged with `dataRequestId`) and simple structured entry forms (per data type from `lib/ingestion/data-type-templates.ts` — e.g., monthly kWh, gallons, therms)
- Token pattern: reuse the `inviteTokens` approach in `lib/actions.ts` (crypto token, expiry, single-purpose)
- Acceptance: a client with only the link can complete a checklist item without login; uploads route through the existing scoring/review pipeline

## Phase 2 — Reminders + consultant status board
- Reminder emails via `lib/email.ts` + Vercel cron (`/api/cron/reminders`): open requests with incomplete items get a nudge at 3/7/14 days; consultant CC'd on the 14-day
- Extend `/consultant/review/[companyId]`: data-request cards show per-item checklist status (received / missing / under review), last activity, next reminder date
- Acceptance: smoke test proves reminder selection logic (who gets nudged when); board shows item-level status

## Phase 3 — Vendor-mapping memory (the moat)
- Schema: new `gt_vendor_mappings` — `id`, `vendorPattern` (normalized name), `scope`, `category`, `factorId`, `confidence`, `confirmedBy`, `confirmedAt`, `sourceCompanyId`, `timesApplied`
- Ingest hook: before category resolution in `lib/ingestion/ingest.ts` and the QB path in `lib/calc.ts`, consult vendor mappings (exact → normalized match); matched rows carry `vendor_mapping_id` in the calc log
- Review-queue write-back: when a consultant approves a session containing previously-unmapped vendors, they confirm vendor→category pairs (new step in `/consultant/review/[companyId]`); confirmations insert global mappings
- Invariant (contracts/): mappings become global only after human confirmation; auto-applied mappings record which mapping version was used (forward-only, like factors)
- Acceptance: a vendor confirmed for client A auto-maps for client B, with the mapping id in the audit trail; unconfirmed vendors still flag as `unmapped` (Plan I behavior preserved)

## Phase 4 — Referral routing (kill direct-to-company sales)
- `/pricing` and landing CTAs: replace self-serve checkout path with "Get matched with a climate consultant" form (name, company, what triggered the need); logged to new `gt_referral_leads` table; admin notification email
- Middleware: leave payment gate and checkout code dormant (no deletion)
- Landing copy: reposition hero to practice-platform language (consultant-facing), companies get the referral form
- Acceptance: no path from the marketing site into company self-serve checkout; leads are logged and notified

## Phase 5 — Trust basics
- `/security` one-page overview (encryption at rest via Neon, access model, export/delete)
- Data export button (existing export route surfaced in settings) + delete-my-data request flow (logged, admin-notified)
- DPA template as downloadable page
- Acceptance: all three reachable from footer; delete request writes an audit log entry

## Success criteria (write to success/plan-j.md)
1. A fulfillment engagement can run without ad-hoc email: request created → client completes portal checklist → data reviewed → inventory produced
2. Vendor confirmed once = auto-mapped for the next client, traceable in the calc log
3. Reminder emails fire per schedule in smoke tests
4. Marketing site routes companies to referral, not checkout
5. All existing tests pass; new tests cover token access, reminder logic, vendor-mapping application

## Out of scope for Plan J
Questionnaire copilot and evidence locker (Plan K), white-label branding (Plan K), assurance binder (Plan L), consultant Stripe pricing changes (decide after first fulfillment revenue).

---

## Plan M — Remove Company Self-Serve from v2 (BUILT 2026-07-08, commit cae02c1)

**Decision (Malachi, 2026-07-08):** v1 and v2 are separate branches for a reason. v1 (`sendrow-v1`, frozen) is the archive of the company-first methodology; v2 doesn't need to carry it dormant. Delete the company self-serve surfaces from v2 — reverting = checking out v1.

### M1 — Delete company surfaces
- `app/(app)/**` — entire company dashboard tree (dashboard, intake, reports, scopes, settings, connections, gaps, governance, social, workpaper, scope3-screening)
- `app/connect/**` — client invite/login flow (replaced by the magic-link portal)
- `app/api/intake/**` — only caller was the deleted upload form (portal has its own import route)
- `app/api/export/**` — only linked from deleted settings page (consultant-side export is future work)

### M2 — Consultant-only onboarding
- `app/onboarding/page.tsx`: single consultant card; "Represent a company? Get matched →" link to `/get-matched`; consultants with accounts redirect to `/consultant`
- `lib/actions.ts`: delete `onboardAsCompany`, `acceptInvite`, `generateInviteToken`

### M3 — Rewire stragglers
- Consultant client page: remove invite-link section (portal is the client access path)
- All `redirect("/dashboard")` → `/onboarding` (or `/consultant` where role is known)
- Keep: `/setup`, `/checkout`, billing APIs (consultant billing), `/demo`, `/report` (shareable), shared libs (`import-core`, calc, ingest — portal uses them)

### Acceptance
- New signup has exactly one path: consultant. `/dashboard` and friends 404.
- Build passes, all tests pass. Portal flow untouched.

---

# Plan N — Final Product Program (PENDING APPROVAL)

> Goal: take `sendrow-v2` from "Plan J works end-to-end" to the complete practice platform described in GOALS.md. Audited 2026-07-08. Phases are sequenced by dependency and shippable independently; N1 is a production bug fix, N6 needs a real questionnaire from a founding partner.

## Audit — where v2 stands today

**Working:** magic-link portal (checklist, upload, manual entry) → shared import pipeline → review queue (approve/flag/reject) → vendor-mapping memory (global, human-confirmed, calc-log traceable) → reminders cron (3/7/14) → referral form → trust pages → Ledger theme. Consultant-only onboarding (Plan M). 150/150 tests.

**Broken/missing (found in audit):**
1. **Portal emails go nowhere** — `notifyClientOfDataRequest` looks up a client *login* (`role="company"`), which no longer exists in v2; no client contact email is captured anywhere. Data-request email and all reminder emails silently no-op. The copy-link button is currently the only real channel.
2. **Two parallel consultant surfaces** — `/consultant/clients/[id]` (+7 v1-era manage pages incl. social/governance) vs `/consultant/review/[companyId]`. Confusing; feels like the old product.
3. **No evidence storage** — portal uploads are parsed in the browser and discarded; only extracted rows survive. "Every figure clicks back to its source document" is not yet true.
4. **No reporting periods** — line items/sessions carry no fiscal-year tag; YoY is impossible.
5. **No white-label** — portal/emails are unbranded-generic; no consultant logo/colors; no shareable client results view (the answer to "do companies get a dashboard?").
6. **No questionnaire copilot** — the 2027 product, not started.
7. **Factor values still "representative"** — real EPA eGRID 2024 / USEEIO v2 numbers must land before the first client deliverable.
8. **Referral leads have no ops UI** — email-only; can't mark routed/converted (referral revenue untrackable).
9. Dead v1 code: `notifyConsultantOfAcceptedInvite`, `sendInviteAcceptedEmail`, `sendSectionCompleteEmail`, `inviteTokens` table usage. Favicon 404.

## N1 — Client contact & communication repair (P0, ships first)
- `gt_companies`: add `clientContactName`, `clientContactEmail`; collect in add-client form; editable on client page.
- `createDataRequest` → email portal link to the contact; reminders cron → contact (consultant CC at day 14 unchanged). "Resend portal link" button.
- Delete dead v1 notify/email paths (#9). Add favicon.
- Acceptance: create request with contact set → client receives portal email; reminder smoke tests target the contact.

## N2 — One consultant workspace
- `/consultant/clients/[id]` becomes THE client workspace, absorbing the review workspace: tabs/sections for **Overview** (footprint summary, pipeline stage, activity), **Data requests** (create, checklist status, portal link, reminders), **Review** (sessions queue, unmapped vendors, vendor confirm), **Enter data** (the manage-on-behalf scope1/2/3 + connections pages, consolidated).
- Retire `social/` and `governance/` manage pages (v1 ESG-report concepts; footprint sprint = Scope 1–2 + spend Scope 3). v1 branch keeps them.
- `/consultant/review` remains the cross-client queue; rows link into the client workspace. `/consultant` home becomes a practice board: per client — pipeline stage, open requests, items received/pending, unmapped vendor count, last activity (replaces v1 section-status cards).
- Acceptance: no duplicate surfaces; every consultant task reachable from the client workspace.

## N3 — Evidence locker
- Vercel Blob (private). Portal uploads store the **original file**; new `gt_evidence` (id, companyId, dataRequestId, checklistItemId, blobKey, filename, sha256, uploadedAt, uploadedVia).
- Import sessions record `evidenceId`; line items inherit it via calc log → "view source" link in review. Manual-entry rows record provenance (portal token, timestamp).
- Acceptance: any mapped line item traces to a downloadable source file or an explicit manual-entry provenance record.

## N4 — Reporting periods & YoY
- `period` (fiscal year label) on intake sessions + line items; company reporting-year config (start month exists already).
- Workspace totals filterable by period; YoY delta card when ≥2 periods exist. Groundwork for delta narratives (Plan L).

## N5 — White-label (the client-facing answer)
- `gt_consultant_profiles`: brand name, logo (Blob), accent color, reply-to.
- Portal, reminder/request emails, and PDFs render the consultant's brand; Sendrow's name appears nowhere client-visible (contracts §11 enforced by construction — CSS-token theming from Plan V makes this config-only).
- **Shareable results page** `/shared/[token]`: read-only, consultant-branded footprint summary + scope breakdown + YoY. This is how a company "sees their dashboard" — a deliverable the consultant shares, not a login.
- Acceptance: incognito walkthrough of portal + shared results shows zero Sendrow branding.

## N6 — Questionnaire copilot v1 (needs a real questionnaire in hand)
- Upload buyer questionnaire (CSV/XLSX/pasted list) → questions become rows; map each to inventory fields via a curated, human-confirmed mapping library (same doctrine as vendor mappings); draft answers from the computed inventory + company profile; consultant edits/approves; export CSV/PDF.
- Every confirmed question-mapping saves to a global format template ("built once, sold forever"); new formats are marketing events.
- Acceptance: one real questionnaire answered end-to-end with every figure traceable to the inventory.

## N7 — Ops, data & monetization polish
- **Real factor data** (pre-first-deliverable blocker): load actual EPA eGRID 2024 + USEEIO v2 values (data-only).
- `/admin/referrals`: list leads, mark routed → converted, note fee (referral revenue tracking).
- Billing stays dormant per revenue ladder (subscription only when portal + copilot are real); `/pricing/agency` quote flow remains the commercial path.
- Backlog (explicitly deferred): per-checklist-item comments (the "chat" question — async notes, not chat), peer benchmarking, EPR module, lead-magnet tools.

## Sequencing & verification
N1 → N2 → N3 → N4 → N5 → N7 in order; N6 starts the moment a founding partner supplies a questionnaire (can parallel N3+). Each phase: tests added, `tsc` + build clean, TASKS.md hydrated per workflow. Success criteria per phase written to success/plan-n.md as phases complete.

---

# Plan T — The Deliverable Machine (BUILT 2026-07-08, commits afca629→a054bb7)

> Malachi: "draft all the fixes… code as much as we can to get to the final product. Not launch ready — skip paywall/monetization. Just the product itself." Spans the ledger, intake repair, and ROADMAP's Plans O+P. Sequenced by dependency.

## T1 — Data Ledger + review repair
- Ledger view in the client workspace: every line item — source ref, activity, scope/category, raw value+unit, computed CO2e, period, status chip, link to source file (evidence); filter by status and by upload (via mapping profile).
- Row actions (server actions + pure recompute helper): **recategorize** (pick from the same confirmed-factor options as vendor memory → recompute CO2e, log), **edit quantity** (recompute with same factor), **exclude** (status `excluded`, reason logged — never deleted, per no-silent-drops).
- **Reject fix:** rejecting an upload marks its line items `excluded` with reason "session rejected" — they leave totals/unmapped counts (periodTotals already counts only `mapped`).
- Acceptance: consultant can inspect and correct any figure without touching the DB; rejected uploads no longer pollute totals; tests for the recompute/exclude helpers.

## T2 — Intake repair (clean data at the door)
- **Unit normalization** (`lib/ingestion/units.ts`): gal→gallon, MWh→kWh×1000, ccf→therms×1.037, L→gallons, tonne→ton, mi→mile… applied before factor resolution; tests.
- **Confirm-mapping screen** in the portal: after parsing, client calls `/api/portal/mapping-preview` (token-authed) with headers → server returns suggested map (memory > template+fuzzy) + confidence; supplier sees "their header → our field" dropdowns with 3 sample values per column, confirms/fixes; confirmed map submits with the import.
- **Format memory:** `headerFingerprint` (sha256 of normalized sorted headers) on mapping profiles; same shape next time → "Same as last time ✓" prefill.
- **Paste-friendly entry:** portal manual grid accepts paste-from-spreadsheet (TSV/CSV rows → parsed into grid for review before submit).
- Acceptance: a supplier confirms a weird file's mapping in one screen; re-uploading the same shape needs zero mapping clicks; MWh/gal/ccf rows stop false-flagging.

## T3 — Trust Core: snapshots, shares, restatements (ROADMAP Plan O)
- `gt_snapshots`: frozen copy (jsonb) of mapped line items + totals + factor vintages + content sha256, label/period, createdBy/At. Immutable by construction (§13).
- `gt_share_links` gains `snapshotId`: a share is THIS snapshot; `/shared/[token]` renders the frozen data when set (live view stays for legacy links).
- **Restatement alerts:** creating a new snapshot for the same period when the prior one was shared → email every recipient a what-changed summary (old vs new totals); pure diff helper, tested.
- Workspace: Snapshots card — create (label), list, share/revoke per snapshot.
- Acceptance: shared numbers can never silently change; corrections notify recipients with a diff.

## T4 — Reshaping engine v1 (ROADMAP Plan P, minus the real questionnaire)
- `lib/formats.ts` registry: snapshot → output. V1 formats: (a) line-items **Excel/CSV** export, (b) **SB 253-style disclosure summary** (scope totals, methodology, factor vintages), (c) **generic customer questionnaire** (reuse `lib/mapping.ts` question builder), (d) **PACT-compatible JSON draft** (basic PCF fields, labeled draft).
- `/api/snapshots/[id]/export?format=…` (consultant-authed) returns the file; export buttons per snapshot.
- The first *real* buyer format waits for Kerri's questionnaire (unchanged blocker).
- Acceptance: one approved snapshot exports to all four formats with zero manual formatting.

**Out of scope (explicitly, per Malachi):** paywall/billing, supplier Pro, buyer features, launch polish. Real factor data remains the standing pre-deliverable blocker (needs actual datasets).

## Verification per phase
tests + tsc + build green; TASKS.md hydrated; commit + push to sendrow-v2 per phase.

---

# Plan U — The Build Pipeline (PENDING APPROVAL)

> Source: Masao's "Sendrow Build Pipeline — Priority List" (2026-07-10, `docs/build-pipeline-2026-07-10.pdf`) — the declared single source of truth for build order. This plan maps his phases onto our actual codebase with honest statuses. Ground rules adopted as invariants: config-driven formats (§14a), snapshots-only sharing (§13), audit-everything, absolute client separation, PACT V3 only, workspace-scoped vendor memory (§14b).

## Conflicts with what we've built (doc wins — encoded)
1. **SB 253 first deadline is Aug 10, 2026** (we had Nov 10) — GOALS.md corrected.
2. **Vendor memory: per-workspace only; cross-platform is LATER** (privacy). Our global-scope option gets removed from the UI; existing "global" toggle becomes consultant-workspace scope. (§14b)
3. **Our format engine is hardcoded TS functions** — violates Ground Rule #1. U3 refactors to config/templates before any new format is added.
4. **Referral routing stays Masao's spreadsheet** — `/admin/referrals` is frozen as internal convenience; no further build.
5. Doc says "Render deployment" — we deploy on Vercel; noting, not changing.

## U1 — Phase 1: verify & harden the core loop
- **U1.1 Request fields (1.1):** add *time period* to data requests (company, data types, period, deadline); shown on the portal.
- **U1.2 Magic-link polish (1.2):** expired/revoked page gets a "request a new link" button (pings the consultant); QA on mobile.
- **U1.3 Unified audit events (1.8, Ground Rule 3):** every create/edit/approve/share/convert/comment event writes to the immutable event log; consultant-facing export as CSV. (Today: field-level auditLog + calc logs exist; approve/share/convert events aren't unified.)
- **U1.4 Prefill from last time (1.9/#12):** new requests pre-fill from the supplier's last approved data, visibly marked "from your 2025 submission — confirm or update."
- **U1.5 Comment threads, minimal (1.10/#6):** comment box per line item (ledger + portal), email notification to the other party, survives in history. Nothing fancier.
- **U1.6 Save & resume (1.11):** autosave partial portal answers (entry grid + walkthrough) — close the tab, reopen the link, resume; "3 of 7 sections complete" indicator.
- **U1.7 Estimate vs. actual (1.12):** visible status flag per value (we store `confidence`; surface + edit it); replacing an estimate with an actual logs a correction and later feeds restatement alerts.
- **U1.8 Multi-evidence per line item (1.4):** attach additional files to a ledger row (today: one file per upload session).

## U2 — Phase 2: demo & design-partner readiness
- **U2.1 Demo workspace (#49):** seeded "Pacific Sustainability Advisors" with 3 clients at different stages, realistic data + fake bills; reset script (`scripts/reset-demo.ts`). Do early — every sales conversation depends on it.
- **U2.2 Client-separation tests (#20):** automated tests attempting cross-client access through every endpoint (route-level, not just query-level).
- **U2.3 White-label completion (#22):** "Powered by Sendrow" small footer on portal/shared pages (doc explicitly wants it; consistent with re-scoped §11).
- **U2.4 Engagement templates (#23):** save a request setup as a template; one-click new request from template. Stored as config.
- **U2.5 Deadline-based chasing (#21):** reminders relative to the due date (7 days out, 2 out, day-of, overdue) replacing creation-relative 3/7/14; per-request cadence toggle; stop instantly on submission (exists); reminders logged (exists).
- **U2.6 Client profile basics (#46):** NAICS dropdown + employee size band at client creation — benchmarking prerequisite.
- **U2.7 Response notifications (2.8):** email the consultant on every submission/comment with a deep link (today only review-routed uploads notify).

## U3 — Phase 3: the format engine (the moat — most careful engineering)
- **U3.1 Config-driven reshaping (#9):** refactor `lib/formats.ts` from hardcoded functions to a **versioned template registry** (DB): field mappings + layout as data, conditional/branching support (CDP routes questions by company size/modules). Ship 3 formats as configs: SB 253 (against CARB's real Oct 2025 draft template — **Masao supplies it**), generic Excel, one real buyer questionnaire (**Masao gets from Kerri**).
- **U3.2 Format Mapping Builder (#35):** admin-only tool — upload a questionnaire, map each question to a Sendrow field, save as reusable template. Adding a format = an afternoon of clicking, not a code change. Must support conditional questionnaires.
- **U3.3 Template versioning (#33):** version field on templates; snapshots/exports record which template version produced them; CARB's summer-2026 revision is the fire drill.
- **U3.4 Answer once, share many (#26) + duplicate detection (3.5):** when a new request overlaps data the supplier already has approved (same period/categories), flag it and offer the snapshot-share path instead of a blank form.

## U4 — Phase 4: supplier trust & stickiness
- **U4.1 Free supplier account (#24):** after responding, one-click "claim your free account" (Clerk email+password), supplier role sees own data read-only. Never gate responding.
- **U4.2 Supplier attestation (#37):** "I confirm this data is accurate…" checkbox before shares; name/date/snapshot ID in the audit log.
- **U4.3 Share receipts (#38):** log recipient views/downloads of shared snapshots; show both sides.
- **U4.4 Supplier export (#25):** "Download all my data" — PACT V3 JSON + CSV.
- **U4.5 Reply-by-email v1 (#3):** inbound attachments land in an "unfiled inbox" on the request for the consultant to slot in (needs inbound-email provider setup — Resend inbound or similar; user action for DNS).
- **U4.6 Section delegation (4.6):** "send this section to a colleague" — scoped magic link per checklist item.
- **U4.7 Deadline extension request (4.7):** supplier button → consultant one-click approve/deny.
- **U4.8 Supplier mini-report (4.9):** on approval, one-click 5–8 page branded PDF (VSME Basic Module as skeleton). (#27 claimable starter profile waits on Masao's calculator.)

## U5 — Phase 5: audit-grade depth
- **U5.1 Method labeling (#17):** every number labeled spend-/activity-based + "X% of this footprint is activity-based" stat (CARB regulatory language).
- **U5.2 Methodology label schema (#14):** factor labels capture relevant/recent/geographically-correct, not just version (we have vintage; extend).
- **U5.3 Trust-level badges (#15):** self-reported / consultant-reviewed / assured — per dataset AND per metric; travels with snapshots into shares/exports.
- **U5.4 Restatements extended (#11):** estimate→actual transitions trigger the existing restatement flow.
- **U5.5 Factor update recalc preview (#39):** new factor set → one-click preview of a client's recalculated numbers; old snapshots stay frozen.
- **U5.6 Vendor memory re-scope (#18):** remove global option; workspace-scoped only (see conflict #2).
- **U5.7 Historical data import (#36):** consultant-side importer (reuse the mapping panel) for prior-year spreadsheets, rows marked "imported." V1 semi-manual is fine.
- **U5.8 IMP generator (5.8):** auto-generate the Inventory Management Plan / methodology manual from stored labels + boundary settings — the first thing an auditor asks for.

## U6 — Phase 6: consultant retention engine (after first design partner is live)
Compliance calendar (#44 — Masao maintains dates), monthly client digest (#45), consultant commentary blocks (#43), hotspot report (#40), YoY narrative templates (#41 — templates, not AI), score-gap flags (#42 — blocked on Masao's rubrics), completeness meter (6.7 — build the metric once, reuse everywhere).

## Parallel / process (not phases)
- PACT V3 data-model alignment as we touch schemas; SOC 2 readiness practices checklist in docs/.
- **Blocked on Masao:** CARB SB 253 draft template (U3.1), Kerri's buyer questionnaire (U3.1), CDP/EcoVadis scoring rubrics (U6), calculator data model (#27).

## Explicitly NOT building (doc's LATER list)
AI suggestions (#16), buyer features (#28–30), QuickBooks/utility integrations (#34), peer benchmarking (#47), EPR module (#50), referral-routing software (#48).

## Sequencing & verification
U1 → U2 → U3 → U4 → U5 → U6, one phase per approval-covered build session; tests + tsc + build green per phase; TASKS.md hydrated; each finished item marked back into the pipeline doc's terms in TASKS.md with date. U3 is the "most careful engineering" phase — it gets the deepest test coverage.
