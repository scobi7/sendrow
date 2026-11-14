import { submitReferralLead } from "@/lib/actions";
import { SubmitButton } from "@/components/submit-button";
import { MarketingPage, PageHead, Section, Sheet } from "@/components/marketing/parts";

export default async function GetMatchedPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { submitted, error } = await searchParams;

  if (submitted) {
    return (
      <MarketingPage>
        <PageHead
          title="Request received"
          lede={<>We&rsquo;ll introduce you to a vetted climate consultant who fits your industry and timeline.</>}
        />
      </MarketingPage>
    );
  }

  return (
    <MarketingPage>
      <PageHead
        title="Get matched with a climate consultant"
        lede={
          <>
            A customer or regulator asking for your emissions data? Tell us what you&rsquo;re facing and we&rsquo;ll
            connect you with a vetted consultant who handles it end to end, powered by Sendrow.
          </>
        }
      />

      <Section>
        <div style={{ maxWidth: 720 }}>
          <Sheet layered>
            <form action={submitReferralLead} className="space-y-4">
              {error && (
                <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--danger-tint)", color: "var(--danger)" }}>{error}</p>
              )}
              <div>
                <label className="label">Your name</label>
                <input name="name" className="input" required />
              </div>
              <div>
                <label className="label">Work email</label>
                <input name="email" type="email" className="input" required />
              </div>
              <div>
                <label className="label">Company</label>
                <input name="company" className="input" required />
              </div>
              <div>
                <label className="label">What prompted this? (optional)</label>
                <textarea
                  name="trigger"
                  rows={3}
                  className="input resize-none"
                  placeholder="e.g. Our biggest customer sent us a CDP questionnaire due in October"
                />
              </div>
              <SubmitButton className="btn btn-primary w-full" pendingText="Sending…">
                Request an introduction
              </SubmitButton>
              <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                The consultant pays us a referral fee, not you.
              </p>
            </form>
          </Sheet>
        </div>
      </Section>
    </MarketingPage>
  );
}
