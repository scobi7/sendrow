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
  if (user) redirect(user.role === "consultant" ? "/consultant" : "/dashboard");

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
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2"
            style={{
              width: 900,
              height: 600,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(34,197,94,0.13) 0%, transparent 65%)",
            }}
          />
          <div
            className="absolute left-1/4 top-1/2 -translate-x-1/2"
            style={{
              width: 460,
              height: 460,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(22,163,74,0.07) 0%, transparent 65%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl">
          <h1
            className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ color: "var(--text)" }}
          >
            ESG compliance,
            <br />
            <span style={{ color: "var(--primary)" }}>done right.</span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-lg text-lg leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            GreenTrack connects your existing data and automatically produces the ESG reports your customers require.
          </p>

          {/* Audience cards */}
          <div className="mx-auto mt-14 grid max-w-2xl gap-4 sm:grid-cols-2">
            <Link
              href="/for-companies"
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
                Connect your accounts. We calculate your footprint and map your numbers to whatever framework they&rsquo;re asking for.
              </p>
              <span
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: "var(--primary)" }}
              >
                See how it works &rarr;
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
                  GreenTrack &mdash; Emissions Dashboard
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

      {/* ── How it works ── */}
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
                desc: "Link your accounts. GreenTrack pulls transactions and energy data automatically — no exports, no manual entry.",
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
                <p
                  className="font-data text-5xl font-bold leading-none"
                  style={{ color: "rgba(26,92,48,0.13)" }}
                >
                  {num}
                </p>
                <h3 className="mt-5 font-display text-lg font-bold" style={{ color: "var(--text)" }}>
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

      {/* ── Stats strip ── */}
      <section
        className="px-6 py-16"
        style={{ borderTop: "1px solid var(--divider)", borderBottom: "1px solid var(--divider)" }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--divider)" }}>
            <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                { value: "3 days", label: "Average time to first completed report" },
                { value: "80%", label: "Of emissions data collected automatically via connected accounts" },
                { value: "5+", label: "Questionnaire frameworks supported" },
              ].map(({ value, label }) => (
                <div key={value} className="bg-white px-8 py-10 text-center">
                  <p className="font-data text-4xl font-bold" style={{ color: "var(--primary)" }}>
                    {value}
                  </p>
                  <p className="mt-2 text-sm leading-snug" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform overview ── */}
      <section className="px-6 py-24" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
            The platform
          </p>
          <h2
            className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
            style={{ color: "var(--text)" }}
          >
            Everything the job requires,
            <br className="hidden sm:block" />
            nothing it doesn&rsquo;t
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Built around the data you already have and the frameworks your customers already use.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* ── CTA ── */}
      <section
        className="relative overflow-hidden px-6 py-28 text-center"
        style={{ background: "var(--primary)" }}
      >
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
            See it handle a real report
          </h2>
          <p
            className="mx-auto mt-4 max-w-md text-base leading-relaxed"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            20-minute walkthrough. Bring a questionnaire or a client and we&rsquo;ll show you exactly how it maps end to end.
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
              style={{
                background: "transparent",
                border: "1.5px solid rgba(255,255,255,0.35)",
                color: "#fff",
                borderRadius: "var(--radius-sm)",
              }}
            >
              Get started free &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-10" style={{ background: "var(--text)" }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-6">
          <span className="flex items-center gap-2 font-display text-base font-bold text-white">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black"
              style={{ background: "var(--status-green)", color: "var(--text)" }}
            >
              G
            </span>
            GreenTrack
          </span>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            &copy; {new Date().getFullYear()} GreenTrack. Built in California.
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
