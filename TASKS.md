# TASKS.md — Open Work
> **DEPLOYED TO PRODUCTION 2026-07-28** (main = ef96739 = sendrow-v3; Resend verified, email live). Active dev branch = `sendrow-v3` (== main). Plan Z in flight (Z1.1 + Z2 done; Z3/Z4/Z5 open). Under consideration: multi-office/CFO layer (NEXT.md). Completed: A–N, T, U1–U2, W1–W2, X, Y (board reverted), Z1.1, Z2 — history in git. BUGS section above = live "what's broken".

## BUGS — everything that doesn't work (audited 2026-07-21, updated 2026-07-23, branch `sendrow-v3`)
> Method: static route/link audit + live page-by-page sweep of all 34 routes + mutation pass, all driven against real demo data (temporary dev-only auth bypass, reverted each time). Every page returns HTTP 200 with no JS errors EXCEPT where noted. Severity: P0 blocks a demo, P1 real bug, P2 polish/cleanup, BLOCKED needs env/user to even test.

**Fixed on v3 (2026-07-21 → 07-23)**
- [x] **BUG-2 (FIXED)** — `/consultant/review` was orphaned BUT two notification emails linked to it → consultants landed on a stale page. Repointed `sendClientStuckEmail` → client detail (reply box, passes companyId), `sendUploadNeedsReviewEmail` (dead fn) → dashboard; deleted `app/consultant/review/`.
- [x] **BUG-3 (FIXED)** — Added `app/consultant/loading.tsx` + `clients/[id]/loading.tsx` skeletons (cover all consultant pages). No more blank-screen gap; verified live.
- [x] **BUG-5 (FIXED)** — Trailing scroll spacer on the (now-reverted) board.
- [x] **BUG-8 (FIXED — found by mutation testing)** — Flag replies were write-only on the consultant side; the flag card now echoes "You replied: ..." with timestamps. Verified live.
- [x] **BUG-10 (FIXED — found by staging E2E)** — `/api/portal/import` used `file instanceof File`, but `File` is not a global on Node <20 → ReferenceError silently killed EVERY file upload on older runtimes (incl. local dev). Now duck-types the Blob (`typeof file !== "string"`). Prod (Node 20+) was unaffected but it was fragile.

**Still open**
- [ ] **BUG-9 (P1, correctness — found in QA) — diesel & propane are calculated with the GASOLINE factor.** `resolveFactorQuery` returns the same generic `{mobile_combustion, gallon}` query for any fuel, and `lookupFactor` returns the first match (gasoline 0.008887) regardless of diesel/propane. E.g. 400 gal diesel → app says 3554.80 kg, correct is 4084.00 kg (~13% understated). Fix: pass the specific fuel type through to the factor lookup. Small change, high value.
- [ ] **BUG-1 (P1)** — `/admin/factors` hangs ~15s + React hydration error before redirecting a non-admin to `/login`. Blocks real emission-factor entry (N7.2). Partly a keyless-dev artifact; investigate once ADMIN_CLERK_ID + prod Clerk are set.
- [ ] **BUG-4 (P2)** — Slow authenticated loads (dev, cold): client detail 4.3s, review 4.7s, manage 6.7s. Inflated by dev + Neon latency + sequential queries; BUG-3 loading states mask it, but a perf pass (parallelize queries) is still worth it. Re-measure on prod.
- [ ] **BUG-11 (P2, found in QA) — Excel serial dates.** Files opened/re-saved in Excel or Numbers convert dates like `2025-04` into serial numbers (`45657.66…`). Calcs are unaffected (quantity × factor), but date/period tagging is garbage. Fix: detect + convert Excel serials in the parser, or note "upload the raw CSV."

**Dead / disabled surfaces (harmless but confusing if a demo wanders in)**
- [ ] **BUG-6 (P2)** — QuickBooks API routes (`/api/auth/quickbooks/redirect|callback`) still exist though the UI was removed in Plan X4. Dead endpoints — remove or leave dormant (documented).
- [ ] **BUG-7 (P2)** — Payment gate is disabled (middleware comment), so `/checkout`, `/pricing`, `/pricing/agency` are reachable but non-functional. By design during dev, but pricing is deferred (GOALS.md) — make sure no demo path links into checkout.

**Could NOT verify — BLOCKED on env or would mutate prod data (not confirmed broken, just untested)**
- [~] **BUG-B1 (UNBLOCKED 2026-07-28)** — Resend sending domain now verified, so email delivers in prod. Still needs a live smoke-test (Malachi: create a real request to your own email on sendrow.app → confirm it lands). The bypass can't test prod email (prod uses real Clerk).
- [ ] **BUG-B2 (BLOCKED)** — Evidence view/download: `BLOB_READ_WRITE_TOKEN` unset, so uploads are hash-only and the download route serves the "file not stored" page (Plan X made that honest, but real storage is untested). Needs Malachi (Vercel env) — see D2.2.
- [x] **BUG-B3 (VERIFIED 2026-07-23)** — Portal submission end-to-end driven live: upload file → mapping preview → confirm → stage → Submit all → line items land in the ledger (11 rows). Also confirmed the staging guarantee (ledger stayed empty while staged). Works.
- [~] **BUG-B4 (mostly verified)** — Mutation pass: **create request ✓, reply-to-flag ✓, approve-and-freeze ✓, share snapshot ✓, portal staged-submit ✓.** Still untested: create client, scope-2 override save, comment on line item. QA mutations cleaned via `reset-demo.ts` after each pass.
- [ ] **QA-1 — walk through manually uploading data.** Drive the portal "Type it in" (manual entry) path end-to-end: add rows (date/kind/quantity), stage, submit; confirm the entries convert + calculate + land in the ledger like the file-upload path. (File-upload/staging is verified in BUG-B3; manual entry not yet walked through.)

**Not bugs, but demo-prep gotchas**
- Seed dates are relative (`daysAgo` in reset-demo.ts): reseed the morning of any demo so dates read sensibly (D3.3). Last reseeded clean 2026-07-23.
- **QA test kit** in `~/Downloads/qa-A…D-*.csv` + `qa-combined.csv` — sample sheets with ground-truth CO2e (electricity/gas/fuel + edge cases). Upload `qa-combined.csv` to exercise everything in one item; diesel rows reveal BUG-9.

## Plan W — Wireframe Workflow Alignment

### W1 — Consultant IA shell + core-loop reshape — BUILT 2026-07-13
- [x] **W1.1** — Sidebar per wireframe (Dashboard / New request / Request templates / Format library / Compliance calendar / Settings)
- [x] **W1.2** — Dashboard #19: stat cards + client table (status · due · completeness) + `+ New request`
- [x] **W1.3** — StatusBadge, CompletenessMeter, StatCard (`components/workflow.tsx`) + `lib/client-status.ts` (11 tests)
- [x] **W1.4** — New Data Request page #1 (`/consultant/requests/new`) — template prefill, chips, cadence note, save-as-template, inline contact email
- [x] **W1.5** — Client Detail rebuild: stats row, requests → review/snapshot, event timeline, comment threads
- [x] **W1.6** — Engagement Templates page #23 (used-on count = matching request descriptions)
- [x] **W1.7** — Format Library page #35 (built-ins; add-new = honest W3 placeholder w/ interim path)
- [x] **W1.8** — Compliance Calendar page #44 (regulatory preloads + live request due dates)
- [x] **W1.9** — Chasing schedule page #21 (tier dates, sent log, pause/resume; age-based fallback shown)
- [x] **W1.10** — Settings #22 live email preview (name + accent update as you type)

### W2 — Review & Approve → Snapshot & Share — BUILT 2026-07-13
- [x] **W2.1** — Review & Approve page: category groups w/ files + threads, vendor confirm, session actions, dollar-fuel, ledger link
- [x] **W2.2** — `approveFreezeAndGo`: approves pending sessions → freezes snapshot → redirects to Snapshot & Share
- [x] **W2.3** — Open-flag warning modal (unmapped rows + stuck notes counted; approval logged w/ flags)
- [x] **W2.4** — Snapshot & Share page: 🔒 header, scope cards, format chips, share + receipts, correction note
- [ ] **W2.5** — Click-through verification with demo data (needs local Clerk login — Malachi)

### Y — MVP for pilots + CRM reshape (branch `sendrow-v3`; from 2026-07-21 meeting, PLANS.md Plan Y)
**Y1 — Pipeline board home — BUILT then REVERTED 2026-07-23**
- [x] **Y1.1** — `pipelineStage()` + `STAGE_META` + `isOverdue()` in `lib/client-status.ts` (5-stage derived; overdue = flag) + 7 unit tests. **Kept (unused after revert).**
- [x] **Y1.2** — `components/pipeline-board.tsx` (kanban columns + cards). **Kept (unused after revert).**
- [~] **Y1.3** — Board was live at `/consultant`, then **REVERTED to the old stat-cards + table** (Malachi preferred the old style, 2026-07-23). Delete added to client detail. Board code stays for an easy toggle-back.
- [x] **Y1.4** — Verified live: 3 seed clients landed in 3 columns (before revert).
- [ ] **Y1.5** — Deeper CRM client-detail reshape — NOT built (board reverted; revisit only if the board comes back).

**Y6 — Portal multi-file + batch-submit — BUILT 2026-07-23**
- [x] **Y6.1** — Multiple files per checklist item (up to `MAX_FILES_PER_CHECKLIST_ITEM = 12`): `fileCount` on ChecklistItem, cap enforced server + client, "+ Add another file (N of 12)" button. Verified live.
- [x] **Y6.2** — Batch-submit / true staging: confirmed files held client-side, sticky "Submit all N" bar with per-file remove, nothing reaches server/consultant until Submit. Verified live E2E (ledger empty while staged → data lands on submit). Tradeoff accepted: tab-close loses staged uploads.

**Y3 — Conversion P0 (highest leverage; not started)**
- [ ] **Y3.1** — Early-engagement reminder 48–72h after send (≤4 total touches)
- [ ] **Y3.2** — Checklist items + est. time inside the request email
- [ ] **Y3.3** — Per-item time estimates + overall progress on portal
- [ ] **Y3.4** — Named-buyer "why" framing in the request

**Y-discovery / research (Malachi-led or non-code)**
- [ ] **Y2** — Confirm supplier persona + consultant need via discovery (Berkeley net + Azoulay intros)
- [x] **Y4** — No emojis / em dashes verified across product UI (grep-clean)
- [ ] **Y5** — Data-asset research thread (not scoped)

### Z — MVP reporting hardening (APPROVED 2026-07-28; PLANS.md Plan Z). Sequence: Z1.1 → Z2 → Z4 → Z3.
**Z1 — Correctness**
- [x] **Z1.1** — BUG-9 FIXED: `FactorQuery.keyword` disambiguates fuel; `resolveFactorQuery` + `fleetFuelToLineItems` pass the fuel type. diesel→fuel.diesel (400gal = 4084kg ✓), propane→equip/fuel.propane. +2 tests (220 total).
- [ ] **Z1.2** — BUG-11: Excel serial dates (`45657.66`) → detect + convert to ISO in the parser
**Z2 — Comments gap (supplier can't see/answer line-item questions without an account) — DONE 2026-07-28**
- [x] **Z2.1** — "Questions from your consultant" section on the portal shows consultant line-item comments (figure-labeled) + a Reply box (two-way, via new `/api/portal/line-comment`). Verified live on demo_bayb (July-spike question shows; reply posts).
- [x] **Z2.2** — `sendCommentEmail` now links to the portal ("Open your secure page to answer") instead of the dead-end "reply to this email"; caller passes the open request's token.
**Z3 — Polish / cleanup**
- [ ] **Z3.1** — BUG-4: parallelize slow queries (client detail/review/manage/snapshot)
- [ ] **Z3.2** — BUG-6: remove dead QuickBooks API routes
- [ ] **Z3.3** — BUG-7: ensure nothing links into disabled `/checkout`
- [ ] **Z3.4** — BUG-1: `/admin/factors` hydration hang (partly blocked on prod Clerk + ADMIN_CLERK_ID)
**Z4 — Conversion P0 (existential)**
- [ ] **Z4.1** — Early-engagement reminder 48–72h after send (≤4 total touches)
- [ ] **Z4.2** — Checklist items + est. time inside the request email
- [ ] **Z4.3** — Per-item progress on the portal ("2 of 3, ~4 min left")
- [ ] **Z4.4** — Named-buyer "why" framing in the request
**Z5 — Optional**
- [ ] **Z5.1** — Draft-persistence for staged uploads (survive tab close)
- [ ] **Z5.2** — QA untested flows: manual entry (QA-1), create-client, scope-2 override, line-item comment

### MO — Multi-office collection (Phase 1) — BUILT 2026-07-31, verified live E2E
> Schema (all additive/nullable, applied by build's drizzle push): `locations` + name/contactName/contactEmail · `dataRequests` + locationId/parentRequestId · `emissionLineItems` + locationId. New: `lib/locations.ts` (subregion options + pure `siteRollups`), `lib/site-requests.ts` (`sendSiteLink` create-or-resend, shared by consultant action + portal route), `/api/portal/delegate`.
- [x] **MO1** — Locations first-class: LocationsPanel on consultant client detail (add site w/ subregion dropdown, contact, remove-if-unreferenced); events `location.added/removed`
- [x] **MO2** — Per-site delegation links: consultant `sendSiteLinkAction` + CFO portal SiteDelegation panel → `/api/portal/delegate` (parent token = auth; site links can't fan out further); email via existing `sendDataRequestEmail`, copyable link when no contact email
- [x] **MO3** — Portal imports tag `emissionLineItems.locationId` (locationId validated against companyId) and pass the site's `egridSubregion` into `rowToLineItem`
- [x] **MO4** — Electricity calcs use the site's own factor (verified: 10,000 kWh Dayton → 4550 kg via RFCW, not 3690 USAVG); "By location" breakdown on review + snapshot (frozen items carry locationId), site tag in ledger rows
- [x] **MO5** — CFO rollup on the parent portal + same rollup on consultant client page: per-site status (no link / link sent / responding / complete), items in, tCO2e, send/resend, aggregate = sum of sites (verified 9.5+11.1+8.9=29.5 t)
- [x] **MO-demo** — Sierra Materials Group in `reset-demo.ts`: Fresno done (CAMX), Fort Worth responding (ERCT), Dayton not yet invited (RFCW)
- [ ] **MO6 (defer)** — auto zip→eGRID lookup (EPA mapping) · client charts dashboard (validate demand first) · international factors

### D — Azoulay demo prep (meeting next Thu ~2026-07-23; PLANNED 2026-07-16, no code started)
> Danielle Azoulay = founder, The CSO Shop (fractional sustainability consultancy; ex-L'Oreal USA CSR head, Columbia Climate School adjunct). She IS the ICP: a consultant running CPG/apparel client books. She will know SB 253 + GHG Protocol cold. Goal of meeting: design-partner interest, not just applause.

**D1 — Correctness she would catch (do first)**
- [x] **D1.1** — SB 253 date RESOLVED = **Nov 10, 2026** (Malachi confirmed 2026-07-21). Aligned: calendar page, GOALS/ROADMAP/NEXT/wireframes docs, deck already says Nov 10. (period.test.ts Aug-10 is unrelated fiscal-year test, left as-is.)
- [ ] **D1.2** — Real eGRID 2024 / USEEIO factor values via /admin/factors, or clearly label current factors as illustrative — she may check the math on screen (needs ADMIN_CLERK_ID env first)
- [ ] **D1.3** — Sanity-pass GHG terminology on visible screens (market- vs location-based, Scope 2 dual reporting, assurance = ISSA 5000)
- [ ] **D1.4** — SB 253 export chip: current output is a draft markdown — improve or label "draft pending CARB template" so it reads honest, not broken

**D2 — Ship + verify (the app she sees must be the fixed one)**
- [ ] **D2.1** — Deploy sendrow-v2 → main (Malachi decision; brings Plan X + emoji/em-dash sweep live; drizzle push adds nullable comment columns)
- [ ] **D2.2** — Vercel env: BLOB_READ_WRITE_TOKEN (evidence view/download must work in demo), CRON_SECRET, ADMIN_CLERK_ID (Malachi)
- [ ] **D2.3** — Resend: verify sending domain so request/reply emails actually deliver (Malachi) — the "client gets a link" beat depends on it
- [ ] **D2.4** — Post-deploy QA: re-verify every [!] item in QA.md on production + full happy-path click-through (request → portal submit → flag/reply → review → approve → snapshot → share)

**D3 — Make the demo hers**
- [ ] **D3.1** — Add a demo client from her world to reset-demo.ts: a personal-care/apparel supplier (packaging or contract manufacturer) mid-flow — she should see her own client book, not logistics companies
- [ ] **D3.2** — White-label the demo workspace as a plausible consultancy (settings: name/accent) so portal + share pages show the consultant-brand story
- [ ] **D3.3** — Reseed + verify demo account morning-of (`npx tsx scripts/reset-demo.ts user_3GVr5Css8qERqxyWiySrhNeX3WF`)

**D4 — The meeting itself**
- [ ] **D4.1** — 5-click demo script anchored on her POV (dashboard → stuck client + reply → review w/ receipts → freeze → buyer view), rehearsed twice
- [ ] **D4.2** — Backup: 3-min screen recording of the same path in case wifi/login fails
- [ ] **D4.3** — Deck: date line current; consider a CPG-flavored example; PPTX is editable for tweaks
- [ ] **D4.4** — One-pager on her (CSO Shop services, sectors, her CSO-role thesis) + 5 questions to ask HER (where collection fails for her clients, which formats she answers most, would she pilot w/ 1–2 clients, pricing sanity, who else should see this)
- [ ] **D4.5** — The ask, decided in advance: design-partner pilot with 1–2 of her clients (free), feedback loop, intros to 3 consultants if it goes well

### X — Demo-feedback fixes (APPROVED 2026-07-14, QA.md Part 1 = triage)
- [x] **X1.1** — Portal import never crashes: `readJson` helper, 4MB client guard, try/catch wrapper in `/api/portal/import` (#4)
- [x] **X1.2** — PDF uploads → stashed as evidence + routed to manual entry w/ notice; checklist copy fixed (#3)
- [x] **X1.3** — `completenessPercent` includes fulfilled requests (#8) + regression test (211 passing)
- [x] **X1.4** — `send()` returns success; request emails log `email.sent`/`email.failed` on the timeline (#1)
- [x] **X1.5** — Evidence without blob: honest HTML page w/ sha256 + how-to-fix instead of raw 404 (#2/#13)
- [x] **X1.6** — Activity: 5 missing verbs added; header explains audit-log vs exports (#21)
- [x] **X2.1** — Comments extended to checklist items (nullable `lineItemId`, new `dataRequestId`/`checklistItemId`; schema applies at next deploy's drizzle push)
- [x] **X2.2** — Portal renders per-item thread (stuck message + replies); stuck route also writes the comment (#5/#7)
- [x] **X2.3** — Reply box + "mark resolved" on client-detail flag cards → thread + `sendFlagReplyEmail` w/ portal link (#5)
- [x] **X2.4** — Review page renders "Client is stuck" cards (#18); inspect links filter ledger by category (#19)
- [x] **X3.1** — "Data covers" preset dropdown + custom range (#14); reminder cadence in plain English (#15)
- [x] **X3.2** — Ledger filter chips readable + hover (#17)
- [x] **X3.3** — Format library: mailto intake w/ prefilled subject, circular links gone (#20)
- [x] **X3.4** — Scope 2 market-based override (tons + reason, audit-logged via logChange, wins in `totals()`) (#10)
- [x] **X3.5** — Scope 3 decision undo + low-confidence explanation tooltip (#11)
- [x] **X4.1** — Connections page deleted; nav/redirect/scope-page/email references cleaned; dormant lib/API code kept (#9)
- [x] **X4.2** — `/for-companies` rebuilt: one screen, get-matched funnel only (433 → 42 lines)
- [x] **X.extra** — All emojis removed from product UI (Malachi 2026-07-14); activity icons dropped, text labels instead
- [ ] **X.backlog** — Resend domain/key (Malachi) · env vars (Malachi) · "preflight checklist" + ledger "walkthrough link" repro (testers)

### W3 — Format engine (= U3, the moat)
- [ ] **W3.1** — `lib/formats.ts` → versioned template registry in DB (mappings + layout as data, conditional support)
- [ ] **W3.2** — Format Mapping Builder #35: upload questionnaire → connect questions → save template
- [ ] **W3.3** — Template versioning #33: snapshots/exports record version used
- [ ] **W3.4** — Answer once, share many #26 + duplicate request detection
- [ ] **W3.blocked** — SB 253 config vs CARB draft (Masao) · first real buyer questionnaire (Kerri)

### W4 — Supplier journey (= U4)
- [ ] **W4.1** — Portal Review & Submit step + per-snapshot attestation checkbox (#37)
- [ ] **W4.2** — Confirmation screen → claim free account (#24)
- [ ] **W4.3** — Supplier account trust page: share receipts (#38), download-all PACT V3 + CSV (#25), Q&A threads, flag path
- [ ] **W4.4** — Section delegation modal (4.6) · deadline extension request + approve/deny (4.7)
- [ ] **W4.5** — Supplier mini-report PDF (4.9) · reply-by-email v1 (#3, needs inbound provider)

### W5–W7 — Audit-grade + retention (= U5/U6)
- [ ] **W5** — Methodology detail (#17/#14/#15) · restatement alert UI (#11) · factor recalc preview (#39) · vendor-memory global removal (#18) · historical import (#36) · IMP (5.8)
- [ ] **W7** — Calendar plumbing → chasing (#44) · digest (#45) · commentary (#43) · hotspot (#40) · YoY (#41) · score gaps (#42, blocked) 

## Standing open items
- [ ] **N7.2** — Real EPA eGRID 2024 + USEEIO v2 factor values via /admin/factors — pre-deliverable blocker
- [ ] **OPS** — Vercel: `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`, `ADMIN_CLERK_ID`, Calendly links; v2 prod deploy is a user decision
