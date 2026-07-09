# Plan T — The Deliverable Machine — success criteria

Built 2026-07-08 on `sendrow-v2` (afca629 → a054bb7). 179/179 tests, tsc + build clean.

1. ✅ T1: consultant can inspect and correct any figure in the Data Ledger (recategorize/edit qty/exclude/restore, all corrections logged); rejected uploads leave totals.
2. ✅ T2: supplier confirms the column mapping on a preview screen ("you know this file best"); same file shape re-maps with zero clicks (header fingerprints); MWh/ccf/L/km no longer false-flag (unit table); paste-from-spreadsheet works in manual entry.
3. ✅ T3: approving freezes an immutable snapshot (sha256-hashed); shares are per-snapshot per-recipient; corrections trigger restatement emails with exact diffs (§13).
4. ✅ T4: one snapshot exports to Excel, SB 253-style draft, questionnaire CSV, and PACT-compatible JSON with zero manual formatting.

Still open toward final product: real eGRID/USEEIO factor values (data task), first real buyer questionnaire format (needs Kerri), Plan Q supplier side (reply-by-email, claimable accounts, PDF/AI parsing), SOC 2 track.
