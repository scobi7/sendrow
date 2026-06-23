import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { ScopeBarChart, ScopeDonutChart } from "@/components/ui";

const SAMPLE_EMISSIONS = [
  { label: "Scope 1", value: 312 },
  { label: "Scope 2", value: 484 },
  { label: "Scope 3", value: 1488 },
];

const FEATURES = [
  {
    title: "Auto-sync from QuickBooks",
    desc: "Scope 3 supply chain emissions calculated directly from your spend data. No spreadsheet needed.",
  },
  {
    title: "Utility account integration",
    desc: "Scope 2 electricity data pulled automatically from your utility provider. Always up to date.",
  },
  {
    title: "GHG Protocol calculations",
    desc: "Emission factors applied automatically. Scope 1, 2, and 3 categorized with audit-ready methodology.",
  },
  {
    title: "Questionnaire mapping",
    desc: "Your numbers pre-filled into the exact fields CDP, EcoVadis, and Walmart ask for.",
  },
  {
    title: "Full audit trail",
    desc: "Every figure traced to its source. Methodology documented for every number your auditor will ask about.",
  },
];

export default function ForCompanies() {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <LandingNav />

      {/* Hero */}
      <section
        className="relative overflow-hidden px-6 text-center"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "7rem",
          paddingBottom: "0",
        }}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2"
            style={{
              width: 900,
              height: 600,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(34,197,94,0.14) 0%, transparent 65%)",
            }}
          />
          <div
            className="absolute left-1/4 top-1/3 -translate-x-1/2"
            style={{
              width: 460,
              height: 460,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(22,163,74,0.09) 0%, transparent 65%)",
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-5xl">
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{
              border: "1px solid rgba(34,168,84,0.35)",
              background: "rgba(34,197,94,0.1)",
              color: "var(--primary)",
            }}
          >
            For companies
          </div>

          <h1
            className="mx-auto max-w-3xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ color: "var(--text)" }}
          >
            Your customer sent an ESG questionnaire.
            <br />
            <span style={{ color: "var(--primary)" }}>Here&rsquo;s how to answer it.</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Connect your accounts and Sendrow calculates your footprint, then maps your numbers to whatever framework your customer requires &mdash; CDP, EcoVadis, Walmart, and more.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/demo" className="btn btn-primary px-6 py-3 text-sm">
              Request a demo
            </Link>
            <Link href="/signup" className="btn btn-secondary px-6 py-3 text-sm">
              Get started free &rarr;
            </Link>
          </div>

          {/* Dashboard preview */}
          <div className="relative z-10 mt-16 w-full">
            <div
              className="mx-auto max-w-4xl overflow-hidden rounded-2xl"
              style={{
                background: "var(--card)",
                border: "1px solid rgba(15,50,28,0.12)",
                boxShadow: "0 2px 0 rgba(255,255,255,0.7) inset, 0 32px 80px rgba(15,50,28,0.1)",
              }}
            >
              <div
                className="flex items-center gap-2 px-5 py-3.5"
                style={{ borderBottom: "1px solid rgba(15,50,28,0.08)" }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FF5F57" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#FFBD2E" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28C840" }} />
                <span className="ml-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Sendrow &mdash; Emissions Dashboard
                </span>
              </div>

              <div className="p-5">
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Total emissions", value: "2,284", sub: "tCO₂e · YTD", accent: true },
                    { label: "Scope 1", value: "312", sub: "Direct · tCO₂e", accent: false },
                    { label: "Scope 2", value: "484", sub: "Electricity · tCO₂e", accent: false },
                    { label: "Progress", value: "71%", sub: "4 of 7 complete", accent: true },
                  ].map(({ label, value, sub, accent }) => (
                    <div
                      key={label}
                      className="rounded-xl p-4"
                      style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(15,50,28,0.07)" }}
                    >
                      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        {label}
                      </p>
                      <p
                        className="mt-1.5 font-data text-xl font-bold leading-tight"
                        style={{ color: accent ? "var(--primary)" : "var(--text)" }}
                      >
                        {value}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(15,50,28,0.07)" }}>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      Emissions by scope
                    </p>
                    <ScopeBarChart data={SAMPLE_EMISSIONS} />
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(15,50,28,0.07)" }}>
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      Scope breakdown
                    </p>
                    <ScopeDonutChart data={SAMPLE_EMISSIONS} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div style={{ background: "#fff", borderTop: "1px solid var(--divider)", borderBottom: "1px solid var(--divider)" }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-10 px-6 py-7">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Reports accepted by
          </span>
          {["CDP", "EcoVadis", "Walmart Supplier Portal", "ENERGY STAR", "GHG Protocol"].map((name) => (
            <span key={name} className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="px-6 py-24" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
            Features
          </p>
          <h2
            className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{ color: "var(--text)" }}
          >
            Everything you need to file
            <br className="hidden sm:block" />
            your first ESG report
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Connect your accounts and the platform does the rest. Built for ops teams who don&rsquo;t have a sustainability background.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, desc }) => (
              <div
                key={title}
                className="rounded-2xl bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ border: "1px solid var(--divider)", boxShadow: "0 1px 3px rgba(15,50,28,0.04)" }}
              >
                <h3 className="font-display font-bold" style={{ color: "var(--text)" }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data connections */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
                Data connections
              </p>
              <h2
                className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
                style={{ color: "var(--text)" }}
              >
                Connect your accounts.
                <br />
                We handle the rest.
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Link QuickBooks and your utility provider. Sendrow pulls your transactions and energy data automatically &mdash; no exports, no manual data entry.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "QuickBooks spend categorized by vendor type — right emission factor applied automatically",
                  "Utility energy data converted to tCO₂e using EPA eGRID location-based factors",
                  "Continuous sync — your dashboard updates as new transactions come in",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,168,84,0.3)" }}
                    >
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                        <path d="M1 4.5l2.5 2.5L8 1.5" stroke="#1A5C30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid rgba(15,50,28,0.1)" }}>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Connected sources
              </p>
              {[
                { initials: "QB", name: "QuickBooks Online", sub: "847 transactions · synced today" },
                { initials: "U", name: "Utility Account", sub: "12 months data · synced today" },
              ].map(({ initials, name, sub }) => (
                <div
                  key={name}
                  className="mb-3 flex items-center gap-4 rounded-xl p-4"
                  style={{ background: "#fff", border: "1px solid rgba(15,50,28,0.08)" }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black"
                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,168,84,0.25)", color: "var(--primary)" }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{name}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
                  </div>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--status-green)" }} />
                </div>
              ))}
              <div className="mt-2 space-y-2">
                {[
                  { label: "Scope 3 auto-calculated", sub: "847 transactions · 62 vendor categories", value: "1,488 t" },
                  { label: "Scope 2 from utility", sub: "42,000 kWh · EPA eGRID factor", value: "484 t" },
                ].map(({ label, sub, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,168,84,0.2)" }}
                  >
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--primary)" }}>{label}</p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
                    </div>
                    <span className="font-data text-base font-bold" style={{ color: "var(--primary)" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section
        className="px-6 py-16"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--divider)", borderBottom: "1px solid var(--divider)" }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--divider)" }}>
            <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                { value: "3 days", label: "Average time to first completed report" },
                { value: "$15K+", label: "Typical cost to hire a consultant for one report" },
                { value: "5+", label: "Questionnaire frameworks supported" },
              ].map(({ value, label }) => (
                <div key={value} className="bg-white px-8 py-10 text-center">
                  <p className="font-data text-4xl font-bold" style={{ color: "var(--primary)" }}>{value}</p>
                  <p className="mt-2 text-sm leading-snug" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
            How it works
          </p>
          <h2
            className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{ color: "var(--text)" }}
          >
            Three steps to a finished report
          </h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Connect your accounts",
                desc: "Link QuickBooks and your utility provider. Sendrow pulls your transactions and energy data automatically &mdash; no exports, no spreadsheets.",
              },
              {
                num: "02",
                title: "Calculate your footprint",
                desc: "GHG Protocol emission factors applied automatically. Scope 1, 2, and 3 broken down by source, live as data comes in.",
              },
              {
                num: "03",
                title: "Export and submit",
                desc: "Download an audit-ready PDF or fill supplier portal fields directly. CDP, EcoVadis, and Walmart &mdash; all mapped.",
              },
            ].map(({ num, title, desc }) => (
              <div key={num}>
                <p className="font-data text-5xl font-bold leading-none" style={{ color: "rgba(26,92,48,0.13)" }}>
                  {num}
                </p>
                <h3 className="mt-5 font-display text-lg font-bold" style={{ color: "var(--text)" }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }} dangerouslySetInnerHTML={{ __html: desc }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="px-6 py-24"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--divider)" }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="grid items-start gap-16 sm:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
                Who we built this for
              </p>
              <h2
                className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
                style={{ color: "var(--text)" }}
              >
                Mid-market companies getting their first ESG questionnaire
              </h2>
              <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                California&rsquo;s mid-market &mdash; 50 to 500 employees &mdash; is getting ESG questionnaires from major customers for the first time. Most don&rsquo;t have a sustainability team, and the questionnaires aren&rsquo;t getting easier.
              </p>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Sendrow pulls your data, calculates your footprint, and produces a report your customer accepts. In days, not months.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: "50–500", label: "Employees at our target companies" },
                { stat: "$15K+", label: "Typical consultant cost for one report" },
                { stat: "3 days", label: "Average time to first completed report" },
                { stat: "5+", label: "Questionnaire frameworks supported" },
              ].map(({ stat, label }) => (
                <div key={stat} className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid var(--divider)" }}>
                  <p className="font-data text-2xl font-bold" style={{ color: "var(--primary)" }}>{stat}</p>
                  <p className="mt-1 text-xs leading-snug" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden px-6 py-28 text-center" style={{ background: "var(--primary)" }}>
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 700,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(255,255,255,0.07) 0%, transparent 60%)",
            }}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            See it handle a real questionnaire
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            20-minute walkthrough. Bring your last questionnaire and we&rsquo;ll show you exactly how it maps to your emissions data.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/demo"
              className="btn px-6 py-3 text-sm font-bold"
              style={{ background: "#fff", color: "var(--primary)", borderRadius: "var(--radius-sm)" }}
            >
              Request a demo
            </Link>
            <Link
              href="/signup"
              className="btn px-6 py-3 text-sm font-semibold"
              style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.35)", color: "#fff", borderRadius: "var(--radius-sm)" }}
            >
              Get started free &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10" style={{ background: "var(--text)" }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-6">
          <span className="flex items-center gap-2 font-display text-base font-bold text-white">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black"
              style={{ background: "var(--status-green)", color: "var(--text)" }}
            >
              G
            </span>
            Sendrow
          </span>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            &copy; {new Date().getFullYear()} Sendrow. Built in California.
          </p>
          <div className="flex gap-6">
            {[
              ["Sign in", "/login"],
              ["Request demo", "/demo"],
              ["Get started", "/signup"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-xs transition-opacity hover:opacity-80"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
