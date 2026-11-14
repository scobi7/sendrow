import Link from "next/link";
import { MarketingPage, PageHead, mk } from "@/components/marketing/parts";

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
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contact@sendrow.app";
  return (
    <MarketingPage>
      <PageHead
        title="Security overview"
        lede={
          <>
            You trust us with utility bills and spend data. Here is exactly how that data is handled, before you have to ask. Questions:{" "}
            <a href={`mailto:${email}`} className={mk.link}>{email}</a>
          </>
        }
      />
      <div className={mk.wrap}>
        <div className={mk.prose}>
          {SECTIONS.map(([title, body]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{body}</p>
            </section>
          ))}
          <p>See also:</p>
          <ul>
            <li>
              <Link href="/dpa">Data Processing Agreement template</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy policy</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
          </ul>
        </div>
      </div>
    </MarketingPage>
  );
}
