import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";

/** Super-minimal by design (X4.2, Malachi 2026-07-14): companies aren't the
 *  paying customer - this page exists only to route them to a consultant.
 *  The old self-serve pitch lives in git history (and sendrow-v1). */
export default function ForCompanies() {
  return (
    <main className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      <LandingNav />

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center px-6 py-24">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
          For companies
        </p>
        <h1
          className="mt-3 text-4xl font-extrabold leading-tight font-display sm:text-5xl"
          style={{ color: "var(--text)" }}
        >
          A customer asked for your emissions data?
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
          You don&apos;t need new software - you need someone who does this every day. We&apos;ll match you with a
          climate consultant who collects your data, builds an audit-ready footprint, and answers every buyer and
          regulator format on your behalf.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/get-matched" className="btn btn-primary px-6 py-3">
            Get matched with a consultant →
          </Link>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Free to ask · usually within two business days
          </span>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
