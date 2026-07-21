# GOALS.md — Sendrow Project Goals
> Updated 2026-07-21 (team meeting takeaways layered on 2026-07-08 master-doc framing). See ROADMAP.md for the build sequence.

## Current phase goal (set 2026-07-21)
**MVP: get real consultants using it as a working tool and get their feedback.** Not full feature completeness — a pilot-ready core loop plus the data-provisioning conversion work below. Everything else (format engine depth, retention engine, scoring) waits until we've validated the loop with actual consultants and their clients. See Plan Y in PLANS.md.

## What is Sendrow?
**Sendrow is the one organized place where a supplier's emissions information lives — collected once with a consultant's help, kept with proof attached, and shared out to any customer or regulator who asks, in whatever format they ask for.**

Instead of a supplier's emissions data living in seventeen email threads and five conflicting spreadsheets, it lives in ONE trusted record. The consultant helps build and check it. The supplier owns it. Any customer who asks gets a clean, verified copy shaped the way they need. We are the system of record for supplier emissions data, operated through consultants — the boring, trustworthy plumbing; the drama stays out of the pipes.

## The three people who use it
1. **Suppliers** (mid-size companies) — own their data. They answer questions, upload proof, and approve what gets shared. **Always free to respond.** *Open question (2026-07-21 meeting): who at the supplier actually does this work?* Unconfirmed — likely office manager / bookkeeper / facilities manager / owner, rarely a dedicated sustainability role (if they had one, they'd need us less). This is a hypothesis, not a validated persona — nail it via discovery (Plan Y2), because the portal's whole UX assumption rests on it.
2. **Consultants** — run the show: send requests, check numbers, fix mistakes, sign off. **Our main paying customer.**
3. **Buyers** (big companies, Phase 2 in 2027) — demand this data by law; eventually pay us to collect it from hundreds of suppliers at once.

**Confirmed (2026-07-21):** consultants are the only paying customer, full stop, right now. Not managed-service, not direct-to-company. A consultant here manages individual clients or small–mid sized firms who sit at the bottom of the supply chain.

**Later idea, explicitly not now (2026-07-21):** a matching service connecting consultants and companies directly — "Tinder for consultants and companies." Write it down, don't build it; revisit after the consultant-only model is validated.

## The three promises that make us different (put them on the homepage)
1. **Suppliers actually respond.** Magic links, reply-by-email, plain-language forms, ten-minute completion — a supplier can reply as easily as answering an email. Response rate (target ≥60–70%) is our #1 measurable advantage; we publish it.
2. **The supplier owns their data and can take it anywhere.** Full export in the industry-standard PACT format, anytime. Competitors lock data inside their walls; we don't — the ability to leave is why they trust us.
3. **We never replace the consultant and we never grade the supplier.** No scorecards (anti-EcoVadis), no "you don't need a consultant" (anti-managed-service). We're the tool both use together — positioning competitors can't copy without blowing up their business models.

## The workflow spine (what the product IS)
Data request (field-specific, plain English) → magic-link response + reply-by-email → guided forms → **evidence stapled to every number** → comment threads pinned to specific data lines → consultant review & approve → **snapshot** (frozen, dated version — the ONLY thing ever shared) → **reshaping** (one snapshot → SB 253, CDP, any customer questionnaire, Excel) → explicit per-share permissions (THIS snapshot, to THIS company, in THIS format) → **restatement alerts** (corrections auto-notify everyone who received the old version) → prefill next year from last approved data ("answer once, share many" — the moment suppliers fall in love, and the upgrade trigger).

## Supplier-Confirmed Parsing (Masao's note — the real consultant pain)
The consultant's actual job is decoding what suppliers send ("they sent me a thing; I have to figure out what the thing is"). Ingestion/normalization — not categorization — and unlike categorization, **there's a right answer and the supplier knows it.** Four layers:
1. **Prevent the mess upstream:** field-specific requests ("upload your 12 electricity bills"), not "send your data." Most format chaos dies in the request.
2. **Parse with the supplier in the room:** AI takes the first pass ("column D looks like monthly kWh — right?"); the *supplier* confirms or fixes. Decoding moves from the consultant (expensive, guessing, offline) to the supplier (free, knows the answer, right there). AI suggests; a human confirms — but the human is the supplier.
3. **Remember the shape:** file-format memory — decode Acme's utility export once, zero work next quarter; SoCal Edison bills look like SoCal Edison bills across suppliers.
4. **Accept the floor:** fast manual entry for scanned receipts. Target 80% automated decoding, not 100%.

## The Moats
- **Vendor-mapping memory:** confirm a vendor once, remembered and auto-applied next time — **per consultant workspace only for now** (cross-platform suggestions are explicitly LATER, for privacy; per Masao's pipeline doc). Compounds with volume; can't be bought or coded.
- **File-format memory:** the same idea applied to file layouts (less privacy-fraught — a bill layout isn't competitively sensitive).
- **Trust mechanics for the 2027 audit wave:** restatement alerts + trust-level provenance badges ("self-reported" / "consultant-reviewed" / "assured"), designed WITH actual verifiers. When 2027 audits find incumbent data trails are Swiss cheese, we're the platform auditors recommend.
- **Response rate:** competitors' products are anchored to buyer-side portals; they structurally can't rebuild around the supplier's inbox.
- **The data asset (speculative, 2026-07-21 — not a build commitment):** at scale we'd hold cleaned, source-tied utility/fuel/spend data across hundreds of small suppliers. Candidate uses raised: estimating emissions for suppliers with missing data, flagging anomalous figures at review time, sector benchmarking. Must respect the workspace-scoped privacy line above — this is a research thread (Plan Y5), not scoped work.

## How we make money (in order)
1. **Consultants:** free workspace, **pay per active client (~$150–250/month per client slot)** — passed through as a line item on the consultant's invoice, so there's no overhead objection. 12 active clients ≈ $21–36k/yr from someone who paid $0 to start. (White-label fulfillment services remain available as the R&D lab that pays us meanwhile.)
2. **Suppliers:** free to respond forever; **Pro ~$1.5–3k/yr** (unlimited sharing, full history, priority formats) — the upgrade trigger is always the *second* customer request.
3. **Buyers (2027):** ~$10–25k/yr platform + $30–60 per active supplier for bulk campaigns; every campaign floods the network with new supplier records for free.
4. **The compounding trick:** every consultant brings 5–20 clients; every buyer campaign brings 100+ suppliers; every reuse event creates a Pro prospect. We never pay to acquire suppliers one at a time.

Rough early math: 15 consultant workspaces ≈ $300k+/yr before a single buyer contract; one buyer pilot adds ~$25k + ~200 supplier records.

**Pricing is explicitly deferred (2026-07-21 team call):** wait until discovery tells us whether consultants actually need this before pricing it — "see if we even are needed" first. The numbers above are a model, not a live decision.

## The Timing Thesis (verified July 2026)
- **SB 253's first Scope 1/2 deadline: November 10, 2026** (confirmed w/ Malachi 2026-07-21; supersedes the earlier Aug-10 reading); first year is leniency. Don't sell deadline panic.
- The real wave is **2027**: Scope 3 reporting starts, limited assurance begins, $1B+ filers chase supplier data — surveys cascade onto exactly our ICP. Spreadsheets die at limited assurance.
- Own one beach: **California + SB 253 + consultant-operated.** Assurance language: reference **ISSA 5000** (ISAE 3410 is withdrawn as of Dec 15, 2026). A knowable list of affected companies (CARB publishes it), a consultant community we're already inside (Kerri, ISOS), a geography we live in. Giants can't focus this small; TrackZero (UK proof the consultant-first model works) would have to cross an ocean. We don't need to win "supplier data exchange" — we need to win California, 2026–2028.

## Go-to-Market
- **Tiny and deep:** one geography (California), one workflow (request → record → any format out). Soft-verticalize into food & beverage / agriculture. **Under active discovery (2026-07-21):** fashion/apparel (reinforced by Azoulay's book: L'Oreal, Marc Jacobs, PVH) and metal/mining also raised as candidate verticals — pressure-test via consultant conversations, not a re-decision yet.
- **Kerri = Founding Partner seat one**; ~30 named consultant targets.
- **Note-taker of the niche:** CARB docket summaries within 24h, comment letters, format announcements as marketing. Free lead-magnet tools (in-scope checker, deadline calendar, survey decoder) whose output becomes a **claimable starter profile** — the free tool feeds the real product.
- **Trust before asked:** DPA, security overview, export/delete. Tool-not-advice ToS; the consultant owns professional judgment. **Start SOC 2 early** — supplier spending data is competitively sensitive; a leak would end the company.

## The scoreboard (what tells us it's working)
1. Supplier response rate ≥60–70% via magic link — the headline number
2. Request → approved-snapshot cycle time (days, not months)
3. % of records with evidence attached
4. Paying consultant workspaces × their client counts
5. Reuse events (second-customer shares) — the leading indicator of Supplier Pro revenue

## Explicitly Out of Scope
- Universal/arbitrary-format ingestion as a promise (supplier-confirmed parsing + format memory instead)
- Scoring/grading suppliers, ever
- Replacing the consultant ("we do it for you" managed service)
- Direct-to-company self-serve sales (code deleted from v2; branch `sendrow-v1` keeps it; inbound companies → referral routing)
- Enterprise SSO/procurement features; speculative output formats no real client requested
- Pricing decisions (deferred until discovery validates need) · exit/acquisition strategy (not now) · in-app newsletter (parked idea, 2026-07-21)

## House style (standing constraint, not a one-time cleanup)
**No emojis, no em dashes, anywhere in product UI or copy — ever, including new work.** Swept clean 2026-07-14/15; re-verify with a grep before any branch (incl. `sendrow-v3`) is called demo-ready.

## Technical Stack
Next.js 15 App Router, multi-tenant, Clerk v6, NeonDB + Drizzle, Stripe, Resend, Vercel Blob (evidence + branding). **PACT V3 only** data model from day one (V2.x deprecated April 2026; register for the PACT Conformance Tool when ready — free credibility).  Per-client differences live in config — never forked code.
