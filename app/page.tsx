import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TrackedLink } from "@/components/tracked-link";
import { PageViewTracker } from "@/components/page-view-tracker";
import { LandingFooter } from "@/components/landing-footer";
import { LandingNav } from "@/components/landing-nav";
import { DeadlineBar, DeadlinesSection } from "@/components/regulatory-deadlines";

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Send a secure link",
    desc: "No account needed. Clients upload bills or type numbers in directly.",
  },
  {
    num: "02",
    title: "Calculations run automatically",
    desc: "GHG Protocol factors applied as data comes in, Scope 1 through 3.",
  },
  {
    num: "03",
    title: "Export and submit",
    desc: "Audit-ready PDF or a pre-filled questionnaire, already mapped.",
  },
];

const STEPS = [
  { title: "Create your workspace", desc: "Sign up and set up your consultant workspace." },
  { title: "Add your brand", desc: "Your logo and color go on every request, portal page and report." },
  {
    title: "Add a client and send a request",
    desc: "Your client gets one secure link. No account needed on their side.",
  },
  {
    title: "Review, freeze and share",
    desc: "Approve what comes back, freeze a dated snapshot, and export to Excel, PDF or an SB 253 draft.",
  },
];

export default async function Home() {
  const user = await currentUser();
  if (user) redirect(user.role === "consultant" ? "/consultant" : "/onboarding");

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PageViewTracker />

      <DeadlineBar today={today} />
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-6 pt-16 text-center">
        <p className="eyebrow">The system of record for supplier emissions data</p>
        <h1
          className="mx-auto mt-4 max-w-2xl font-display font-extrabold"
          style={{ fontSize: "clamp(36px, 5.5vw, 58px)", lineHeight: 1.03, letterSpacing: "-0.035em", color: "var(--text)" }}
        >
          One clean emissions file. Mapped to the formats your clients actually need.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.7]" style={{ color: "var(--text-muted)" }}>
          Collected once, kept with proof attached, and mapped to CDP, EcoVadis, Walmart and SB 253, all under your
          brand.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <TrackedLink href="/signup" event="hero_get_started_click" className="btn btn-primary">
            Get started
          </TrackedLink>
          <TrackedLink href="/how-it-works" event="hero_how_it_works_click" className="btn btn-secondary">
            See how it works
          </TrackedLink>
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          For climate consultants. Set up your workspace and send your first request today.
        </p>

        <div
          className="mx-auto mt-10 max-w-xl rounded-canopy-lg px-5 py-4 text-center text-sm"
          style={{ border: "1px solid var(--divider)", background: "var(--bg-subtle)", color: "var(--text-muted)" }}
        >
          <p>
            Got a data request from your consultant? You don&rsquo;t need an account. Just open the link they sent you.
          </p>
          <p className="mt-2">
            No consultant yet?{" "}
            <Link href="/get-matched" className="font-semibold underline" style={{ color: "var(--primary)" }}>
              Get matched
            </Link>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-6 pb-4 pt-16">
        <div className="grid gap-10 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ num, title, desc }) => (
            <div key={num} className="card">
              <span className="font-data text-sm font-bold" style={{ color: "var(--text-muted)" }}>
                {num}
              </span>
              <h3 className="mt-3 text-[15px] font-bold" style={{ color: "var(--text)" }}>
                {title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
        <p
          className="mx-auto mt-10 max-w-2xl text-center text-[12.5px]"
          style={{ color: "var(--text-muted)", borderTop: "1px solid var(--divider)", paddingTop: 20 }}
        >
          Along the way, Sendrow sends the reminders: no chasing a client down for a missing utility bill.
        </p>
      </section>

      {/* Get started */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="font-display text-2xl font-bold" style={{ color: "var(--text)" }}>
          Get started in four steps
        </h2>
        <ol className="mt-8 space-y-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-5">
              <span className="font-data w-6 shrink-0 text-sm font-bold" style={{ color: "var(--text-muted)" }}>
                {i + 1}
              </span>
              <div>
                <p className="text-[15px] font-bold" style={{ color: "var(--text)" }}>
                  {s.title}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {s.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <TrackedLink href="/signup" event="steps_get_started_click" className="btn btn-primary">
            Get started
          </TrackedLink>
        </div>
      </section>

      <DeadlinesSection today={today} />

      {/* Closing band */}
      <section className="px-6 py-16 text-center" style={{ background: "var(--bg-subtle)", borderTop: "1px solid var(--divider)" }}>
        <h2 className="font-display text-2xl font-bold" style={{ color: "var(--text)" }}>Send your first data request today</h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
          <Link href="/signup" className="btn btn-primary">
            Get started
          </Link>
          <Link href="/demo" className="text-sm font-medium underline" style={{ color: "var(--text-muted)" }}>
            Questions? Book a demo
          </Link>
        </div>
      </section>

      <LandingFooter variant="ink" />
    </main>
  );
}
