import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";
import { TrackedLink } from "@/components/tracked-link";
import { PageViewTracker } from "@/components/page-view-tracker";
import { WaitlistForm } from "@/components/waitlist-form";
import { LandingFooter } from "@/components/landing-footer";

export default async function Home() {
  const user = await currentUser();
  if (user) redirect(user.role === "consultant" ? "/consultant" : "/onboarding");

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PageViewTracker />

      {/* Header */}
      <header className="mx-auto flex h-[78px] max-w-5xl items-center justify-between px-6">
        <Logo />
        <div className="flex items-center gap-6">
          <TrackedLink
            href="/how-it-works"
            event="nav_how_it_works_click"
            className="hidden text-sm font-medium transition-opacity hover:opacity-70 sm:block"
            style={{ color: "var(--text-muted)" }}
          >
            How it works
          </TrackedLink>
          <TrackedLink
            href="/login"
            event="nav_signin_click"
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            Sign in
          </TrackedLink>
        </div>
      </header>

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
          Collected once, kept with proof attached, and mapped to CDP, EcoVadis, Walmart, and SB 253
          - under your brand.
        </p>

        <WaitlistForm
          source="hero"
          wantsDesignPartner={false}
          buttonLabel="Get early access"
          placeholder="you@firm.com"
          successMessage="You're on the list. We'll email you when your seat opens."
          className="mx-auto mt-8 max-w-md"
        />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-6 pb-4 pt-16">
        <div className="grid gap-10 sm:grid-cols-3">
          {[
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
          ].map(({ num, title, desc }) => (
            <div
              key={num}
              className="rounded-2xl bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ border: "1px solid var(--divider)", boxShadow: "0 1px 3px rgba(15,50,28,0.04)" }}
            >
              <span
                className="font-data text-sm font-bold"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--primary-tint)",
                  border: "1px solid rgba(23,137,90,0.35)",
                  color: "var(--primary-strong)",
                }}
              >
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
          Along the way, Sendrow sends the reminders - no chasing a client down for a missing utility bill.
        </p>
      </section>

      {/* Design partner card */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="card grid gap-7 sm:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="eyebrow">Shape what we build next</p>
            <h2 className="mt-2 text-[16px] font-bold" style={{ color: "var(--text)" }}>
              Join as a design partner.
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Two calls a month. Your pricing locked in for life. A hand in what ships next -
              including the year-over-year tracking dashboard we&rsquo;re prototyping right now.
            </p>
            <WaitlistForm
              source="partner"
              wantsDesignPartner
              buttonLabel="Apply for a seat"
              buttonVariant="primary"
              successMessage="Thanks - we'll reach out to schedule your first call."
              className="mt-4"
            />
          </div>
          <div style={{ borderLeft: "1px solid rgba(23,33,28,0.14)", paddingLeft: 24 }}>
            <p className="eyebrow">Why now</p>
            <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              California&rsquo;s SB 253 sets its first Scope 1 + 2 disclosure deadline for{" "}
              <b style={{ color: "var(--text)" }}>November 10, 2026</b>. Every consultant with a CA
              client is about to run this for the first time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter variant="ink" />
    </main>
  );
}
