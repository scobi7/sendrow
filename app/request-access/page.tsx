import { Suspense } from "react";
import { Waitlist } from "@clerk/nextjs";
import { MarketingPage, PageHead, Section, mk } from "@/components/marketing/parts";

export const metadata = { title: "Request access: Sendrow" };

/** Sign-up is in Clerk's Waitlist mode: an email entered here lands in the Clerk dashboard's
 *  Waitlist tab, and an invite from there (or from Users > Invitations) lets the person sign up. */
export default function RequestAccessPage() {
  return (
    <MarketingPage>
      <PageHead
        title="Request access"
        lede="Sendrow is invite-only while we work with our first consultants. Leave your email and we'll get back to you."
      />

      <Section>
        <div className="flex flex-col gap-6" style={{ maxWidth: 480 }}>
          <Suspense fallback={<div className="rounded" style={{ background: "var(--card)", minHeight: 220 }} />}>
            <Waitlist
              signInUrl="/login"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  cardBox: "w-full",
                  // The page heading already says what this is.
                  header: { display: "none" },
                },
              }}
            />
          </Suspense>
          <p className={mk.meta}>
            Got a data request from your consultant? You don&rsquo;t need an account. Open the link in their email to
            upload your files.
          </p>
        </div>
      </Section>
    </MarketingPage>
  );
}
