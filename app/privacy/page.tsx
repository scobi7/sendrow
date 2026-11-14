import { MarketingPage, PageHead, mk } from "@/components/marketing/parts";

export default function PrivacyPage() {
  return (
    <MarketingPage>
      <PageHead title="Privacy Policy" />
      <div className={mk.wrap}>
        <p className={mk.meta}>Last updated: November 13, 2026</p>

        {process.env.NEXT_PUBLIC_DRAFT_LEGAL === "true" && (
          <div className="mt-8 rounded-xl p-6" style={{ background: "var(--warning-tint)", border: "1px solid var(--warning)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>Draft: legal review pending</p>
            <p className="mt-1 text-sm" style={{ color: "var(--warning)" }}>
              This page is a placeholder. A full privacy policy is being drafted and will be published before general availability.
              Contact <a href="mailto:contact@sendrow.app" style={{ color: "var(--warning)" }}>contact@sendrow.app</a> with questions.
            </p>
          </div>
        )}

        <div className={`${mk.prose} mt-10`}>
          <h2>1. Information We Collect</h2>
          <p>
            We collect information you provide directly, including your name, email address, company name, and emissions-related business data you enter into the Service. Authentication is handled by Clerk; we do not store passwords.
          </p>

          <h2>2. How We Use Your Information</h2>
          <p>
            Your data is used solely to provide the Sendrow service: calculating your emissions inventory, generating reports, and enabling consultant access where you have granted it. We do not sell your data.
          </p>

          <h2>3. Third-Party Services</h2>
          <p>
            Sendrow uses the following sub-processors: Clerk (authentication), Neon (database), Vercel (hosting), Resend (transactional email), and Stripe (payments). Each operates under its own privacy policy.
          </p>

          <h2>4. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. You may request deletion of your account and associated data by contacting us.
          </p>

          <h2>5. CCPA</h2>
          <p>
            California residents have rights under CCPA including the right to know, delete, and opt out of sale of personal information. We do not sell personal information. To exercise your rights, contact us at the address below.
          </p>

          <h2>6. Contact</h2>
          <p>
            Questions about this policy? Email <a href="mailto:contact@sendrow.app">contact@sendrow.app</a>.
          </p>
        </div>
      </div>
    </MarketingPage>
  );
}
