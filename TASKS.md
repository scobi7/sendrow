# TASKS.md — Open Work
> Generated from Plan W (PLANS.md). UI spec: `docs/wireframes-2026-07-13.md`. Completed plans: A–N, T, U1–U2 — history in git.

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
