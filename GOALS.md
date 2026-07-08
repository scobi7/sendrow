# GOALS.md — Sendrow Project Goals
> Direction reset 2026-07-08 (supersedes the company-first positioning). Source: "Sendrow Model and Expansion Plan" doc + industry research; see PLANS.md and ROADMAP.md.

## What is Sendrow?
**The practice platform for climate consultants.** Sendrow turns a client's messy data into one audited emissions inventory, then answers every buyer and regulator format from it — under the consultant's brand. What Clio is to law firms, Sendrow is to climate consulting practices.

We are NOT "another carbon accounting platform." That category is crowded, venture-funded, and enterprise-aimed (Persefoni, Watershed, Greenly). A solo consultant is a salesperson, analyst, PM, bookkeeper, and delivery staff at once; Sendrow is their back office.

## Who pays us
- **Consultants (only paying customer):** solo climate/ESG consultants and small firms serving CA mid-size suppliers. ~30 named targets to start; Kerri is Founding Partner seat one.
- **Companies (referral revenue, not customers):** inbound companies are routed to partner consultants for a referral fee ($500–1.5k or % of first engagement). The direct-to-company sales motion is dead; the self-serve code stays dormant, not deleted.

## The Timing Thesis (why now — verified July 2026)
- SB 253's first deadline moved to Nov 10, 2026; first year is leniency (report what you already collected, no assurance). **Don't sell November panic — sophisticated consultants know it's overstated and it burns credibility.**
- The real wave is **2027**: Scope 3 reporting starts, limited assurance begins, and $1B+ filers must chase supplier data. Those surveys cascade onto exactly our ICP. Spreadsheets die at limited assurance.
- Anchor demand in what survives litigation: buyer supply-chain programs (CDP Supply Chain, EcoVadis, retailer surveys) and EPR/SB 54 — not SB 253/261 themselves (SB 261 enjoined; both under challenge).

## The Moat — Vendor-Mapping Memory
Confirm a vendor once ("PG&E = Scope 2 electricity, this factor"), mapped forever, **shared across every client**. Businesses share vendors (utilities, carriers, suppliers), so the mapping database compounds with every client onboarded. It can only be earned through real client volume — Persefoni cannot buy or code its way to it. Every human-assisted engagement is a permanent deposit into this asset.

## Product Doctrine
1. **Three hardened intake paths, not universal ingestion:** structured CSV template, accounting-system spend export, document upload with human-confirmed extraction. Guided data entry orchestrated by the portal replaces "parse anything" engineering.
2. **Data-request portal (the consultant's worst week, killed):** magic link (no client login), guided checklist per data type, uploads + simple structured entry, missing-item tracking, automatic reminders, consultant status board.
3. **Questionnaire-response copilot (possibly the actual product):** one audited inventory in, any buyer/regulator format out. Formats are built from real client requests only — built once, sold forever, each addition announced as marketing.
4. **Evidence locker / assurance-ready by construction:** every figure clicks back to its source document and emission-factor vintage; one-click assurance binder for the 2027 season. This is the Plan I audit-trail engineering — it carries over untouched.
5. **White-label by default:** the consultant's client never sees Sendrow's name.

## Revenue Ladder (in order)
1. **White-label fulfillment (now):** footprint sprint (Scope 1–2 + spend-based Scope 3 screen, 2-week turnaround) — consultant bills $8–15k, Sendrow takes $2.5–4k fixed. Survey response package: $1–2.5k per questionnaire. Rush tier at 1.5–2x. The service is the R&D lab that pays us; every engagement produces an SOP → software spec.
2. **Referral routing:** inbound companies → partner consultants, tracked and counted as a formal partnership benefit.
3. **Software subscription:** only once the portal + copilot are real. Price against consultant project value (per-deliverable), not seats.

**What people pay generously for (ranked):** making money > removing risk/fear > status > speed under deadline > saving time. Consultants pay for referred leads, white-label polish, monitoring retainers they can resell, and crunch capacity. Nobody pays for dashboards or "insights."

## Go-to-Market
- **Tiny and deep:** one geography (California), one workflow (data request → inventory → any format out).
- **Soft-verticalize into food & beverage / agriculture** — CA-dense, buyer-pressured, shared vendors compound the mapping moat fastest. Bias the outreach list; no rebrand.
- **Note-taker of the niche:** summarize every CARB docket move within 24 hours; comment letters; format announcements as content cadence; free lead-magnet tools (in-scope checker, deadline calendar, survey decoder).
- **Trust basics before asked:** DPA template, one-page security overview, export/delete button. Tool-not-advice ToS; consultant owns professional judgment.

## Explicitly Out of Scope
- Universal/arbitrary-format ingestion as a product promise
- Direct-to-company self-serve sales (code dormant, motion dead)
- Enterprise SSO and procurement features
- Speculative output formats no real client has requested
- SOC 2 (transparency substitutes at this stage)

## Technical Stack
Next.js 15 App Router, multi-tenant, Clerk v6, NeonDB + Drizzle, Stripe, Resend, Vercel Blob (evidence storage). Per-client differences live in config (mapping profiles, intake answers, branding config) — never forked code.
