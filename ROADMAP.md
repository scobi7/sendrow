# ROADMAP.md — Release Themes & Priorities
> Updated 2026-07-08 from the master doc ("Sendrow, Explained in Plain English"): Sendrow = the system of record for supplier emissions data, consultant-operated. Order rationale: make the workflow spine real (request → evidence → approve → snapshot → reshape → share), then the supplier side, then buyers.
> Last updated: 2026-07-08 (evening, master-doc session)

## Plan M — Remove Company Self-Serve (BUILT 2026-07-08)
v1/v2 split made real: company dashboard, setup wizard, invite-login flow, and 25 orphaned company actions deleted from v2 (all preserved on `sendrow-v1`). Onboarding is consultant-only; companies route to /get-matched.

## Plan N — Final Product Program (N1–N5 + N7.1 BUILT 2026-07-08; N6 blocked on a real questionnaire; N7.2 open)
N1 client-contact email repair (P0: portal emails currently no-op) → N2 single consultant workspace → N3 evidence locker (Blob) → N4 reporting periods/YoY → N5 white-label + shareable client results → N6 questionnaire copilot (needs a real questionnaire) → N7 real factor data, referral-lead admin, polish. Absorbs the former Plan K/L items below.

## Plan J — Practice Platform Release (BUILT 2026-07-08)
Make the Kerri engagement (and every white-label fulfillment after it) run through software instead of email.
1. **Data-request portal:** magic-link client access (no login), guided checklist per data type, structured entry + document upload feeding the existing intake pipeline, missing-item tracker, automatic reminder emails, consultant status board (extends `/consultant/review`)
2. **Vendor-mapping memory:** global `gt_vendor_mappings` table (vendor → scope/category/factor, confirmed-by, confidence); review-queue confirmations write to it; ingest consults it before anything else — the moat compounds from engagement one
3. **Referral routing:** inbound company flow becomes "get matched with a consultant" (form + logged lead), replacing self-serve checkout as the front door
4. **Trust basics:** DPA template page, one-page security overview, data export/delete button

## Plan V — Visual Identity Refresh (BUILT 2026-07-08)
"The Ledger": Fraunces/Instrument Sans/IBM Plex Mono + paper-ink-forest palette with one terracotta accent. Research + spec: docs/design-direction.md; plan in PLANS.md. Small surface (tokens + fonts), also the white-label prerequisite.

## Plan O — The Trust Core (BUILT 2026-07-08 as Plan T3)
Snapshots, sharing, restatements — the mechanics that make Sendrow's data believable and shareable.
1. **Snapshots:** approving a dataset freezes a locked, dated version — the ONLY artifact ever shared (invariant §13)
2. **Sharing permissions:** each share = THIS snapshot, to THIS recipient, in THIS format; supplier/consultant explicit OK; recipients never see each other's shares
3. **Restatement alerts:** correcting shared data auto-notifies every recipient of the old version with a what-changed diff
4. **Trust-level labels:** self-reported / consultant-reviewed / assured, on every dataset (§14: verification status, never a grade)
5. Methodology labels: every calculated number tagged with formula + factor vintage (mostly exists via calc logs — surface it)

## Plan P — The Reshaping Engine (v1 BUILT 2026-07-08 as Plan T4 — Excel/SB 253/questionnaire/PACT; first REAL buyer format still needs Kerri's questionnaire)
One approved snapshot → any output format. Maintained centrally: when CARB/CDP change their forms, WE update templates and everyone's exports keep working.
1. Format template system (SB 253 disclosure, CDP, generic customer questionnaire, plain Excel)
2. First real format built from an actual buyer questionnaire (Kerri's client) — formats only from real requests, built once sold forever
3. PACT-compatible export (the "your data is yours" weapon + standard on-ramp)

## Plan Q — The Supplier Side (next; T2 already shipped supplier-confirmed mapping + format memory)
1. **Supplier-confirmed parsing:** AI first-pass on uploads ("column D looks like kWh — right?"), supplier confirms in the portal; file-format memory remembers the shape (vendor-memory doctrine applied to layouts)
2. **Reply-by-email:** replying to a request email (with text or an attached bill) lands in the right place automatically
3. **Free claimable supplier accounts:** after responding via magic link, a supplier can claim their record (own it, view it, export it); prefill next year from last approved data
4. **Comment threads on data lines:** clarifying questions pinned to the exact figure, not lost in email
5. Supplier Pro tier ($1.5–3k/yr) once reuse events start happening — the trigger is the second customer request

## Plan R — Buyers (2027)
Bulk campaigns (300 suppliers at once), snapshot inbox (clean approved packages, never raw workspace access), response analytics. Priced ~$10–25k/yr + per-supplier.

## Backlog (roughly ordered)
- SOC 2 track — start early (supplier spend data is competitively sensitive; master doc reverses the old "out of scope")
- Consultant engagement templates ("my standard SB 253 request package," reusable per client)
- Claimable starter profile from the free calculator lead-magnet
- QuickBooks/utility auto-integrations (email + upload covers v1)
- Anonymous peer benchmarking · reduction hotspot flagging · EPR/SB 54 module
- Free lead-magnet tools: in-scope checker, CA deadline calendar, survey decoder

## Paused / dormant (2026-07-08 — recoverable, see docs/direction-v1-company-first.md + branch `sendrow-v1`)
- ~~Plan J (old) — annual company Stripe pricing~~ — direct-to-company motion paused (never pitched, not disproven); self-serve code dormant, not deleted
- ~~Universal spreadsheet ingestion as a promise~~ — three hardened intake paths + guided portal entry instead
- ~~Data quality scorecard as renewal driver~~ — folded into the consultant practice dashboard (Plan L)

## Standing P0 ops items (user actions, tracked in NEXT.md)
- Clerk production Google OAuth; Clerk dev keys for Preview deploys
- Attorney-reviewed ToS (must position Sendrow as tool-not-advice) & Privacy copy
- `STRIPE_WEBHOOK_SECRET` in Vercel
- Update Calendly links
- Fix prospectus "Live" integrations label (credibility — one caught exaggeration erases everything)
