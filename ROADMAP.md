# ROADMAP.md — Release Themes & Priorities
> Direction reset 2026-07-08: practice platform for climate consultants. Order rationale: make the first fulfillment engagement runnable, then make every figure defensible, then make the 2027 product.
> Last updated: 2026-07-08

## Plan J — Practice Platform Release (next; 0–90 days)
Make the Kerri engagement (and every white-label fulfillment after it) run through software instead of email.
1. **Data-request portal:** magic-link client access (no login), guided checklist per data type, structured entry + document upload feeding the existing intake pipeline, missing-item tracker, automatic reminder emails, consultant status board (extends `/consultant/review`)
2. **Vendor-mapping memory:** global `gt_vendor_mappings` table (vendor → scope/category/factor, confirmed-by, confidence); review-queue confirmations write to it; ingest consults it before anything else — the moat compounds from engagement one
3. **Referral routing:** inbound company flow becomes "get matched with a consultant" (form + logged lead), replacing self-serve checkout as the front door
4. **Trust basics:** DPA template page, one-page security overview, data export/delete button

## Plan K — Evidence & Copilot Release (3–6 months)
The 2027 story.
1. **Evidence locker:** source documents (Vercel Blob) attached to line items; every figure clicks to its bill/invoice + factor vintage
2. **Questionnaire-response copilot prototype:** built against a real buyer questionnaire from a founding partner's client — question → inventory-field mapping, drafted answers, consultant review/sign; each new format saved as a permanent template and announced
3. **White-label branding:** consultant logo/colors on all client-facing surfaces (portal, emails, PDFs); Sendrow's name never shown to end clients

## Plan L — Assurance & Practice Depth (6–12 months)
1. One-click assurance binder export, timed to the 2027 limited-assurance season
2. Year-over-year delta narratives ("emissions rose 12% because…")
3. Consultant practice dashboard: every client's status, missing data, deadlines in one view
4. Format library growth as ongoing cadence

## Backlog (post-L, roughly ordered)
- Anonymous peer benchmarking (data network effect)
- Reduction hotspot flagging + playbook actions (sells the consultant a follow-on engagement)
- EPR / SB 54 packaging module (smooths seasonal revenue; live thread via Mishel's contacts)
- Free lead-magnet tools: in-scope checker, CA climate deadline calendar, survey decoder
- "Sendrow Certified" consultant training (pipeline + switching costs — noted, not soon)

## Killed / dormant (2026-07-08)
- ~~Plan J (old) — annual company Stripe pricing~~ — direct-to-company motion dead; company self-serve code dormant, not deleted
- ~~Universal spreadsheet ingestion as a promise~~ — three hardened intake paths + guided portal entry instead
- ~~Data quality scorecard as renewal driver~~ — folded into the consultant practice dashboard (Plan L)

## Standing P0 ops items (user actions, tracked in NEXT.md)
- Clerk production Google OAuth; Clerk dev keys for Preview deploys
- Attorney-reviewed ToS (must position Sendrow as tool-not-advice) & Privacy copy
- `STRIPE_WEBHOOK_SECRET` in Vercel
- Update Calendly links
- Fix prospectus "Live" integrations label (credibility — one caught exaggeration erases everything)
