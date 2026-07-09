import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";

export const metadata = {
  title: "How it works — Sendrow",
  description:
    "Your emissions data, collected once, proven, and shared anywhere. One trusted record instead of seventeen email threads.",
};

const STEPS: { n: string; title: string; body: React.ReactNode }[] = [
  {
    n: "1",
    title: "Your consultant asks. In plain English.",
    body: (
      <>
        Your consultant picks exactly what&apos;s needed — &ldquo;your last 12 electricity
        bills,&rdquo; &ldquo;gallons of diesel in 2025&rdquo; — and Sendrow turns it into a
        checklist written for humans, not accountants.
      </>
    ),
  },
  {
    n: "2",
    title: "You answer from your inbox. Ten minutes.",
    body: (
      <>
        One email, one link. <strong>No account, no password, no portal to learn.</strong> Upload
        the bills, type in the numbers — it all lands in the right place.
      </>
    ),
  },
  {
    n: "3",
    title: "Every number gets its receipt.",
    body: (
      <>
        Each figure is stapled to the bill, invoice, or receipt it came from. When anyone later
        asks &ldquo;where did this number come from?&rdquo; — the answer is one click away.
      </>
    ),
  },
  {
    n: "4",
    title: "A professional signs off. Then it's frozen.",
    body: (
      <>
        Your consultant reviews, fixes, and approves. Approved data is locked into a dated
        snapshot — nobody can quietly change shared numbers later. If something is ever
        corrected, everyone who received the old version is told exactly what changed.
      </>
    ),
  },
  {
    n: "5",
    title: "Answer once. Share it in any format.",
    body: (
      <>
        California SB 253, CDP, a customer&apos;s questionnaire, plain Excel — the same approved
        snapshot, reshaped per request. When the <em>next</em> customer asks, it&apos;s done
        before lunch. And you share on your terms: this snapshot, to this company, in this
        format — nothing more.
      </>
    ),
  },
];

const PROMISES: { title: string; body: string }[] = [
  { title: "We never grade you.", body: "No scores, no report cards. Ever." },
  {
    title: "We never replace your consultant.",
    body: "We're the tool you both use together.",
  },
  {
    title: "Your data is yours.",
    body: "Export everything in the industry-standard PACT format, anytime, and take it with you.",
  },
];

export default function HowItWorksPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <LandingNav />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-6 pt-20 pb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            How Sendrow works
          </p>
          <h1
            className="mt-3 text-4xl font-extrabold leading-tight font-display sm:text-5xl"
            style={{ color: "var(--text)" }}
          >
            Your emissions data, collected once, proven, and shared anywhere.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg" style={{ color: "var(--text-muted)" }}>
            One trusted record instead of seventeen email threads and five conflicting
            spreadsheets.
          </p>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-2xl space-y-4 px-6 pb-20">
          {STEPS.map((step) => (
            <div key={step.n} className="card flex gap-5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold font-data"
                style={{ background: "var(--primary-tint)", color: "var(--primary)" }}
              >
                {step.n}
              </div>
              <div>
                <h2 className="font-bold font-display" style={{ color: "var(--text)" }}>
                  {step.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* The three promises — ink band */}
        <section className="px-6 py-16" style={{ background: "var(--ink-band)" }}>
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold font-display" style={{ color: "var(--ink-band-text)" }}>
              Three promises we put in writing
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {PROMISES.map((p) => (
                <div key={p.title} className="text-center">
                  <p className="font-bold font-display" style={{ color: "var(--ink-band-text)" }}>{p.title}</p>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-band-text)", opacity: 0.65 }}>
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTAs */}
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h2 className="text-xl font-bold font-display" style={{ color: "var(--text)" }}>
            Ready?
          </h2>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/for-consultants" className="btn btn-primary px-6 py-3 text-sm">
              Are you a consultant? See the workspace →
            </Link>
            <Link href="/get-matched" className="btn btn-secondary px-6 py-3 text-sm">
              Got a data request? Get matched →
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
