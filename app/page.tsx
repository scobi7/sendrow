import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Logo, ScopeBarChart, ScopeDonutChart } from "@/components/ui";

const SAMPLE_EMISSIONS = [
  { label: "Scope 1", value: 312 },
  { label: "Scope 2", value: 484 },
  { label: "Scope 3", value: 1488 },
];

export default async function Home() {
  const user = await currentUser();
  if (user) redirect(user.role === "consultant" ? "/consultant" : "/onboarding");

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-5"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}
      >
        <Logo />
        <div className="flex items-center gap-6">
          <Link
            href="/for-companies"
            className="hidden text-sm font-medium transition-opacity hover:opacity-70 sm:block"
            style={{ color: "var(--text-muted)" }}
          >
            For companies
          </Link>
          <Link
            href="/for-consultants"
            className="hidden text-sm font-medium transition-opacity hover:opacity-70 sm:block"
            style={{ color: "var(--text-muted)" }}
          >
            For consultants
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            Sign in
          </Link>
          <Link href="/demo" className="btn btn-primary text-sm px-4 py-2">
            Request a demo
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden px-6 py-28 text-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="eyebrow mb-5">For climate consultants</p>
          <h1
            className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ color: "var(--text)" }}
          >
            The practice platform for
            <br />
            <span style={{ color: "var(--primary)" }}>climate consultants.</span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-lg text-lg leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            The one organized place where your client&rsquo;s emissions data lives — collected once, kept with proof attached, and shared to any customer or regulator in whatever format they ask for. Under your brand.
          </p>

          {/* Audience cards */}
          <div className="mx-auto mt-14 grid max-w-2xl gap-4 sm:grid-cols-2">
            <Link
              href="/get-matched"
              className="group rounded-2xl p-8 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: "var(--card)",
                border: "1px solid var(--divider)",
                boxShadow: "0 1px 4px rgba(15,50,28,0.05)",
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
                For companies
              </p>
              <h2
                className="mt-3 font-display text-lg font-bold leading-snug"
                style={{ color: "var(--text)" }}
              >
                Got an ESG questionnaire from a customer?
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                We&rsquo;ll match you with a vetted climate consultant who handles it end to end — free, usually within two business days.
              </p>
              <span
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: "var(--primary)" }}
              >
                Get matched &rarr;
              </span>
            </Link>

            <Link
              href="/for-consultants"
              className="group rounded-2xl p-8 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: "var(--card)",
                border: "1px solid var(--divider)",
                boxShadow: "0 1px 4px rgba(15,50,28,0.05)",
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
                For consultants
              </p>
              <h2
                className="mt-3 font-display text-lg font-bold leading-snug"
                style={{ color: "var(--text)" }}
              >
                Managing clients across spreadsheets?
              </h2>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Run your entire book from one platform. Clients connect their own accounts. You review, report, and deliver.
              </p>
              <span
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: "var(--primary)" }}
              >
                See how it works &rarr;
              </span>
            </Link>
          </div>

          <p className="mt-8 text-xs" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="underline" style={{ color: "var(--primary)" }}>
              Sign in
            </Link>
          </p>

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
              {/* Faux titlebar */}
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
                {/* Mini KPIs */}
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

                {/* Charts */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(15,50,28,0.07)" }}
                  >
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      Emissions by scope
                    </p>
                    <ScopeBarChart data={SAMPLE_EMISSIONS} />
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(15,50,28,0.07)" }}
                  >
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

      {/* ── Trust bar ── */}
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

      {/* ── Stats ── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-3xl p-10 sm:p-14" style={{ background: "#0D2018" }}>
            <h2 className="mb-10 text-center font-display text-2xl font-bold text-white sm:text-3xl">
              Less manual work. Faster reports.
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Reduction in manual data collection",
                  value: "80%",
                  arrow: true,
                },
                {
                  label: "Average time from setup to first completed report",
                  value: "3 days",
                  arrow: false,
                },
                {
                  label: "Questionnaire frameworks supported out of the box",
                  value: "5+",
                  arrow: false,
                },
              ].map(({ label, value, arrow }) => (
                <div
                  key={value}
                  className="flex flex-col justify-between rounded-2xl p-6"
                  style={{ background: "#162B1C", minHeight: 200 }}
                >
                  <p className="text-sm leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {label}
                  </p>
                  <div className="mt-8 flex items-end gap-2">
                    <p className="font-data text-5xl font-bold text-white">{value}</p>
                    {arrow && (
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="mb-1.5" aria-hidden>
                        <path
                          d="M11 4v14M5 12l6 6 6-6"
                          stroke="#22C55E"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works + Platform ── */}
      <section className="px-6 py-24" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
            How it works
          </p>
          <h2
            className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{ color: "var(--text)" }}
          >
            From raw data to finished report
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Whether you&rsquo;re a company filing your first questionnaire or a consultant managing a full book, the platform works the same way.
          </p>

          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Connect your data",
                desc: "Link your accounts. Sendrow pulls transactions and energy data automatically — no exports, no manual entry.",
              },
              {
                num: "02",
                title: "Calculations run automatically",
                desc: "GHG Protocol emission factors applied in real time. Scope 1, 2, and 3 broken down by source as data comes in.",
              },
              {
                num: "03",
                title: "Export and submit",
                desc: "Audit-ready PDF or pre-filled questionnaire fields. CDP, EcoVadis, and Walmart — all mapped.",
              },
            ].map(({ num, title, desc }) => (
              <div key={num}>
                <p className="font-data text-5xl font-bold leading-none" style={{ color: "rgba(26,92,48,0.13)" }}>
                  {num}
                </p>
                <h3 className="mt-5 font-display text-lg font-bold" style={{ color: "var(--text)" }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>

          <div className="my-16" style={{ borderTop: "1px solid var(--divider)" }} />

          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
            What&rsquo;s included
          </p>
          <h3
            className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl"
            style={{ color: "var(--text)" }}
          >
            Everything the job requires,
            <br className="hidden sm:block" />
            nothing it doesn&rsquo;t
          </h3>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Automated data sync",
                desc: "QuickBooks and utility account data pulled automatically. No spreadsheets, no exports.",
              },
              {
                title: "GHG Protocol calculations",
                desc: "Scope 1, 2, and 3 calculated using EPA-approved emission factors. Methodology documented for every number.",
              },
              {
                title: "Questionnaire mapping",
                desc: "Your numbers pre-filled into the exact fields CDP, EcoVadis, and Walmart ask for.",
              },
              {
                title: "Audit-ready reports",
                desc: "Every figure traced to its source. Defensible methodology your auditor can follow.",
              },
              {
                title: "Multi-client support",
                desc: "Consultants manage their entire book from one dashboard. Invite links, progress tracking, bulk reports.",
              },
              {
                title: "Full audit trail",
                desc: "Every change logged. Every data source documented. Nothing reconstructed after the fact.",
              },
            ].map(({ title, desc }) => (
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

      {/* ── Footer — the ink band ── */}
      <footer className="px-6 py-14" style={{ background: "var(--ink-band)" }}>
        <div className="mx-auto max-w-5xl">
          <p className="font-display text-2xl font-semibold leading-snug" style={{ color: "var(--ink-band-text)" }}>
            One audited inventory in.
            <br />
            Every buyer and regulator format out.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-6" style={{ borderTop: "1px solid rgba(233,239,233,0.15)", paddingTop: "1.5rem" }}>
            <span className="font-display text-base font-bold" style={{ color: "var(--ink-band-text)" }}>
              Sendrow
            </span>
            <p className="text-xs" style={{ color: "rgba(233,239,233,0.45)" }}>
              &copy; {new Date().getFullYear()} Sendrow. Built in California.
            </p>
            <div className="flex gap-6">
              {[
                ["Sign in", "/login"],
                ["Request demo", "/demo"],
                ["Security", "/security"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs transition-opacity hover:opacity-80"
                  style={{ color: "rgba(233,239,233,0.6)" }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
