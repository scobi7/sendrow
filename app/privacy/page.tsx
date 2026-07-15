import Link from "next/link";
import { Logo } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <header
        className="flex items-center justify-between px-8 py-5"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}
      >
        <Link href="/"><Logo /></Link>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-16" style={{ color: "var(--text)" }}>
        <h1 className="text-3xl font-black font-display" style={{ color: "var(--text)" }}>Privacy Policy</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        {process.env.NEXT_PUBLIC_DRAFT_LEGAL === "true" && (
          <div className="mt-8 rounded-xl p-6" style={{ background: "var(--warning-tint)", border: "1px solid var(--warning)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>Draft - legal review pending</p>
            <p className="mt-1 text-sm" style={{ color: "var(--warning)" }}>
              This page is a placeholder. A full privacy policy is being drafted and will be published before general availability.
              Contact <a href="mailto:hello@sendrow.app" style={{ color: "var(--warning)" }}>hello@sendrow.app</a> with questions.
            </p>
          </div>
        )}

        <h2 className="mt-10 text-xl font-bold font-display" style={{ color: "var(--text)" }}>1. Information We Collect</h2>
        <p style={{ color: "var(--text-muted)" }}>
          We collect information you provide directly, including your name, email address, company name, and emissions-related business data you enter into the Service. Authentication is handled by Clerk; we do not store passwords.
        </p>

        <h2 className="mt-8 text-xl font-bold font-display" style={{ color: "var(--text)" }}>2. How We Use Your Information</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Your data is used solely to provide the Sendrow service: calculating your emissions inventory, generating reports, and enabling consultant access where you have granted it. We do not sell your data.
        </p>

        <h2 className="mt-8 text-xl font-bold font-display" style={{ color: "var(--text)" }}>3. Third-Party Services</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Sendrow uses the following sub-processors: Clerk (authentication), Neon (database), Resend (transactional email), UtilityAPI (utility data), and Intuit QuickBooks (accounting data). Each operates under its own privacy policy.
        </p>

        <h2 className="mt-8 text-xl font-bold font-display" style={{ color: "var(--text)" }}>4. Data Retention</h2>
        <p style={{ color: "var(--text-muted)" }}>
          We retain your data for as long as your account is active. You may request deletion of your account and associated data by contacting us.
        </p>

        <h2 className="mt-8 text-xl font-bold font-display" style={{ color: "var(--text)" }}>5. CCPA</h2>
        <p style={{ color: "var(--text-muted)" }}>
          California residents have rights under CCPA including the right to know, delete, and opt out of sale of personal information. We do not sell personal information. To exercise your rights, contact us at the address below.
        </p>

        <h2 className="mt-8 text-xl font-bold font-display" style={{ color: "var(--text)" }}>6. Contact</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Questions about this policy? Email <a href="mailto:hello@sendrow.app" style={{ color: "var(--primary)" }}>hello@sendrow.app</a>.
        </p>
      </article>
    </main>
  );
}
