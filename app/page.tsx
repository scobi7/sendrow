import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingNav } from "@/components/landing-nav";

function CheckIcon() {
  return (
    <svg className="h-4 w-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ color: "var(--primary)" }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// TODO: Replace [XX] and [X] with confirmed figures before marketing launch.
// "XX% faster" and "X fewer compliance hires" are intentionally left as placeholders
// per the design handoff — don't substitute real numbers without backing data.
const STATS = [
  { value: "[XX]%", label: "faster time-to-questionnaire vs. manual process" },
  { value: "[X]×", label: "fewer compliance hires needed on average" },
  { value: "2 APIs", label: "synced automatically from QuickBooks and UtilityAPI" },
];

const TRACKS = [
  {
    initials: "CO",
    title: "I represent a company",
    desc: "Get your first ESG report done without hiring a consultant. Connect your data, calculate your footprint, answer your customer's questionnaire.",
    features: [
      "Scope 1, 2, and 3 emissions tracking",
      "CDP, EcoVadis, and Walmart questionnaire mapping",
      "Audit-ready PDF reports",
    ],
    cta: "Get started free",
    href: "/signup",
  },
  {
    initials: "ES",
    title: "I'm an ESG consultant",
    desc: "Manage your clients from one dashboard. Send invite links, track progress, and generate reports across your book of business.",
    features: [
      "Multi-client management dashboard",
      "Client invite and onboarding links",
      "Centralized progress tracking",
    ],
    cta: "Set up your account",
    href: "/signup?role=consultant",
  },
];

export default async function Landing() {
  const user = await currentUser();
  if (user) redirect(user.role === "consultant" ? "/consultant" : "/dashboard");

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <LandingNav />

      {/* Hero */}
      <section className="px-6 py-28 sm:py-36" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-6xl">
          <span
            className="mb-8 inline-block px-3 py-1 text-xs font-semibold"
            style={{
              background: "var(--primary-tint)",
              border: "1px solid var(--primary)",
              borderRadius: "var(--radius-sm)",
              color: "var(--primary)",
            }}
          >
            For California mid-market companies
          </span>
          <h1
            className="max-w-3xl text-5xl font-bold font-display leading-tight sm:text-6xl lg:text-7xl"
            style={{ color: "var(--text)" }}
          >
            ESG compliance,<br />handled.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Connect your data, calculate your emissions, and export a report your customer accepts — CDP, EcoVadis, Walmart. In days, not months.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/demo" className="btn btn-primary px-6 py-3 text-sm">
              Request a demo
            </Link>
            <Link
              href="/signup"
              className="btn btn-secondary px-6 py-3 text-sm"
            >
              Get started free
            </Link>
          </div>

          {/* Stat callouts */}
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {STATS.map(({ value, label }) => (
              <div
                key={value}
                className="px-5 py-5"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--divider)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div
                  className="text-3xl font-semibold font-data"
                  style={{ color: "var(--primary)" }}
                >
                  {value}
                </div>
                <p className="mt-1 text-sm leading-snug" style={{ color: "var(--text-muted)" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div style={{ borderTop: "1px solid var(--divider)", borderBottom: "1px solid var(--divider)", background: "var(--surface)", padding: "2.5rem 0" }}>
        <div className="mx-auto max-w-6xl px-6">
          <p
            className="text-center text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Reports accepted by
          </p>
          <div
            className="mt-5 flex flex-wrap items-center justify-center gap-10 text-sm font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            <span>CDP</span>
            <span>EcoVadis</span>
            <span>Walmart Supplier Portal</span>
            <span>ENERGY STAR</span>
            <span>GHG Protocol</span>
          </div>
        </div>
      </div>

      {/* Who's it for */}
      <section className="py-24" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold font-display sm:text-3xl" style={{ color: "var(--text)" }}>
              Built for two types of users
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Whether you&rsquo;re filing your first ESG report or managing a book of clients, GreenTrack has a flow built for you.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {TRACKS.map(({ initials, title, desc, features, cta, href }) => (
              <div
                key={title}
                className="flex flex-col p-8"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--divider)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center text-sm font-bold text-white"
                  style={{ background: "var(--primary)", borderRadius: "var(--radius-sm)" }}
                >
                  {initials}
                </div>
                <h3
                  className="mt-5 text-lg font-bold font-display"
                  style={{ color: "var(--text)" }}
                >
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {desc}
                </p>
                <ul className="mt-5 space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--text)" }}>
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href={href}
                    className="text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "var(--primary)" }}
                  >
                    {cta} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold font-display sm:text-3xl" style={{ color: "var(--text)" }}>
              How it works
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Three steps from signup to finished report. No setup fees, no consultant required.
            </p>
          </div>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Connect your data",
                desc: "Link your utility accounts, QuickBooks, and freight providers. We pull the numbers automatically.",
              },
              {
                num: "02",
                title: "Calculate your emissions",
                desc: "GHG Protocol emission factors applied automatically. Scope 1, 2, and 3 categorized without manual work.",
              },
              {
                num: "03",
                title: "Export your report",
                desc: "Download an audit-ready PDF or fill supplier portal fields directly from your dashboard.",
              },
            ].map(({ num, title, desc }) => (
              <div key={num}>
                <div
                  className="text-5xl font-bold font-data leading-none"
                  style={{ color: "var(--track-bg)" }}
                >
                  {num}
                </div>
                <h3 className="mt-4 text-base font-semibold font-display" style={{ color: "var(--text)" }}>
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="max-w-xl text-2xl font-bold font-display sm:text-3xl" style={{ color: "var(--text)" }}>
            What you get
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "GHG Inventory Report",
                desc: "Scope 1, 2, and 3 in one audit-ready PDF. Formatted to GHG Protocol standards.",
              },
              {
                title: "Questionnaire Mapping",
                desc: "Your figures pre-filled into the exact fields CDP, EcoVadis, and Walmart ask for. No manual translation.",
              },
              {
                title: "Audit Trail",
                desc: "Every number traced to its source. Methodology documented. Ready for your customer's auditor.",
              },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="p-6"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--divider)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <h3 className="font-semibold font-display" style={{ color: "var(--text)" }}>
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 sm:grid-cols-2 items-start">
            <div>
              <h2 className="text-2xl font-bold font-display sm:text-3xl" style={{ color: "var(--text)" }}>
                Who we built this for
              </h2>
              <p className="mt-5 leading-relaxed text-sm" style={{ color: "var(--text-muted)" }}>
                California&rsquo;s mid-market — 50 to 500 employees — is getting ESG questionnaires from major customers for the first time. Most don&rsquo;t have a sustainability team. Hiring a consultant runs $15,000 and up.
              </p>
              <p className="mt-4 leading-relaxed text-sm" style={{ color: "var(--text-muted)" }}>
                GreenTrack does the same job: pulls your data, calculates your footprint, and produces a report your customer accepts. In days, not months.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: "50–500", label: "Employees at our target companies" },
                { stat: "$15K+", label: "Typical consultant cost for one ESG report" },
                { stat: "3 days", label: "Average time to first completed report" },
                { stat: "10+", label: "Questionnaire frameworks supported" },
              ].map(({ stat, label }) => (
                <div
                  key={stat}
                  className="p-5"
                  style={{
                    background: "var(--primary-tint)",
                    border: "1px solid var(--divider)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div className="text-2xl font-bold font-data" style={{ color: "var(--primary)" }}>
                    {stat}
                  </div>
                  <div className="mt-1 text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="py-24" style={{ background: "var(--primary)" }}>
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-bold font-display text-white sm:text-3xl">
            See it in action
          </h2>
          <p className="mt-4 max-w-md mx-auto text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            Book a 20-minute walkthrough. We&rsquo;ll show you how GreenTrack handles a real questionnaire end to end.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/demo"
              className="btn px-6 py-3 text-sm font-semibold"
              style={{ background: "var(--surface)", color: "var(--primary)", border: "none" }}
            >
              Request a demo
            </Link>
            <Link
              href="/signup"
              className="btn px-6 py-3 text-sm font-semibold"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)", color: "#fff" }}
            >
              Get started free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10" style={{ background: "#2A4A37" }}>
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="flex items-center gap-2 text-lg font-bold font-display text-white">
            <span
              className="flex h-7 w-7 items-center justify-center text-sm font-bold text-white"
              style={{ background: "var(--primary)", borderRadius: "8px" }}
            >
              G
            </span>
            GreenTrack
          </span>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            © {new Date().getFullYear()} GreenTrack. Built in California.
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-xs transition-opacity hover:opacity-100" style={{ color: "rgba(255,255,255,0.45)" }}>
              Sign in
            </Link>
            <Link href="/demo" className="text-xs transition-opacity hover:opacity-100" style={{ color: "rgba(255,255,255,0.45)" }}>
              Request demo
            </Link>
            <Link href="/signup" className="text-xs transition-opacity hover:opacity-100" style={{ color: "rgba(255,255,255,0.45)" }}>
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
