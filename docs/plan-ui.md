# UI plan: design-partner fixes and rebrand (DRAFT, 2026-11-13)

Status: draft for Malachi's review. Nothing here is built yet except where marked.
Sources: two design-partner feedback notes (2026-11-13), the UI audit and the 20-item UX audit run the same day.

## Goal
Design partners can find their way around, trust every number down to its source, and see their own brand on everything their clients touch. The product stops looking like a generic AI template.

## What the audits found (short)
- Navigation: 6 sidebar items, but Clients and "Add client" aren't in it; no navigation at all below 640px; the client workspace is one long page with sections that link out to back-link pages; the marketing site has two different headers.
- Onboarding: /onboarding offers only "I am a climate consultant"; companies get a lead form; no third-party option. A company-role user who logs in sees the consultant card.
- Regulatory dates: 3 dates hardcoded in the calendar page; no SB 261 or EcoVadis; Nov 10 2026 has passed but the homepage still calls it upcoming.
- Traceability: the calc log stores factor id/value/unit/vintage/formula, but the ledger and activity pages don't show it, source/URL never reach the screen, and the PDF's "factors used" list omits portal line items.
- Export: Excel has no factor value, source, vintage, evidence link or location. **Bug:** snapshots freeze only line items while their totals include manual entries, so the Excel "Line items" sheet doesn't sum to "Summary" when manual Scope 1/2/3 data exists.
- Branding: portal, shared page and emails are branded; the PDF and Excel/SB 253 exports carry no consultant brand.
- Look: aurora gradient background with blurred orbs, glassmorphism (backdrop blur), 26px radii with green glow shadows, gradient logo and avatars, eyebrow pills, numbered-circle triad cards, decorative arrows and check glyphs, 829 inline `style={{}}`, ~26 font sizes, 6 greens plus an unused indigo, 3 badge systems, PageHeader used on 8 of 31 pages.

## Phase 0: correctness the partners will hit first (small, do now)
1. Snapshots freeze manual-entry calcs as rows too, so every export reconciles to its totals.
2. Excel export adds factor value, unit, source, vintage year, location and evidence file name per row.
3. PDF report carries the consultant's brand (logo, name, accent), and its "factors used" list includes line-item factors.
4. Regulatory dates move to one config file used by the calendar, dashboard and homepage. Add SB 261, CDP and EcoVadis. Dates must be confirmed by Malachi/Masao before shipping (Nov 10 2026 has passed).

## Phase 1: navigation and getting started (feedback: "can't figure out how to navigate", "workflow to get started")
1. Consultant shell: Clients as a first-class nav item with search; "Add client" and "New request" as primary actions; a mobile nav; Cmd+K menu (being built now).
2. Client workspace as tabs: Overview, Data (ledger), Requests, Review, Snapshots, Activity, in place of one long page plus back links.
3. Onboarding with an explicit choice. Consultant gets the full setup. Corporate team and third party: see decision 1 below.
4. "Upcoming deadlines" strip at the top of the dashboard (next 2-3 dates from the config, linking to the calendar). A static strip, not an auto-scrolling ticker (scrolling text fails reduced-motion and is hard to read).
5. First-run checklist on an empty dashboard: add a client, send a request, review, freeze a snapshot.

## Phase 2: data in (feedback: manual entry plus uploads, attach invoices and prior calcs, one link)
1. Portal accepts supporting documents (PDF, images) on any checklist item, plus an "Other documents" item.
2. Import an existing inventory or prior calculation: rows with pre-computed CO2e, labeled "supplier-calculated" with their stated method (never silently mixed with our own calcs). Needs decision 4.
3. Scope 2 manual kWh entry (there is none today).
4. One link per client that lists all open requests, if decision 3 says yes.

## Phase 3: traceability (feedback: show factor, source, year, method, assumptions per calculation)
1. Line-item detail panel in the ledger: activity value and unit, factor name/value/unit, source with link, vintage year, method label, assumptions, evidence file. Source and URL come from the factor table by factor id (no schema change).
2. Activity page shows the factor for each calculation change.
3. Same fields in the Excel export (Phase 0.2) and the PDF.

## Phase 4: rebrand and "un-AI-sloppify"
1. Remove: aurora gradients and orbs, glassmorphism, glow shadows, gradient logo and avatars, eyebrow pills, numbered-circle cards, decorative arrows and check glyphs.
2. System: one neutral palette plus one accent (the consultant's brand color overrides it on client-facing pages), two radii, one shadow, about 6 type sizes, tabular numbers for every figure. Squircle corners (UX item 18) decided here.
3. Components: Button, Card, Table, Badge (merging chip, badge, Pill and StatusBadge), PageHeader everywhere, EmptyState, Tabs, Toast. Inline styles replaced page by page as each page is touched.
4. Order: tokens and components, then the consultant shell, client workspace, portal, and the marketing site last (one header).

## Suggested order
Phase 0 now. Then decision 2 (visual direction), then Phase 4 tokens and components together with Phase 1, so the new navigation is built in the new look. Then Phase 3, then Phase 2. Each phase goes out on `sendrow-v3` previews for partners to try.

## Decisions needed from Malachi
1. Corporate and third-party sign-up: real account types (this reverses "consultants are the only paying customer" in decisions.md), or a clearer path ("your consultant sends you a link" / get matched)?
2. Visual direction: the "ledger" direction in docs/design-direction.md (Fraunces headlines, IBM Plex Mono figures), or 2-3 mocked directions to choose from?
3. One upload link per client, or keep one per request?
4. Accept pre-computed (supplier-calculated) emissions in imports?
5. Who confirms regulatory dates, and which regulations to track?
