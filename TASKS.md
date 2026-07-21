# TASKS.md — Open Work
> Active branch `sendrow-v3` (CRM reshape). Plans in flight: Y (CRM/MVP-for-pilots), D (Azoulay demo prep), X (demo-feedback fixes — built). UI spec: `docs/wireframes-2026-07-13.md`. Completed: A–N, T, U1–U2, W1–W2 — history in git. Bugs section above is the live "what's broken" list.

## BUGS — everything that doesn't work (audited 2026-07-21 on branch `sendrow-v3`)
> Method: static route/link audit + live page-by-page sweep of all 34 routes driven against real demo data (temporary dev-only auth bypass, reverted). Every page returned HTTP 200 with no JS errors EXCEPT where noted. Severity: P0 blocks a demo, P1 real bug, P2 polish/cleanup, BLOCKED needs env/user to even test.

**Confirmed broken / degraded**
- [ ] **BUG-1 (P1)** — `/admin/factors` hangs ~15s and throws a React hydration error ("server HTML didn't match client") before redirecting a non-admin to `/login`. Blocks real emission-factor entry (see N7.2). Partly a keyless-dev artifact (the `/login` Clerk component stalls locally), but the hydration mismatch is real — investigate the factors page's server/client render. Verify severity once ADMIN_CLERK_ID + prod Clerk are set.
- [ ] **BUG-2 (P2)** — Orphaned routes from the pre-wireframe restructure: `/consultant/review` renders a stale standalone page that NOTHING links to; `/consultant/review/[companyId]` just redirects to the client detail. Dead code → delete both `app/consultant/review/` dirs (review now lives at `/consultant/clients/[id]/review`).
- [ ] **BUG-3 (P1, demo-relevant)** — No `loading.tsx` anywhere in the app (only one app-level `error.tsx`). Every server-rendered page shows a BLANK screen during its data fetch — 2-7s in dev, and worse on a cold Neon connection. On the demo this reads as a hang/freeze. Add loading skeletons at least for `/consultant` and `/consultant/clients/[id]*`.
- [ ] **BUG-4 (P2)** — Slow authenticated page loads (dev, cold): client detail 4.3s, review 4.7s, manage 6.7s, snapshot 4.6s, reports 4.6s. Inflated by dev mode + Neon latency + sequential queries, but combined with BUG-3 feels broken. Perf pass: parallelize queries, consider caching. Re-measure on prod.
- [ ] **BUG-5 (P2)** — Pipeline board: the rightmost "Approved" column card clips at the viewport edge on narrower screens (it's inside the horizontal-scroll container, so reachable, but the "shared to..." label + "View" get cut). Consider right padding / snap so the last column isn't visually truncated.

**Dead / disabled surfaces (harmless but confusing if a demo wanders in)**
- [ ] **BUG-6 (P2)** — QuickBooks API routes (`/api/auth/quickbooks/redirect|callback`) still exist though the UI was removed in Plan X4. Dead endpoints — remove or leave dormant (documented).
- [ ] **BUG-7 (P2)** — Payment gate is disabled (middleware comment), so `/checkout`, `/pricing`, `/pricing/agency` are reachable but non-functional. By design during dev, but pricing is deferred (GOALS.md) — make sure no demo path links into checkout.

**Could NOT verify — BLOCKED on env or would mutate prod data (not confirmed broken, just untested)**
- [ ] **BUG-B1 (BLOCKED)** — Email delivery (request link, reminders, flag reply, submission notice): Resend sending domain unverified, so all email is untested end-to-end. The "client gets a link" beat depends on it. Needs Malachi (Resend) — see D2.3.
- [ ] **BUG-B2 (BLOCKED)** — Evidence view/download: `BLOB_READ_WRITE_TOKEN` unset, so uploads are hash-only and the download route serves the "file not stored" page (Plan X made that honest, but real storage is untested). Needs Malachi (Vercel env) — see D2.2.
- [ ] **BUG-B3 (untested)** — Portal submission end-to-end (upload → mapping → import → appears in review) not driven this pass (needs a live token + writes to prod DB). Highest-value flow to verify before a pilot — do on a scratch client, not a demo one.
- [ ] **BUG-B4 (untested)** — Form mutations across the app (create client, create request, approve/freeze, share, comment, reply-to-flag, scope overrides) load fine but submits weren't exercised (would mutate prod demo data). Verify on a throwaway client.

**Not bugs, but demo-prep gotchas**
- Seed dates are relative (`daysAgo` in reset-demo.ts): the board currently shows "due Jul 26 / overdue Jul 19" from the last seed run. Reseed the morning of any demo so dates read sensibly (D3.3).

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
**Y1 — Pipeline board home (Pipedrive-style; demo-solid for Thu)**
- [ ] **Y1.1** — `pipelineStage()` + `STAGE_META` in `lib/client-status.ts` (derived 5-stage: new/requested/responding/review/approved; overdue = flag not column) + unit tests
- [ ] **Y1.2** — Board component: columns w/ count headers, client cards (name, contact, completeness, due/overdue, flag count, next-action, shared→X badge), clickable to next action; no drag (stage is derived)
- [ ] **Y1.3** — Replace dashboard table at `/consultant` with the board; keep archive/delete reachable (move to client detail if needed)
- [ ] **Y1.4** — Verify board renders live w/ seeded 3 clients landing in 3 different columns (Golden Gate=requested, Bayshore=responding, Pacific Coast=approved/shared)
- [ ] **Y1.5 (after Thu)** — Deeper reshape: client detail as CRM record (timeline-primary, tasks, contact block)

**Y3 — Conversion P0 (build for the demo)**
- [ ] **Y3.1** — Early-engagement reminder 48–72h after send (≤4 total touches)
- [ ] **Y3.2** — Checklist items + est. time inside the request email
- [ ] **Y3.3** — Per-item time estimates + overall progress on portal
- [ ] **Y3.4** — Named-buyer "why" framing in the request

**Y-discovery / research (Malachi-led or non-code)**
- [ ] **Y2** — Confirm supplier persona + consultant need via discovery (Berkeley net + Azoulay intros)
- [ ] **Y4** — Grep-verify no emojis / em dashes before v3 demo-ready
- [ ] **Y5** — Data-asset research thread (not scoped)

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
