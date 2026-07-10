import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";

export default async function Home() {
  const user = await currentUser();
  if (user) redirect(user.role === "consultant" ? "/consultant" : "/onboarding");

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Header — transparent, floats on the wash */}
      <header className="mx-auto flex h-[78px] max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="flex items-center gap-6">
          <Link href="/how-it-works" className="hidden text-sm font-medium transition-opacity hover:opacity-70 sm:block" style={{ color: "var(--text-muted)" }}>
            How it works
          </Link>
          <Link href="/for-companies" className="hidden text-sm font-medium transition-opacity hover:opacity-70 sm:block" style={{ color: "var(--text-muted)" }}>
            For companies
          </Link>
          <Link href="/for-consultants" className="hidden text-sm font-medium transition-opacity hover:opacity-70 sm:block" style={{ color: "var(--text-muted)" }}>
            For consultants
          </Link>
          <Link href="/login" className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            Sign in
          </Link>
          <Link href="/demo" className="btn btn-primary text-sm">
            Request a demo
          </Link>
        </div>
      </header>

      {/* ── Hero: giant left headline + glass KPI card ── */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-10 pt-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="eyebrow">The system of record · clean data, calm workflows</p>
          <h1
            className="mt-4 font-display font-extrabold"
            style={{ fontSize: "clamp(52px, 7vw, 90px)", lineHeight: 0.95, letterSpacing: "-0.06em", color: "var(--text)" }}
          >
            Climate reporting, with a lighter touch.
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-[1.72]" style={{ color: "var(--text-muted)" }}>
            Sendrow is the one organized place where your client&rsquo;s emissions data lives —
            collected once, kept with proof attached, and shared to any customer or regulator
            in whatever format they ask for. Under your brand.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/for-consultants" className="btn btn-primary px-6 py-3 text-sm">
              See the consultant workspace →
            </Link>
            <Link href="/get-matched" className="btn btn-secondary px-6 py-3 text-sm">
              I&rsquo;m a company — get matched
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Reporting readiness", value: "84%", sub: "↑ +7% this quarter" },
              { label: "Open actions", value: "12", sub: "4 due this week" },
              { label: "Scope 1 + 2", value: "2.3kt", sub: "↓ -6.2% YoY" },
              { label: "Data coverage", value: "92%", sub: "utility + supplier data" },
            ].map(({ label, value, sub }) => (
              <article key={label} className="card-inner">
                <small className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</small>
                <strong className="mt-3 block font-data text-[26px] font-medium" style={{ color: "var(--text)" }}>
                  {value}
                </strong>
                <span className="mt-2 block font-data text-[11px]" style={{ color: "var(--primary-strong)" }}>
                  {sub}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Glass dashboard panels ── */}
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-16 lg:grid-cols-[1.45fr_0.82fr]">
        <article className="card">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Disclosure readiness</h2>
              <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>
                Every section&rsquo;s progress, live from the data your clients submit
              </p>
            </div>
            <span className="chip">2025 cycle</span>
          </div>
          <div className="mt-6 grid gap-3.5">
            {[
              ["Governance", 91],
              ["Emissions", 84],
              ["Risk", 69],
              ["Targets", 76],
            ].map(([label, pct]) => (
              <div key={label as string} className="grid grid-cols-[110px_1fr_44px] items-center gap-3 text-[13px]">
                <span style={{ color: "var(--text)" }}>{label}</span>
                <div className="track">
                  <div className="fill" style={{ width: `${pct}%` }} />
                </div>
                <b className="font-data text-xs font-medium" style={{ color: "var(--primary)" }}>{pct}%</b>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Recent work</h2>
          <p className="mt-1 text-[13px]" style={{ color: "var(--text-muted)" }}>Current items across the workspace</p>
          <table className="mt-3 w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {[
                { title: "California SB 253", sub: "Annual disclosure", right: <span className="badge">Ready</span> },
                { title: "Supplier emissions survey", sub: "Scope 3 collection", right: <span className="font-data text-xs">78%</span> },
                { title: "Utility bill ingestion", sub: "Electricity + gas", right: <span className="font-data text-xs">Review</span> },
                { title: "Risk narrative update", sub: "Climate + operations", right: <span className="font-data text-xs">Draft</span> },
              ].map(({ title, sub, right }) => (
                <tr key={title}>
                  <td className="py-3.5" style={{ borderBottom: "1px solid var(--divider)" }}>
                    <span style={{ color: "var(--text)" }}>{title}</span>
                    <small className="mt-1 block text-[11px]" style={{ color: "var(--text-muted)" }}>{sub}</small>
                  </td>
                  <td className="py-3.5 text-right" style={{ borderBottom: "1px solid var(--divider)", color: "var(--text)" }}>
                    {right}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>

      {/* ── Audience cards ── */}
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2">
        <Link href="/get-matched" className="card group transition-transform duration-200 hover:-translate-y-0.5">
          <p className="eyebrow">For companies</p>
          <h2 className="mt-3 text-lg font-bold leading-snug" style={{ color: "var(--text)" }}>
            Got an ESG questionnaire from a customer?
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            We&rsquo;ll match you with a vetted climate consultant who handles it end to end — free,
            usually within two business days.
          </p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--primary)" }}>
            Get matched →
          </span>
        </Link>
        <Link href="/for-consultants" className="card group transition-transform duration-200 hover:-translate-y-0.5">
          <p className="eyebrow">For consultants</p>
          <h2 className="mt-3 text-lg font-bold leading-snug" style={{ color: "var(--text)" }}>
            Managing clients across spreadsheets?
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Run your entire book from one platform. Clients respond from their inbox in minutes.
            You review, approve, and deliver in any format.
          </p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--primary)" }}>
            See how it works →
          </span>
        </Link>
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
