# Product Wireframes — 2026-07-13 (Malachi's Figma)

> Source: `Sendrow — Product Wireframes.fig` (Malachi's Downloads; decoded node tree in `wireframes-2026-07-13-raw-outline.txt` — exact microcopy for every screen lives there).
> Frame titles carry Masao's pipeline item numbers (`docs/build-pipeline-2026-07-10.pdf`). Every frame is annotated CONSULTANT or SUPPLIER + when it's reached.
> These wireframes are the UI spec for Plan W (PLANS.md).

## 1. Core Loop — Request to Snapshot

| Screen | Pipeline # | Who / when | Key elements |
|---|---|---|---|
| **Consultant Dashboard** | #19 | Consultant home, first screen after login | Sidebar (Dashboard, Settings, New request, Compliance calendar, Request templates, Format library) · stat cards **Overdue / Ready to review / Awaiting response** · client table: Client, Status badge (Awaiting reply / Ready for review / Overdue / Approved), Due date, Completeness % · `+ New request` |
| **New Data Request** | #1 | From dashboard | "Start from a template (skips steps below)" dropdown · supplier search/select + contact email · data-type chips (Electricity, Fuel, Spend, Waste, Water) · time period · due date · reminder cadence preview "auto (7/2/day-of/overdue)" + Edit → · "Save this setup as a template" · notice: supplier gets magic link, no account needed |
| **Client Detail View** | #19 #6 #13 | Click client row on dashboard | Header: name, industry · size · status · stats row: Completeness %, Evidence attached (12 of 12), Flags open · Requests list (Q1 2026 = Ready for review, past = Approved) — click → read-only snapshot (past) or Review & Approve (current) · Activity timeline · Comment threads (question + supplier reply) |
| **Review & Approve** | #7 #6 #18 | Opens when supplier submits | Line items (Electricity 12,400 kWh · 1 file; Fuel 4,800 gal + resolved comment thread; Spend $142,000) · vendor category confirmation: "Shell Fleet Card → Mobile combustion (Scope 1) — Remembered from last year, click to change" · buttons: **Request changes** / **Approve, freeze & go to snapshot** (one continuous action into Snapshot & Share) |
| **Modal — Approve With Open Flag** | — | Popup on approve w/ open flags | "1 item is still flagged … You can still approve and freeze with the flag open." · Approve with flag open / Go back |
| **Snapshot & Share** | #8 #10 #9 | Right after approve | 🔒 Locked + date · Scope 1/2/3 tCO2e cards · "Calculated from approved line items using stored methodology + emission factors" · evidence count + approver line · **attestation status** ("Attested by Priya Chen … sharing is enabled") · Share: recipient + format chips (SB 253, CDP, Excel, Custom) · "Requires supplier's explicit OK before this share goes out" · Confirm & share · correction note: edit flagged item → new corrected snapshot, old stays on record · "New for this client": → Hotspot report ready, → Score gap check ready |

## 2. Supplier Journey

| Screen | Pipeline # | Who / when | Key elements |
|---|---|---|---|
| **Magic-Link Form** | #2 #4 #5 | Opens from email link, no login | White-label header ("Bluewater Logistics requested by Pacific Sustainability Advisors") · "Section 3 of 5 — Electricity use" · plain-language ask + reassurance copy · dropzone + uploaded file rows (✓) · "Not sure? Leave a note" textarea · Saved automatically · Back/Continue · footer links: **Send this section to a colleague** · **Request more time** · "Powered by sendrow" |
| **Review & Submit** | — | After last section, before confirmation | Per-section summary rows (value + files + Edit) · attestation checkbox "I confirm this data is accurate…" — scoped: "confirms only this snapshot (Q1 2026)" · Submit to {consultant} |
| **Confirmation** | — | After submit | "Sent — you're all set" · consultant will reach out through this same link · **Claim your free account** (email + password) / "No thanks, I'm done" |
| **Claim Account** | #24 | Optional, from confirmation | Email (prefilled) + password → Create account · "See your data anytime, reply to questions, reuse it next time someone asks" |
| **Supplier Account — Trust & Data** | #37 #38 #25 #24 | Claimed account home | "Your data is yours" · **Download all my data** (PACT V3 or CSV) · **Share receipts** (Pacific viewed Jul 9 3:42pm · Elena/Northgate downloaded Jul 10) · Questions from consultant w/ inline reply (also answerable by email) · attestation record (signed by, date) · category confirmation w/ **Flag this →** |
| **Supplier Mini-Report** | #4.9 | Auto-generated on snapshot approval | "Your first sustainability report" · Scope 1/2/3 cards · Key initiatives text · "Consultant-reviewed — verified by {consultant}" badge · Download PDF / Share link · "put it on your website, win new business" |
| **Flag Confirmation** | — | From "Flag this" | Free-text ("should be Scope 3, not Scope 1 — we lease these vehicles") → Send to consultant |

## 3. Consultant Management

| Screen | Pipeline # | Key elements |
|---|---|---|
| **Settings — White Label** | #22 | Display name, logo upload, accent color · **live preview of the request email** as the supplier sees it · Save branding |
| **Automatic Chasing** | #21 | Per-request reminder schedule: 7 days / 2 days / day-of (each toggleable, shows scheduled date) + "If overdue: repeats every 3 days" · reminder log (date, tone, includes magic link) · "Cadence auto-set from Compliance Calendar" · approved extensions auto-pause; delegated-section completions don't trigger reminders |
| **Engagement Templates** | #23 | Template cards (Standard SB 253 package = Default · CDP full disclosure · custom buyer questionnaire) with "Used on N clients" + **Start new request** · + New template |
| **Historical Data Import** | #36 | 3 steps: upload spreadsheet → map columns to Sendrow fields (Column B "kWh Used" → Electricity) → preview as prior-year data marked **"imported"** (editable, flagged historical). V1 semi-manual, run on a call with the consultant |

## 4. Format Engine (the moat)

| Screen | Pipeline # | Key elements |
|---|---|---|
| **Format Library (list)** | #35 | Built-ins: SB 253 draft (CARB), CDP SME, plain Excel · consultant-added ("Northgate Retail's questionnaire — added by Masao · **private until confirmed**") · Use buttons · + Add a new format → builder |
| **Add New Format (builder)** | #35 | 4 steps: ① Upload buyer questionnaire (PDF/Excel) → ② Connect each question to a data field ("Scope 1 emissions figure?" → `scope_1_total`) → ③ Save as template (one-time, private until buyer-confirmed) → ④ appears as a format option everywhere. "Does this once per new buyer questionnaire, then reusable forever" |

## 5. Supplier Utility Modals

| Modal | Pipeline # | Key elements |
|---|---|---|
| **Answer Once, Share Many** | #26 | Auto-pops when a NEW magic link overlaps existing data: "Harbor Supply Co. is requesting the same Q1 2026 data you already gave Pacific…" · card of the approved snapshot · **Share existing snapshot** / Start fresh instead · original consultant gets notified · "10 seconds instead of 20 minutes" |
| **Section Delegation** | #4.6 | Colleague email → scoped link to just that section, no account needed |
| **Deadline Extension** | #4.7 | Current due date · requested date · optional reason · consultant gets one-click approve/deny |

## 6. Retention & Upsell

| Screen | Pipeline # | Key elements |
|---|---|---|
| **Monthly Client Digest** | #45 #43 | Auto-generated monthly, **forwarded as-is to justify retainer**: stats (data received, completeness, flags raised/resolved) · activity timeline · consultant's note · Forward to client |
| **Compliance Calendar** | #44 | Regulatory dates preloaded (SB 253 Scope 1/2 — Aug 10 2026 · CDP window closes Sep 14 · SB 253 Scope 3 2027 cycle) + custom per-client deadlines · **deadlines auto-set each request's chasing cadence** · Masao maintains dates, Malachi builds plumbing |
| **Hotspot Report** | #40 | Auto-generated the moment a footprint is approved: top 5 emission sources w/ % bars (electricity 42%, fleet fuel 21%…) · standard reduction suggestions · **Turn into client pitch** |
| **Score-Gap Flags** | #42 | "Current B → Achievable A" · gap list w/ impact badges (missing verification statement = High, no water disclosure = Low) · **Propose score-improvement work** · checked against CDP/EcoVadis rubrics (blocked on Masao) |
| **Components** | #43 #6.7 | **Completeness meter** (data received / reviewed / evidence attached %) — reused on dashboard, client detail, digest · **Consultant commentary block** (attributed analysis) — appears in every export |

## 7. Audit-Grade (Phase 5)

| Screen | Pipeline # | Key elements |
|---|---|---|
| **Methodology & Trust Detail** | #17 #14 #15 | Expands from any Review & Approve line item: calculation method (activity-based — metered, not spend) · emission factor (EPA eGRID 2025 v2.1) + Current badge · factor relevance check (activity type, region CAMX, published this year) · trust level (consultant-reviewed) · "87% of footprint is activity-based (CARB requires disclosing this ratio)" |
| **Restatement Alert** | #11 | Auto-sent to everyone who received the old snapshot: was/now/reason diff · View corrected snapshot · original stays on record |
| **Factor Update Recalc** | #39 | Triggered when new factor set publishes: "EPA eGRID 2026 (v2.2) available — 6 clients on old set" · per-client preview (220 → 207 tCO2e, −5.9%) · **Apply to future reports** — old reports stay frozen |
| **IMP Generator** | #5.8 | Auto-built from stored methodology labels, nothing typed by hand: org boundary, reporting boundary, methodology per source, data quality & estimation, correction procedure · Download IMP · "what an assurance provider asks for first" |
