# QA.md — Full product QA
> Method: code audit + live drive of production (sendrow.app) as demo consultant (`contact@sendrow.app`) + public portal/shared links. Seeded via `scripts/reset-demo.ts`.
> Legend: `[x]` verified working · `[!]` verified broken/confusing (see Findings) · `[ ]` not yet exercised
> Last updated: 2026-07-14 (evening) — **Plan X built on `sendrow-v2`**: items #3–#5, #7–#11, #13–#15, #17–#21 fixed in code (see TASKS.md X section). Production still runs the pre-X build until main is updated, so prod re-verification of the `[!]` items happens after deploy. #1 (Resend) + env vars remain backlog.

## Part 1 — Demo-feedback triage (every reported item, root-caused)

| # | Feedback | Verdict | Root cause | Fix |
|---|----------|---------|-----------|-----|
| 1 | Emails with links don't send | **Bug (silent-fail) + env** | `lib/email.ts` `send()` is fire-and-forget — Resend errors (unverified `hello@sendrow.app` domain, bad key) are swallowed; UI reports success either way | Check Resend response, log + audit-event failures, surface "email failed" in UI; verify domain/key in Resend dashboard (Malachi) |
| 2 | Numbers aren't evidence-attached | **Env + UX** | `BLOB_READ_WRITE_TOKEN` unset on Vercel → `storeEvidence` degrades to hash-only (by design, `lib/evidence.ts:28`); UI then shows nothing useful | Set token (Malachi); show "hash recorded, file not stored" state instead of dead ends |
| 3 | Utility upload won't import unless "insanely specific" | **Bug (copy vs code)** | Portal copy promises "PDF or spreadsheet" but `portal-checklist.tsx` parses with `XLSX.read` — PDFs and odd layouts fail; fuzzy header match only covers common names | Accept PDFs as evidence + manual entry path; widen header templates; honest copy |
| 4 | `Unexpected end of JSON input` on import | **Bug** | `portal-checklist.tsx:122,159` call `res.json()` unconditionally; any non-JSON failure (Vercel 413 >4.5MB body, function crash/timeout) throws this exact error | Guard json parse; client-side file-size check with clear message; try/catch in `/api/portal/import` so every path returns JSON |
| 5 | Consultant can't respond to a supplier's stuck message | **Feature gap** | Flag (`stuckNote`) is write-only: no reply UI on consultant side, no thread on portal | Reply box on client detail → posts reply, emails supplier, shows on portal (X2) |
| 6 | See/edit each format before download | **Planned (W3.2)** | Formats are hardcoded in `lib/formats.ts` until the format-engine phase | Pull a minimal "preview before download" into W3.1; editing = W3.2 builder |
| 7 | Comments invisible to supplier; no supplier dashboard | **Feature gap** — confirmed live: portal shows no comments, no stuck-message trace | Portal renders checklist only; comments are consultant-side | Portal thread section per item (X2); full supplier account = W4 |
| 8 | Completeness resets to 0% when a new request is added | **Bug** — confirmed in code | `client-status.ts:39` `completenessPercent` counts **open** requests only; fulfilled history ignored | Include fulfilled requests' items in the tally |
| 9 | QuickBooks connection shouldn't be consultant-facing | **Product decision** | `manage/connections` exposes client QB/UtilityAPI connect to the consultant | Recommend: move behind supplier portal (W4); hide from consultant nav now |
| 10 | Can't manually override Scope 2 | **Feature gap** | `manage/scope2` is read-only calc display | Add market-based override with audit event |
| 11 | Scope 3 industry-average always low-confidence; can't undo | **Half by-design, half gap** | Low confidence is intentional for estimates; there's no un-apply | Add "remove estimate" undo; explain the confidence label inline |
| 12 | Preflight checklist doesn't make sense | **Needs repro** | No "preflight" in codebase — probably the open-flags warning modal before approve, or the portal checklist | Ask which screen; then copy fix |
| 13 | Audit trail 404 on view/download | **Env + UX** | `/api/evidence/[id]` correctly 404s when `blobUrl` null (no blob token) | Same as #2: set token; friendly "not stored" page instead of raw 404 |
| 14 | New request: time period format ≠ due date format | **UX** — confirmed: period is free text, due date is a date input | `requests/new/request-form.tsx:160` | Period presets (CY2025 / FY / custom range) matching due-date pattern |
| 15 | "Reminder cadence: auto (7 / 2 / day-of / overdue)" unclear | **Copy** | `request-form.tsx:180` | Plain English: "Automatic reminders 7 and 2 days before the due date, on the day, and weekly if overdue" |
| 16 | Ledger: guided-walkthrough link dead | **Needs repro** | Walkthrough exists only as a portal entry mode; no such link found in ledger code | Reproduce with tester; likely stale copy |
| 17 | Ledger: "excluded" looks unclickable | **UX** | Filter chip low-contrast styling (`ledger/page.tsx:94-107`) | Contrast + hover state |
| 18 | Dashboard says flag open; review page shows nothing | **Bug** — confirmed in code | `review/page.tsx:42-49` counts stuckNotes in `openFlags` but never renders them; only unmapped rows are visible | Render stuck notes as flag cards on review page (X2) |
| 19 | Can't see individual data; inspect goes to full ledger | **UX** | Review page "inspect" → `/ledger?status=…` loses context | Link to ledger filtered to that upload + expand row; or inline expand in review |
| 20 | Format library upload goes in circles | **UX** | W3 placeholder card links back to dashboard; no real intake | Real intake (mailto/upload request) + clearer "coming in W3" copy |
| 21 | Activity log gibberish; separate from final report? | **Bug (minor) + copy** | Unknown verbs render raw (e.g. `snapshot.approved_with_flags` missing from `VERB_LABEL`); subjects carry raw ids | Complete verb map, humanize subjects; add note: audit log is permanent record, methodology ships inside exports |

## Part 2 — Full surface checklist

### Public marketing
- [x] `/` landing renders (hero, disclosure-readiness, recent-work panels)
- [x] `/how-it-works`, `/for-consultants`, `/pricing` render clean (no console/HTTP errors); `/for-companies` rebuilt minimal in X4.2 (verify after deploy)
- [x] `/demo` request form (rate-limited, submits → confirmation)
- [x] `/get-matched` renders clean (form submit → admin email still untested — Resend backlog)
- [x] `/terms`, `/privacy`, `/security`, `/dpa` render clean
- [x] `/login` email+password; new-device email code works
- [x] `/signup` → `/onboarding` → consultant workspace creation
- [ ] Logged-in visit to `/` redirects to `/consultant` (observed once — re-verify intended)

### Consultant app
- [x] Dashboard: stat cards, client table (status/due/completeness), Open/Archive/Delete
- [!] Completeness math after new request on complete client (#8)
- [x] Client detail hub: stats row, requests, portal-link copy, timeline, threads
- [!] Flag card: no reply mechanism (#5)
- [x] `requests/new`: template select, checklist builder, create → request row appears
- [!] Time-period input + reminder-cadence copy (#14, #15)
- [ ] Request email actually lands in a real inbox (#1)
- [x] Chasing schedule page renders (toggle actions untested)
- [x] Review & Approve: category groups, comment box, snapshot label, approve-freeze flow (seeded PCL proves the happy path)
- [!] Stuck notes counted but not rendered (#18); inspect link context (#19)
- [ ] Approve with open flags → warning modal contents
- [x] Snapshot page: scope cards, sha256, format chips, share links, restatement note
- [x] All four format downloads return 200 w/ correct content types + non-empty bodies (sb253 md 1.2KB, xlsx 19.8KB, csv 714B, PACT json 948B); cell-level contents not audited
- [x] Templates page renders (create/edit flow untested)
- [!] Format library: placeholder loop (#20)
- [x] Compliance calendar renders — NOTE: preloads say SB 253 = Aug 10, 2026 but Malachi's deck correction says Nov 10 — confirm which and align
- [x] Settings renders w/ email preview (save + logo upload untested — logo needs blob token)
- [x] `clients/new` renders (create flow untested)
- [x] Ledger: filters, totals, per-row expand (rows render; comments attach)
- [!] Excluded chip affordance (#17)
- [!] Evidence view/download 404 when blob unset (#13)
- [x] Activity: events render, CSV export link
- [!] Unknown verbs raw (#21)
- [x] `manage/scope1` renders; scope2 override + scope3 undo built in X3.4/X3.5 (verify after deploy)
- [x] `manage/connections` removed from consultant UI (X4.1)
- [!] `manage/reports` linked to deleted v1 routes `/consultant/report/[id]/ghg|audit` → 404 (the REAL feedback #13) — FIXED 2026-07-14: audit trail now points to Activity + CSV export; totals-agreement check still open
- [ ] Client separation: second consultant account cannot open first's client (contract tests cover; spot-check URL)

### Supplier portal (magic link)
- [x] Valid token renders checklist w/ received/needed states
- [ ] Expired/invalid token → friendly error + request-new-link flow
- [x] Stuck button sends message (seeded); [!] no echo/thread after sending (#7)
- [ ] CSV upload happy path: parse → mapping preview → confirm → imported rows land in ledger
- [ ] XLSX multi-sheet: sheet picker
- [!] PDF upload: fails XLSX parse — copy promises PDF (#3)
- [ ] Oversized file (>4.5MB): clear error, not JSON crash (#4)
- [ ] Manual entry rows + draft autosave (localStorage) survive refresh
- [ ] Paste-from-spreadsheet path
- [ ] Guided walkthrough mode end-to-end (#16)
- [ ] Template CSV download button
- [ ] Repeat upload with same headers → format memory prefills mapping

### Shared / buyer view
- [x] `/shared/[token]` renders frozen snapshot, totals, prepared-by
- [ ] Revoked share link → access removed
- [ ] Restatement: correct → new snapshot → recipients alerted; old link shows notice

### Email (needs Resend domain/key verified first — #1)
- [ ] Data-request email w/ portal link
- [ ] Reminder cadence sends (cron: `CRON_SECRET` set?)
- [ ] Submission notification to consultant
- [ ] Comment email to supplier
- [ ] Restatement alert
- [ ] Demo-request + get-matched admin emails

### API / integrity
- [ ] `/api/events/export` CSV opens
- [x] `/api/evidence/[id]` — 404 path confirmed; happy path untestable until blob token set
- [ ] Snapshot export endpoints return files w/ correct totals
- [ ] `portal/import` returns JSON on every error path (#4)
- [ ] Rate limits on public POSTs (demo, stuck, request-new-link)
- [ ] `/admin` gated by `ADMIN_CLERK_ID` (unset → always redirects; set it)

### Env prerequisites (Vercel — only Malachi)
- [ ] `BLOB_READ_WRITE_TOKEN` (unblocks #2, #13, evidence QA)
- [ ] `CRON_SECRET` (reminder emails)
- [ ] `ADMIN_CLERK_ID` (admin + factor entry)
- [ ] Resend: verify sending domain for `hello@sendrow.app` (#1)
