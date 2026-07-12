# TASKS.md — Open Work
> Generated from the active plan in PLANS.md. Completed plans: A–N, T, U1–U2 — full task history in git (`git log --follow TASKS.md`).

## Plan U — remaining phases

### U3 — Format engine as config (next)
- [ ] **U3.1** — Refactor `lib/formats.ts` → versioned template registry in DB (field mappings + layout as data; conditional questionnaire support)
- [ ] **U3.2** — Admin Format Mapping Builder: upload questionnaire → map questions → save template (no code per format)
- [ ] **U3.3** — Template versioning; snapshots/exports record template version used
- [ ] **U3.4** — "Answer once, share many" + duplicate request detection
- [ ] **U3.blocked** — SB 253 config against CARB's real draft template (needs file from Masao); first real buyer questionnaire (needs Kerri)

### U4 — Supplier trust & stickiness
- [ ] **U4.1** — Free claimable supplier account (never gate responding)
- [ ] **U4.2** — Supplier attestation checkbox (name/date/snapshot ID in event log)
- [ ] **U4.3** — Share receipts (recipient views/downloads logged, shown both sides)
- [ ] **U4.4** — Supplier "download all my data" — PACT V3 JSON + CSV
- [ ] **U4.5** — Reply-by-email v1: unfiled inbox on the request (needs inbound-email provider — user action for DNS)
- [ ] **U4.6** — Section delegation: scoped magic link per checklist item
- [ ] **U4.7** — Deadline extension request (supplier button → consultant approve/deny)
- [ ] **U4.8** — Supplier mini-report PDF (VSME Basic Module skeleton)

### U5 — Audit-grade depth
- [ ] **U5.1** — Spend/activity method labels + "% activity-based" stat
- [ ] **U5.2** — Methodology label schema: relevant / recent / geographically-correct
- [ ] **U5.3** — Trust-level badges (dataset + per-metric), travel with snapshots
- [ ] **U5.4** — Estimate→actual transitions trigger restatement flow
- [ ] **U5.5** — Factor-update recalc preview (old snapshots stay frozen)
- [ ] **U5.6** — Vendor memory: remove global option (workspace-scoped only, §14b)
- [ ] **U5.7** — Consultant-side historical import (rows marked "imported")
- [ ] **U5.8** — IMP / methodology-manual generator

### U6 — Retention engine (after first design partner is live)
- [ ] **U6.1–6.7** — Compliance calendar · monthly digest · commentary blocks · hotspot report · YoY narratives · score-gap flags (blocked: rubrics) · completeness meter

## Standing open items
- [ ] **N7.2** — Real EPA eGRID 2024 + USEEIO v2 factor values via /admin/factors — pre-deliverable blocker; current values are flagged approximations (not fabricatable)
- [ ] **OPS** — User actions in Vercel: `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`, `ADMIN_CLERK_ID`, Calendly links; production deploy of v2 is a user decision
