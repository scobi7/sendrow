# Plan N — Final Product Program — success criteria

Built 2026-07-08 on `sendrow-v2` (commits c3c91dc → 3353908). 158/158 tests, tsc + build clean.

1. ✅ A data request emails a real recipient: client contact captured at add-client, editable in workspace; reminders target the same contact; resend button; §11-clean email copy (tested).
2. ✅ One consultant surface: `/consultant/clients/[id]` is the workspace (review, requests, vendor confirm, uploads, summary); old review URL redirects; home is a practice board.
3. ✅ Evidence: original portal uploads stored (Blob) with sha256 always recorded; every line item's calc log carries `submitted_via` (+ `evidence_id` for files); authed download route.
4. ✅ Periods: line items fiscal-year-tagged from row dates (null when dateless — never guessed); YoY delta card at ≥2 periods (unit-tested).
5. ✅ White-label: brand profile (name/logo/accent/reply-to); portal + emails + `/shared/[token]` results page carry the consultant's brand, never Sendrow's.
6. ⬜ N6 questionnaire copilot — BLOCKED: needs one real buyer questionnaire.
7. ⬜ N7.2 real eGRID 2024 / USEEIO v2 factor values — OPEN: load actual datasets via /admin/factors before first client deliverable.

Env prerequisites (Vercel): BLOB_READ_WRITE_TOKEN, CRON_SECRET, ADMIN_CLERK_ID.
