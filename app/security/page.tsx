import Link from "next/link";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";

export const metadata = { title: "Security: Sendrow" };

const SECTIONS: [string, string][] = [
  [
    "Where your data lives",
    "All data is stored in a managed Postgres database (Neon) hosted in the United States, encrypted at rest (AES-256) and in transit (TLS 1.2+). Application hosting is on Vercel with the same encryption-in-transit guarantees.",
  ],
  [
    "Who can see it",
    "Your data is visible only to your own account and, if you work with one, the consultant you have explicitly linked. Every consultant-client relationship is verified on every request before any data is returned. Sendrow staff access production data only for support you request.",
  ],
  [
    "Authentication",
    "Sign-in is handled by Clerk (SOC 2 Type II certified), supporting Google OAuth. Sendrow never stores passwords. Client data-upload links are single-purpose tokens that expire after 30 days and grant access only to the specific request they were created for.",
  ],
  [
    "Audit trail",
    "Every data change is logged with who, what, when, and the before/after values. Every calculated figure records its inputs, the emission factor and factor vintage used, and the formula, replayable at any time.",
  ],
  [
    "Your data is yours",
    "Your consultant can export everything (inputs, calculations, the full audit trail and the original evidence files) as a ZIP, anytime, no questions asked. A self-serve export for suppliers with their own account is coming as part of the supplier portal upgrade. To request deletion, email us.",
  ],
  [
    "Subprocessors",
    "Neon (database), Vercel (hosting), Clerk (authentication), Resend (email), Stripe (payments). Each is bound by its own data processing agreement.",
  ],
];

export default function SecurityPage() {
  return (
    <>
      <LandingNav />
      <main className="mx-auto max-w-2xl px-6 py-16" style={{ background: "var(--bg)" }}>
      <h1 className="mt-10 text-3xl font-extrabold font-display" style={{ color: "var(--text)" }}>Security overview</h1>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
        You trust us with utility bills and spend data. Here is exactly how that data is handled, before you have to ask. Questions:{" "}
        <a href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contact@sendrow.app"}`} className="underline" style={{ color: "var(--primary)" }}>
          {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contact@sendrow.app"}
        </a>
      </p>
      <div className="mt-10 space-y-8">
        {SECTIONS.map(([title, body]) => (
          <section key={title}>
            <h2 className="text-base font-bold font-display" style={{ color: "var(--text)" }}>{title}</h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{body}</p>
          </section>
        ))}
      </div>
      <p className="mt-12 text-xs" style={{ color: "var(--text-muted)" }}>
        See also: <Link href="/dpa" className="underline">Data Processing Agreement template</Link> · <Link href="/privacy" className="underline">Privacy policy</Link> · <Link href="/terms" className="underline">Terms</Link>
      </p>
      </main>
      <LandingFooter />
    </>
  );
}
