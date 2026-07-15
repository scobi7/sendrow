import Link from "next/link";
import { Logo } from "@/components/ui";
import { submitReferralLead } from "@/lib/actions";
import { SubmitButton } from "@/components/submit-button";

export default async function GetMatchedPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const { submitted, error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-6 py-16" style={{ background: "var(--bg)" }}>
      <div className="mb-10 flex justify-center"><Link href="/"><Logo /></Link></div>

      {submitted ? (
        <div className="card text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold" style={{ background: "var(--primary-tint)", color: "var(--primary)" }}>✓</div>
          <h1 className="text-xl font-bold font-display" style={{ color: "var(--text)" }}>Request received</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            We&rsquo;ll introduce you to a vetted climate consultant who fits your industry and timeline - usually within two business days.
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-center text-2xl font-extrabold font-display" style={{ color: "var(--text)" }}>
            Get matched with a climate consultant
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            A customer or regulator asking for your emissions data? Tell us what you&rsquo;re facing and we&rsquo;ll connect you with a vetted consultant who handles it end to end - powered by Sendrow behind the scenes.
          </p>

          <form action={submitReferralLead} className="card mt-8 space-y-4">
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
              Free - the consultant pays us a referral fee, not you.
            </p>
          </form>
        </>
      )}
    </main>
  );
}
