import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LandingNav } from "@/components/landing-nav";

export default async function Landing() {
  const user = await currentUser();
  if (user) redirect(user.role === "consultant" ? "/consultant" : "/dashboard");

  return (
    <main className="min-h-screen bg-white">
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 border border-brand-100 mb-6">
            For California mid-market companies
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-tight">
            Your ESG questionnaire,<br className="hidden sm:block" /> answered.
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
            Connect your data, calculate your emissions, and export a finished report your customer accepts — CDP, EcoVadis, Walmart, and more.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/signup" className="btn-primary px-6 py-3 text-base">
              Get started free
            </Link>
            <Link href="/signup?role=consultant" className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
              ESG consultant? →
            </Link>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="border-t border-b border-slate-100 py-8 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-slate-400">
            Reports accepted by
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-10 text-sm font-semibold text-slate-400">
            <span>CDP</span>
            <span>EcoVadis</span>
            <span>Walmart Supplier Portal</span>
            <span>ENERGY STAR</span>
            <span>GHG Protocol</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-brand-50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Three steps from signup to report</h2>
            <p className="mt-3 text-slate-600">No setup fees. No consultant required.</p>
          </div>
          <div className="mt-14 grid gap-12 sm:grid-cols-3">
            {[
              {
                num: "01",
                title: "Connect your data",
                desc: "Link your utility accounts, QuickBooks, and freight providers. We pull the numbers automatically.",
              },
              {
                num: "02",
                title: "Calculate your emissions",
                desc: "We apply GHG Protocol emission factors and categorize everything into Scope 1, 2, and 3.",
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
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl max-w-xl">
            Everything in one place
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "GHG Inventory Report",
                desc: "Scope 1, 2, and 3 in a single PDF. Formatted to GHG Protocol standards and ready for third-party verification.",
              },
              {
                title: "Questionnaire Mapping",
                desc: "Your figures pre-filled into the exact fields CDP, EcoVadis, and Walmart ask for. No manual translation.",
              },
              {
                title: "Audit Trail",
                desc: "Every number traced back to its source. Methodology documented. Ready for your customer's auditor.",
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
      <section id="about" className="border-t border-slate-100 py-24 bg-stone-50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 sm:grid-cols-2 items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Who we built this for</h2>
              <p className="mt-5 text-slate-600 leading-relaxed">
                California&rsquo;s mid-market companies — 50 to 500 employees — are getting ESG questionnaires from major customers for the first time. Most don&rsquo;t have a sustainability team. Hiring a consultant runs $15,000 and up, and takes months.
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
                <div key={stat} className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="text-2xl font-bold text-brand-700">{stat}</div>
                  <div className="mt-1 text-xs text-slate-500 leading-snug">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-800 py-24">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to file your first report?</h2>
          <p className="mt-4 text-brand-300">Free to start. No credit card required.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-50 transition-colors"
            >
              Get started free
            </Link>
            <Link
              href="/signup?role=consultant"
              className="text-sm font-medium text-brand-300 hover:text-white transition-colors"
            >
              ESG consultant? →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-900 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm text-white">
              G
            </span>
            GreenTrack
          </span>
          <p className="text-xs text-brand-400">
            © {new Date().getFullYear()} GreenTrack. Built in California.
          </p>
          <div className="flex gap-6">
            <Link href="/login" className="text-xs text-brand-400 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="text-xs text-brand-400 hover:text-white transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
