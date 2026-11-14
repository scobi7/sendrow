import Link from "next/link";
import { MarketingPage, PageHead, mk } from "@/components/marketing/parts";

export const metadata = { title: "Data Processing Agreement: Sendrow" };

export default function DpaPage() {
  return (
    <MarketingPage>
      <PageHead title="Data Processing Agreement" />
      <div className={mk.wrap}>
        <div className="mt-10 rounded-lg px-4 py-2 text-xs" style={{ background: "var(--warning-tint)", color: "var(--warning)" }}>
          Template for review. Execute a signed copy per engagement. Not legal advice.
        </div>

        <div className={`${mk.prose} mt-10`}>
          <h2>1. Roles</h2>
          <p>The Client (or the Consultant acting on the Client&rsquo;s behalf) is the data controller. Sendrow is a data processor, processing operational and emissions-related data solely to produce the emissions inventory and reporting deliverables the controller instructs.</p>

          <h2>2. Scope of data</h2>
          <p>Utility usage and billing data, vehicle-fuel and expense data, vendor spend exports, employee commute survey responses (no names required), and company operational details provided during onboarding.</p>

          <h2>3. Processing commitments</h2>
          <p>Data is processed only to deliver the contracted service; never sold; never used to train models; never shared except with the subprocessors listed in the <Link href="/security">security overview</Link>. Cross-client learning is limited to vendor-to-category mappings that contain no client quantities, prices, or totals.</p>

          <h2>4. Security</h2>
          <p>Encryption at rest and in transit, role-verified access on every request, and a complete audit log of data changes, as described in the security overview.</p>

          <h2>5. Deletion and return</h2>
          <p>On request, all controller data is exported to the controller and deleted from production systems within 30 days, with written confirmation.</p>

          <h2>6. Tool, not advice</h2>
          <p>Sendrow provides calculation and document-production tooling. Professional judgment on methodology, materiality, and regulatory interpretation remains with the Consultant or the Client&rsquo;s qualified advisor.</p>
        </div>
      </div>
    </MarketingPage>
  );
}
