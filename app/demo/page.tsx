export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { sendDemoRequest } from "@/lib/email";
import { clientIp, checkRateLimit } from "@/lib/ratelimit";
import { MarketingPage, PageHead, Section, Sheet, ButtonLink, mk } from "@/components/marketing/parts";

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL || "";

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;

  async function requestDemo(formData: FormData) {
    "use server";
    const ip = await clientIp();
    if (!checkRateLimit(`demo:${ip}`)) redirect("/demo?error=rate_limit");
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const company = String(formData.get("company") ?? "").trim();
    if (!name || !email || !company) redirect("/demo?error=1");
    await sendDemoRequest(name, email, company);
    redirect("/demo?submitted=1");
  }

  if (submitted) {
    return (
      <MarketingPage>
        <PageHead
          title="Request received"
          lede={CALENDLY_URL ? "We'll be in touch shortly. Or pick a time right now:" : "We'll be in touch shortly."}
        >
          {CALENDLY_URL && (
            <ButtonLink href={CALENDLY_URL} external>
              Book a time
            </ButtonLink>
          )}
        </PageHead>
        <Section>
          <Link href="/" className={mk.link}>
            Back to home
          </Link>
        </Section>
      </MarketingPage>
    );
  }

  return (
    <MarketingPage>
      <PageHead
        title="Request a demo"
        lede={<>We&rsquo;ll show you how Sendrow handles a real questionnaire end to end.</>}
      />

      <Section>
        <div style={{ maxWidth: 720 }}>
          <Sheet layered>
            <form action={requestDemo} className="space-y-4">
              <div>
                <label className="label">Your name</label>
                <input name="name" required className="input" placeholder="Alex Johnson" />
              </div>
              <div>
                <label className="label">Work email</label>
                <input name="email" type="email" required className="input" placeholder="alex@company.com" />
              </div>
              <div>
                <label className="label">Company name</label>
                <input name="company" required className="input" placeholder="Pacific Coast Logistics" />
              </div>
              <SubmitButton className="btn btn-primary w-full py-3 mt-2" pendingText="Sending...">
                Request demo
              </SubmitButton>
            </form>
            {CALENDLY_URL && (
              <p className={`${mk.meta} text-center`}>
                Prefer to pick a time directly?{" "}
                <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className={mk.link}>
                  Book on Calendly
                </a>
              </p>
            )}
            <p className={`${mk.meta} text-center`}>
              Rather sign up directly?{" "}
              <Link href="/signup" className={mk.link}>
                Get started
              </Link>
            </p>
          </Sheet>
        </div>
      </Section>
    </MarketingPage>
  );
}
