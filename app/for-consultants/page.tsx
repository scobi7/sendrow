import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";

const FEATURES = [
  {
    title: "Multi-client dashboard",
    desc: "Every client, their progress, and what needs attention in one view. No more chasing status updates.",
  },
  {
    title: "Client invite links",
    desc: "Generate a unique link for each client. They connect their accounts and fill in their data directly — you review.",
  },
  {
    title: "Automated calculations",
    desc: "GHG Protocol emission factors applied automatically for every client. No manual factor lookups.",
  },
  {
    title: "Audit-ready reports",
    desc: "PDF exports and questionnaire pre-fills for CDP, EcoVadis, and Walmart. Methodology documented for every figure.",
  },
  {
    title: "Full audit trail",
    desc: "Every figure traced to its source across every client. Defensible methodology you can stand behind.",
  },
  {
    title: "Progress tracking",
    desc: "See at a glance which clients are on track, which are stalled, and exactly where they need your attention.",
  },
];

const MOCK_CLIENTS = [
  { name: "Pacific Coast Logistics", status: "Complete", pct: 100 },
  { name: "Bay Area Manufacturing Co.", status: "In Progress", pct: 57 },
  { name: "Central Valley Foods", status: "Needs Attention", pct: 29 },
  { name: "Sierra Industrial Supply", status: "In Progress", pct: 71 },
];

const STATUS_COLORS: Record<string, string> = {
  "Complete": "var(--status-green)",
  "In Progress": "var(--primary)",
  "Needs Attention": "#F59E0B",
};

export default function ForConsultants() {
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
            className="absolute right-16 top-1/4"
            style={{
              width: 340,
              height: 340,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 65%)",
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
            For ESG consultants
          </div>

          <h1
            className="mx-auto max-w-3xl font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ color: "var(--text)" }}
          >
            Run your entire client book
            <br />
            <span style={{ color: "var(--primary)" }}>from one platform.</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            Clients connect their own accounts and fill in their data. Sendrow runs the calculations. You review, report, and deliver &mdash; without the spreadsheet overhead.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/demo" className="btn btn-primary px-6 py-3 text-sm">
              Request a demo
            </Link>
            <Link href="/signup" className="btn btn-secondary px-6 py-3 text-sm">
              Get started free &rarr;
            </Link>
          </div>

          {/* Client dashboard preview */}
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
                  Sendrow &mdash; Consultant Dashboard
                </span>
              </div>

              <div className="p-5">
                {/* Summary row */}
                <div className="mb-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Active clients", value: "4" },
                    { label: "Reports complete", value: "1" },
                    { label: "Need attention", value: "1" },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-xl p-4"
                      style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(15,50,28,0.07)" }}
                    >
                      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        {label}
                      </p>
                      <p className="mt-1.5 font-data text-2xl font-bold" style={{ color: "var(--text)" }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Client table */}
                <div
                  className="overflow-hidden rounded-xl"
                  style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(15,50,28,0.07)" }}
                >
                  <div
                    className="grid grid-cols-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)", borderBottom: "1px solid rgba(15,50,28,0.07)" }}
                  >
                    <span>Client</span>
                    <span>Progress</span>
                    <span>Status</span>
                  </div>
                  {MOCK_CLIENTS.map(({ name, status, pct }) => (
                    <div
                      key={name}
                      className="grid grid-cols-3 items-center px-4 py-3"
                      style={{ borderBottom: "1px solid rgba(15,50,28,0.05)" }}
                    >
                      <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{name}</p>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(15,50,28,0.08)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: "var(--primary)" }}
                          />
                        </div>
                        <span className="font-data text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                          {pct}%
                        </span>
                      </div>
                      <span
                        className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{
                          background: `${STATUS_COLORS[status]}22`,
                          color: STATUS_COLORS[status],
                        }}
                      >
                        {status}
                      </span>
                    </div>
                  ))}
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
            Built for practices that are
            <br className="hidden sm:block" />
            ready to scale
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Clients self-serve their data. Calculations run automatically. You stay focused on the work that actually requires your expertise.
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

      {/* How clients connect */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
                Client onboarding
              </p>
              <h2
                className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
                style={{ color: "var(--text)" }}
              >
                Clients handle their own
                <br />
                data collection.
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Send a client an invite link. They connect their QuickBooks and utility account. Sendrow pulls the data and runs the calculations automatically &mdash; no back-and-forth, no manual data requests.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Generate a unique invite link per client in one click",
                  "Clients connect their own accounts &mdash; you never need their credentials",
                  "You see their progress in real time and can step in wherever needed",
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
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>
            </div>

            {/* Invite flow visual */}
            <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid rgba(15,50,28,0.1)" }}>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Client invite flow
              </p>
              <div className="space-y-3">
                {[
                  { step: "1", title: "You generate an invite link", sub: "Takes 10 seconds. Unique per client." },
                  { step: "2", title: "Client connects their accounts", sub: "QuickBooks + utility provider. No exports needed." },
                  { step: "3", title: "Data populates automatically", sub: "Scope 1, 2, and 3 calculated in real time." },
                  { step: "4", title: "You review and generate the report", sub: "Audit-ready PDF, pre-filled questionnaire fields." },
                ].map(({ step, title, sub }) => (
                  <div
                    key={step}
                    className="flex items-start gap-4 rounded-xl p-4"
                    style={{ background: "#fff", border: "1px solid rgba(15,50,28,0.08)" }}
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
                      style={{ background: "rgba(34,197,94,0.12)", color: "var(--primary)" }}
                    >
                      {step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{title}</p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
                    </div>
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
                { value: "3 days", label: "Average time for a client to complete their report" },
                { value: "Zero", label: "Spreadsheets required to manage your book" },
                { value: "5+", label: "Questionnaire frameworks supported per client" },
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
            From new client to delivered report
          </h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Add a client",
                desc: "Create a client profile and generate a unique invite link. Send it over however you like.",
              },
              {
                num: "02",
                title: "They connect their accounts",
                desc: "Clients link QuickBooks and their utility provider. Sendrow pulls transactions and energy data automatically.",
              },
              {
                num: "03",
                title: "You review and deliver",
                desc: "Check calculations, generate an audit-ready PDF or pre-filled questionnaire, and deliver to your client.",
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
                ESG consultants whose practice is outgrowing their tools
              </h2>
              <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                ESG practices are growing fast, but the tools haven&rsquo;t kept up. Most consultants are still coordinating data collection over email, running calculations in spreadsheets, and manually building reports for every client.
              </p>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Sendrow gives you a platform where clients handle their own data, calculations run automatically, and every report is audit-ready from the start. Spend your time on the work that requires your expertise.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: "One", label: "Dashboard for your entire client book" },
                { stat: "3 days", label: "Average client turnaround time" },
                { stat: "Auto", label: "Calculations run as client data comes in" },
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

      <LandingFooter />
    </main>
  );
}
