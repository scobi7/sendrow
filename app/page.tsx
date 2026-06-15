import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingNav } from "@/components/landing-nav";

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

const TRACKS = [
  {
    Icon: BuildingIcon,
    iconBg: "bg-brand-600",
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
    Icon: UsersIcon,
    iconBg: "bg-navy-800",
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
    <main className="min-h-screen bg-white">
      <LandingNav />

      {/* Hero */}
      <section className="bg-brand-950 px-6 py-28 sm:py-36">
        <div className="mx-auto max-w-6xl">
          <span className="inline-block rounded-full bg-brand-800 px-3 py-1 text-xs font-semibold text-brand-300 mb-8">
            For California mid-market companies
          </span>
          <h1 className="text-5xl font-bold text-white sm:text-6xl lg:text-7xl leading-tight max-w-3xl">
            ESG compliance,<br />handled.
          </h1>
          <p className="mt-6 text-lg text-brand-300 max-w-xl leading-relaxed">
            Connect your data, calculate your emissions, and export a report your customer accepts — CDP, EcoVadis, Walmart. In days, not months.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/demo"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-950 hover:bg-brand-50 transition-colors"
            >
              Request a demo
            </Link>
            <Link
              href="/signup"
              className="rounded-lg border border-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="border-b border-slate-100 py-10 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            Reports accepted by
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-10 text-sm font-semibold text-slate-400">
            <span>CDP</span>
            <span>EcoVadis</span>
            <span>Walmart Supplier Portal</span>
            <span>ENERGY STAR</span>
            <span>GHG Protocol</span>
          </div>
        </div>
      </div>

      {/* Who's it for */}
      <section className="py-24 bg-brand-50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Built for two types of users</h2>
            <p className="mt-3 text-slate-600">
              Whether you're filing your first ESG report or managing a book of clients, GreenTrack has a flow built for you.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {TRACKS.map(({ Icon, iconBg, title, desc, features, cta, href }) => (
              <div key={title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
                  <Icon />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
                <ul className="mt-5 space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href={href}
                    className="inline-flex items-center text-sm font-semibold text-brand-700 hover:text-brand-900 transition-colors"
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
      <section id="how-it-works" className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">How it works</h2>
            <p className="mt-3 text-slate-600">Three steps from signup to finished report. No setup fees, no consultant required.</p>
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
                <div className="text-5xl font-bold text-brand-200 leading-none">{num}</div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-brand-50">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl max-w-xl">What you get</h2>
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
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 sm:grid-cols-2 items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Who we built this for</h2>
              <p className="mt-5 text-slate-600 leading-relaxed">
                California&rsquo;s mid-market — 50 to 500 employees — is getting ESG questionnaires from major customers for the first time. Most don&rsquo;t have a sustainability team. Hiring a consultant runs $15,000 and up.
              </p>
              <p className="mt-4 text-slate-600 leading-relaxed">
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
                <div key={stat} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-2xl font-bold text-brand-700">{stat}</div>
                  <div className="mt-1 text-xs text-slate-500 leading-snug">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="bg-brand-800 py-24">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">See it in action</h2>
          <p className="mt-4 text-brand-300 max-w-md mx-auto">
            Book a 20-minute walkthrough. We&rsquo;ll show you how GreenTrack handles a real questionnaire end to end.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/demo"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-50 transition-colors"
            >
              Request a demo
            </Link>
            <Link
              href="/signup"
              className="rounded-lg border border-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-900 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm text-white">G</span>
            GreenTrack
          </span>
          <p className="text-xs text-brand-400">© {new Date().getFullYear()} GreenTrack. Built in California.</p>
          <div className="flex gap-6">
            <Link href="/login" className="text-xs text-brand-400 hover:text-white transition-colors">Sign in</Link>
            <Link href="/demo" className="text-xs text-brand-400 hover:text-white transition-colors">Request demo</Link>
            <Link href="/signup" className="text-xs text-brand-400 hover:text-white transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
