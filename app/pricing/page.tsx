import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";
import { PricingCalculator } from "@/components/pricing-calculator";

const COMPANY_FEATURES = [
  "Introduction to a vetted climate consultant",
  "Full GHG inventory — Scope 1, 2, and 3",
  "Buyer questionnaire answered (EcoVadis, CDP, and more)",
  "Audit-ready deliverables with data quality flags",
  "No platform to learn — a guided upload link does the work",
  "Free for you — the consultant pays the referral fee",
];

const CONSULTANT_FEATURES = [
  "Everything in the company report",
  "Multi-client dashboard",
  "Manage data on behalf of clients",
  "Client invite links",
  "Email alerts when clients complete sections",
  "Questionnaire helper for every client",
  "Priority support",
];

const AGENCY_FEATURES = [
  "Everything in the consultant plan",
  "Team access — multiple consultants",
  "Shared client visibility across your team",
  "Custom onboarding",
  "Dedicated account manager",
  "Volume pricing",
];

export default function PricingPage() {
  return (
    <>
      <LandingNav />
      <main className="mx-auto max-w-6xl px-6 py-20">

        {/* Hero */}
        <div className="text-center">
          <div
            className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ background: "var(--primary-tint)", color: "var(--primary)" }}
          >
            Founding member pricing
          </div>
          <h1 className="text-4xl font-black font-display tracking-tight" style={{ color: "var(--text)" }}>
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg" style={{ color: "var(--text-muted)" }}>
            No sales calls. No "request a demo to see pricing." Just pick your plan.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">

          {/* Company */}
          <div className="rounded-2xl p-8" style={{ border: "1px solid var(--divider)", background: "var(--card)" }}>
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>For companies</p>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-5xl font-black font-data" style={{ color: "var(--text)" }}>Free</span>
              <span className="mb-2 text-sm" style={{ color: "var(--text-muted)" }}>consultant match</span>
            </div>
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              A customer or regulator asking for your emissions data? We introduce you to a vetted climate consultant who handles it end to end — powered by Sendrow. The consultant pays us, not you.
            </p>
            <Link href="/get-matched" className="btn btn-primary mt-8 block w-full text-center">
              Get matched
            </Link>
            <ul className="mt-8 space-y-3">
              {COMPANY_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                  <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Consultant */}
          <div
            className="rounded-2xl p-8 relative"
            style={{ border: "2px solid var(--primary)", background: "var(--card)" }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              Most popular
            </div>
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>For consultants</p>
            <div className="mt-4 flex items-end gap-1">
              <span className="text-5xl font-black font-data" style={{ color: "var(--text)" }}>$300</span>
              <span className="mb-2 text-sm" style={{ color: "var(--text-muted)" }}>/mo · 3 clients included</span>
            </div>
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              $100/mo per additional active client. Scale your book without scaling your hours. Cancel anytime.
            </p>
            <Link href="/signup?plan=consultant" className="btn btn-primary mt-8 block w-full text-center">
              Start free trial
            </Link>
            <PricingCalculator />
            <ul className="mt-6 space-y-3">
              {CONSULTANT_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                  <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Agency */}
          <div className="rounded-2xl p-8" style={{ border: "1px solid var(--divider)", background: "var(--card)" }}>
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>For agencies</p>
            <div className="mt-4">
              <span className="text-5xl font-black font-display" style={{ color: "var(--text)" }}>Custom</span>
            </div>
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              Running a team of consultants with a large client book? We'll build a plan around your headcount, client volume, and workflow.
            </p>
            <Link href="/pricing/agency" className="mt-8 block w-full rounded-xl border px-6 py-3 text-center text-sm font-semibold transition-colors hover:bg-gray-50" style={{ borderColor: "var(--divider)", color: "var(--text)" }}>
              Get a quote
            </Link>
            <ul className="mt-8 space-y-3">
              {AGENCY_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                  <svg className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Comparison note */}
        <div
          className="mt-12 rounded-2xl px-8 py-6 text-center text-sm"
          style={{ background: "var(--primary-tint)", color: "var(--text-muted)" }}
        >
          Enterprise ESG platforms charge <strong style={{ color: "var(--text)" }}>$50,000–$250,000/year</strong>. Sendrow does the same core job for companies and consultants who don't need a Fortune 500 solution.
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold font-display" style={{ color: "var(--text)" }}>Common questions</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[
              ["What counts as an active client?", "Any client company with data in your Sendrow account. You can archive clients you're no longer working with and they won't count toward your limit."],
              ["Can I try it before paying?", "Yes — consultants get a 14-day free trial. Company reports are pay-to-generate, but you can enter all your data and see your numbers before paying."],
              ["What happens to my data if I cancel?", "It stays in your account for 90 days. You can export everything as CSV or PDF before your account closes."],
              ["Do my clients need their own accounts?", "They can — or you can enter data on their behalf from your consultant dashboard. Either way works."],
              ["What frameworks does Sendrow support?", "GHG Protocol (Scope 1, 2, 3), EcoVadis, CDP, and supply chain questionnaire mapping. More frameworks added regularly."],
              ["Is the $400 really one-time?", "Yes. You pay once to generate your report. If you come back next year, your data pre-fills and you pay $400 again for the new report."],
            ].map(([q, a]) => (
              <div key={q as string} className="rounded-xl p-6" style={{ border: "1px solid var(--divider)" }}>
                <p className="font-semibold" style={{ color: "var(--text)" }}>{q}</p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Not sure which plan is right? <Link href="/demo" className="font-medium underline" style={{ color: "var(--primary)" }}>Book a 20-minute demo</Link> and we'll figure it out together.
          </p>
        </div>

      </main>
      <LandingFooter />
    </>
  );
}
