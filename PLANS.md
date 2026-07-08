# PLANS.md

## Plan V — Visual Identity Refresh ("The Ledger")
> STATUS: DRAFT — PENDING HUMAN APPROVAL
> Generated 2026-07-08. Full research + system spec: docs/design-direction.md. On approval, generate TASKS.md (V1–V6).

### Objective
Kill the "AI-generated SaaS" look. Move from pastel-green wash + geometric sans to paper/ink/forest with an editorial serif — the visual language of an audit-grade practice platform (Watershed's restraint, Clio's order, the Paymark template's single-accent discipline).

### Phases
1. **V1 — Fonts:** `app/layout.tsx` swaps Manrope/Space Mono → Fraunces (display serif) + Instrument Sans (body/UI) + IBM Plex Mono (data); `--font-body` becomes a real token; tailwind config updated
2. **V2 — Color tokens:** retheme `:root` in `globals.css` per docs/design-direction.md table (paper bg, white cards + hairlines, ink text, forest primary, new `--accent` terracotta + `--ink-band`)
3. **V3 — Hardcoded-hex sweep:** move ~20 inline hex values (`#fef9c3`, `#fecaca`, `#dc2626`, `#d97706`…) onto tokens so the theme is fully centralized (white-label prerequisite)
4. **V4 — Landing polish:** remove hero gradient blobs, one ink-band section, Fraunces hero, terracotta used once per screen
5. **V5 — App surfaces check:** dashboard/workpaper/portal numbers in mono with tabular figures; no regressions in PDF print styles
6. **V6 — Verify:** visual pass on landing, portal, dashboard, review queue; tests + tsc + build clean

### Acceptance
- No Manrope/Space Mono references remain; no gradient blobs; no inline status-color hex in pages
- The portal and app shell remain fully tokenized (consultant white-label can override via CSS variables alone)
- All tests pass; `next build` clean

### Out of scope
Layout restructuring, new sections/pages, consultant branding upload (that's Plan K white-label), logo redesign.

---

# Plan J: Practice Platform Release
> STATUS: BUILT 2026-07-08 on branch `sendrow-v2` — see success/plan-j.md and TASKS.md (J1–J20).
> Prior plan: Plan I (Integrity Release) — BUILT 2026-07-07, see success/plan-i.md.

## Objective
Make a white-label fulfillment engagement (footprint sprint) runnable end-to-end through software: consultant sends a data request → client fills a guided magic-link portal → data lands in the existing intake pipeline → every vendor confirmation feeds permanent cross-client mapping memory. Plus: turn the inbound company flow into consultant referral routing.

## Phase 1 — Magic-link data-request portal (client side)
The client receives a link, needs no account, and sees exactly what to provide.
- Schema: extend `gt_data_requests` with `token` (unique), `expiresAt`, `checklist` (jsonb: array of items — data type, label, instructions, status), `remindersSentAt` (jsonb)
- `app/portal/[token]/page.tsx` — public route (middleware bypass like `/terms`): validates token, shows checklist with per-item status, consultant branding placeholder
- Per-item flows reusing existing machinery: document upload (file → existing `/api/intake/preview` + `import` pipeline, tagged with `dataRequestId`) and simple structured entry forms (per data type from `lib/ingestion/data-type-templates.ts` — e.g., monthly kWh, gallons, therms)
- Token pattern: reuse the `inviteTokens` approach in `lib/actions.ts` (crypto token, expiry, single-purpose)
- Acceptance: a client with only the link can complete a checklist item without login; uploads route through the existing scoring/review pipeline

## Phase 2 — Reminders + consultant status board
- Reminder emails via `lib/email.ts` + Vercel cron (`/api/cron/reminders`): open requests with incomplete items get a nudge at 3/7/14 days; consultant CC'd on the 14-day
- Extend `/consultant/review/[companyId]`: data-request cards show per-item checklist status (received / missing / under review), last activity, next reminder date
- Acceptance: smoke test proves reminder selection logic (who gets nudged when); board shows item-level status

## Phase 3 — Vendor-mapping memory (the moat)
- Schema: new `gt_vendor_mappings` — `id`, `vendorPattern` (normalized name), `scope`, `category`, `factorId`, `confidence`, `confirmedBy`, `confirmedAt`, `sourceCompanyId`, `timesApplied`
- Ingest hook: before category resolution in `lib/ingestion/ingest.ts` and the QB path in `lib/calc.ts`, consult vendor mappings (exact → normalized match); matched rows carry `vendor_mapping_id` in the calc log
- Review-queue write-back: when a consultant approves a session containing previously-unmapped vendors, they confirm vendor→category pairs (new step in `/consultant/review/[companyId]`); confirmations insert global mappings
- Invariant (contracts/): mappings become global only after human confirmation; auto-applied mappings record which mapping version was used (forward-only, like factors)
- Acceptance: a vendor confirmed for client A auto-maps for client B, with the mapping id in the audit trail; unconfirmed vendors still flag as `unmapped` (Plan I behavior preserved)

## Phase 4 — Referral routing (kill direct-to-company sales)
- `/pricing` and landing CTAs: replace self-serve checkout path with "Get matched with a climate consultant" form (name, company, what triggered the need); logged to new `gt_referral_leads` table; admin notification email
- Middleware: leave payment gate and checkout code dormant (no deletion)
- Landing copy: reposition hero to practice-platform language (consultant-facing), companies get the referral form
- Acceptance: no path from the marketing site into company self-serve checkout; leads are logged and notified

## Phase 5 — Trust basics
- `/security` one-page overview (encryption at rest via Neon, access model, export/delete)
- Data export button (existing export route surfaced in settings) + delete-my-data request flow (logged, admin-notified)
- DPA template as downloadable page
- Acceptance: all three reachable from footer; delete request writes an audit log entry

## Success criteria (write to success/plan-j.md)
1. A fulfillment engagement can run without ad-hoc email: request created → client completes portal checklist → data reviewed → inventory produced
2. Vendor confirmed once = auto-mapped for the next client, traceable in the calc log
3. Reminder emails fire per schedule in smoke tests
4. Marketing site routes companies to referral, not checkout
5. All existing tests pass; new tests cover token access, reminder logic, vendor-mapping application

## Out of scope for Plan J
Questionnaire copilot and evidence locker (Plan K), white-label branding (Plan K), assurance binder (Plan L), consultant Stripe pricing changes (decide after first fulfillment revenue).
