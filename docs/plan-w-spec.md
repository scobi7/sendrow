# Plan W build spec: open phases W3 to W7

Moved from PLANS.md on 2026-11-13. W1 and W2 shipped (2026-07-13); their full specs are in git history.
UI spec: `docs/wireframes-2026-07-13.md` (screen inventory) and `docs/wireframes-2026-07-13-raw-outline.txt` (exact microcopy). Frame titles carry Masao's pipeline numbers (#N below). Scope source: `docs/build-pipeline-2026-07-10.pdf`.
Ground rules: formats are config (§14a), only snapshots are shared (§13), audit everything, absolute client separation (`ownsClient()` plus contract tests), PACT V3 only, vendor memory workspace-scoped (§14b).

## W3: Format engine (= U3, the moat)
- **W3.1 Config-driven reshaping (#9):** refactor `lib/formats.ts` into a versioned template registry in the DB: mappings and layout as data, with conditional branching (CDP). Ship configs: SB 253 (CARB draft, from Masao), generic Excel, one real buyer questionnaire (from Kerri).
- **W3.2 Format Library and Mapping Builder (#35):** library list (built-ins plus consultant-added, private until buyer-confirmed). Builder: upload, connect questions to fields, save as template, appears as a format option.
- **W3.3 Template versioning (#33):** snapshots and exports record the template version used.
- **W3.4 Answer once, share many (#26) plus duplicate detection:** overlap popup in the portal; share an existing snapshot (consultant notified) or start fresh.

## W4: Supplier journey (= U4)
Portal alignment #2/#4/#5 (section N of M, dropzone and file rows, note field, delegation and extension links). Review and Submit step with per-snapshot attestation checkbox (#37). Confirmation, then Claim Account (#24, never gates responding). Supplier Account trust page (#37/#38/#25): share receipts, download-all PACT V3 and CSV, Q&A threads, flag-categorization path. Section delegation modal (4.6). Deadline extension request with consultant one-click approve/deny (4.7). Supplier mini-report PDF, VSME skeleton (4.9). Reply-by-email v1 (#3, needs an inbound-email provider). (#27 waits on Masao's calculator.)

## W5: Consultant management screens
White-label settings #22: live request-email preview. Automatic Chasing page #21: per-touch toggles and scheduled dates, reminder log, calendar-driven cadence, extension auto-pause. Engagement Templates page #23: cards with used-on-N and start-request. Historical import wizard #36: upload, map columns, rows marked "imported" (pulled forward as an adoption unlock).

## W6: Audit-grade depth (= U5)
Methodology and trust detail expanding from line items (#17/#14/#15: method label, factor plus relevance check, trust badge, % activity-based CARB ratio). Estimate-to-actual restatement alert #11 (was/now/reason, all recipients). Factor-update recalc preview #39 (old snapshots stay frozen). Vendor memory global option removed (#18). IMP generator 5.8 (5 sections from stored labels).

## W7: Retention engine (= U6, after the first design partner)
Compliance calendar #44 (regulatory dates preloaded, drives chasing cadence; Masao owns dates). Monthly digest #45. Commentary blocks #43 (in every export). Hotspot report #40 (auto on approval, "turn into client pitch"). YoY narratives #41. Score-gap flags #42 (blocked on rubrics). Completeness meter 6.7 (shared component: dashboard, client detail, digest).

## Blocked on Masao
CARB SB 253 draft template (W3.1); Kerri's buyer questionnaire (W3.1); CDP/EcoVadis scoring rubrics (W7); calculator data model (#27).

## Later: consult/reduce layer (captured, do not build yet)
These make the consultant's own offering more valuable and justify a higher per-client price later.
- **Data protection and access control:** buyers see only the aggregate snapshot, never raw proprietary inputs. Mechanism: data minimization plus role-based visibility (not hashing). Partly built (§13). Near-future, MVP-adjacent.
- **Assurer sign-off role:** an auditor approves a frozen snapshot; fits the 2027 assurance wave (ISSA 5000).
- **Reduction insights (hotspots):** "your biggest emissions are X; switching saves $Y." Sendrow supplies the data; the consultant gives the advice.
- **Anonymized sector benchmarking:** percentile benchmarks, aggregate only. Conflicts with the current "no cross-client data use" decision; revisit deliberately.
- **ESG expansion (S and G; ESRS/CSRD, IFRS S1/S2):** the format engine makes these "just another config." Only after California is won.
- **GRI community listing:** cheap distribution experiment.
