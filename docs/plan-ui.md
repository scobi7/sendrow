# UI plan: design-partner fixes and rebrand (DRAFT, 2026-11-13)

Status: in progress on `sendrow-v3` (Malachi: "get started, I'll review after", 2026-11-13). Items marked BUILT are on the branch preview; the rest wait on the decisions at the bottom.
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
1. BUILT. Snapshots freeze manual-entry calcs as rows too, so every export reconciles to its totals.
2. BUILT. Excel export adds factor value, unit, source, vintage year, location and evidence file name per row, plus a "Line items sum" check row.
3. BUILT. PDF report carries the consultant's brand (logo, name, accent), and its "factors used" list includes line-item factors. Also fixed: the PDF counted excluded rows and dropped manual entries from its totals; it now uses the same totals as snapshots.
4. BUILT (dates still need sign-off). `lib/regulatory-dates.ts`, each entry with a source and a checked-on date. SB 253 Nov 10 2026 (confirmed, passed), SB 253 Scope 3 2027 (date TBD), SB 261 (paused by the Ninth Circuit injunction), CDP Sep 14 2026. Not added yet: CARB fee notices (reported ~Dec 10 2026, unconfirmed), CDP 2027, EcoVadis (rolling, no fixed date).

## Phase 1: navigation and getting started (feedback: "can't figure out how to navigate", "workflow to get started")
1. BUILT. Consultant shell: Clients nav item, "New request" and "Add client" buttons, active-page highlight, a phone menu, Cmd+K search.
2. BUILT. Client workspace tabs: Overview, Data ledger, Review, Activity, Enter data, with a breadcrumb, in place of back links. (The overview page itself is still one long page; splitting it is a follow-up.)
3. Onboarding with an explicit choice. Consultant gets the full setup. Corporate team and third party: see decision 1 below.
4. BUILT. "Upcoming deadlines" strip at the top of the dashboard (next 3 from the config, linking to the calendar). A static strip, not an auto-scrolling ticker (scrolling text fails reduced-motion and is hard to read).
5. BUILT. "Get started" checklist on an empty dashboard: add your brand, add a client, send a request, review and freeze a snapshot.

## Phase 2: data in (feedback: manual entry plus uploads, attach invoices and prior calcs, one link)
1. Portal accepts supporting documents (PDF, images) on any checklist item, plus an "Other documents" item.
2. Import an existing inventory or prior calculation: rows with pre-computed CO2e, labeled "supplier-calculated" with their stated method (never silently mixed with our own calcs). Needs decision 4.
3. Scope 2 manual kWh entry (there is none today).
4. One link per client that lists all open requests, if decision 3 says yes.

## Phase 3: traceability (feedback: show factor, source, year, method, assumptions per calculation)
1. BUILT. "How calculated" panel on every ledger row: activity, factor name/id/value/unit/year, source with link, method, formula, calculated-at, assumptions. Gaps show "Not recorded".
2. Activity page shows the factor for each calculation change.
3. Excel BUILT (Phase 0.2). PDF per-row detail not built (the PDF lists factors used, not every row).

## Phase 4: rebrand and "un-AI-sloppify"
1. BUILT for the app, portal and most marketing pages. Left: the mock dashboard and hover shadows on /for-consultants (marketing pass).
2. TOKENS BUILT with the "Ledger" direction as the default (paper, ink, forest green; Fraunces / Instrument Sans / IBM Plex Mono; 8px and 6px radii; one flat shadow). Malachi reviews it on the preview (decision 2). Type sizes and inline styles not consolidated yet.
3. Components: Button, Card, Table, Badge (merging chip, badge, Pill and StatusBadge), PageHeader everywhere, EmptyState, Tabs, Toast. Inline styles replaced page by page as each page is touched.
4. Order: tokens and components, then the consultant shell, client workspace, portal, and the marketing site last (one header).

## Suggested order
Phase 0 now. Then decision 2 (visual direction), then Phase 4 tokens and components together with Phase 1, so the new navigation is built in the new look. Then Phase 3, then Phase 2. Each phase goes out on `sendrow-v3` previews for partners to try.

## Decisions needed from Malachi
1. Corporate and third-party sign-up: real account types (this reverses "consultants are the only paying customer" in decisions.md), or a clearer path ("your consultant sends you a link" / get matched)?
2. Visual direction: the "Ledger" tokens are now live on the preview as a default. Keep, adjust, or mock 2-3 alternatives?
3. One upload link per client, or keep one per request?
4. Accept pre-computed (supplier-calculated) emissions in imports?
5. Who confirms regulatory dates, and which regulations to track?
