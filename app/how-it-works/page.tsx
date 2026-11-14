import { MarketingPage, PageHead, Section, Band, Close, ButtonLink, mk } from "@/components/marketing/parts";

export const metadata = {
  title: "How it works: Sendrow",
  description:
    "Your emissions data, collected once, proven, and shared anywhere. One trusted record instead of a pile of email threads.",
};

const STEPS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Your consultant asks in plain English",
    body: (
      <>
        Your consultant picks exactly what&apos;s needed, such as &ldquo;your last 12 electricity
        bills,&rdquo; &ldquo;gallons of diesel in 2025&rdquo;, and Sendrow turns it into a
        checklist written for humans, not accountants.
      </>
    ),
  },
  {
    title: "You answer from your inbox",
    body: (
      <>
        One email, one link. <strong>No account, no password, no portal to learn.</strong> Upload
        the bills, type in the numbers. It all lands in the right place.
      </>
    ),
  },
  {
    title: "Every number gets its receipt",
    body: (
      <>
        Each figure is stapled to the bill, invoice, or receipt it came from. When anyone later
        asks &ldquo;where did this number come from?&rdquo; the answer is one click away.
      </>
    ),
  },
  {
    title: "Your consultant signs off and the data is frozen",
    body: (
      <>
        Your consultant reviews, fixes, and approves. Approved data is locked into a dated
        snapshot. Nobody can quietly change shared numbers later. If something is ever
        corrected, everyone who received the old version is told exactly what changed.
      </>
    ),
  },
  {
    title: "Answer once, share it in any format",
    body: (
      <>
        California SB 253, CDP, a customer&apos;s questionnaire, plain Excel: the same approved
        snapshot, reshaped per request. When the <em>next</em> customer asks, it&apos;s done
        before lunch. You decide what gets shared: this snapshot, to this company, in this
        format, and nothing more.
      </>
    ),
  },
];

const PROMISES: { title: string; body: string }[] = [
  { title: "We never grade you.", body: "There are no scores and no report cards." },
  {
    title: "We never replace your consultant.",
    body: "We're the tool you both use together.",
  },
  {
    title: "Your data is yours.",
    body: "Export everything (Excel, a PACT-formatted draft, your full audit trail) anytime, and take it with you.",
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingPage>
      <PageHead
        title="Your emissions data, collected once, proven, and shared anywhere."
        lede="One trusted record instead of email threads and conflicting spreadsheets."
      />

      <Section>
        <ol className={mk.steps}>
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <h3 className={mk.stepH}>
                {i + 1}. {step.title}
              </h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Band>
        <Section title="Three promises we put in writing">
          <ul className={mk.rows}>
            {PROMISES.map((p) => (
              <li key={p.title}>
                <span className={mk.rowTitle}>{p.title}</span>
                <span>{p.body}</span>
              </li>
            ))}
          </ul>
        </Section>
      </Band>

      <Close
        title="Already have a request?"
        actions={
          <>
            <ButtonLink href="/get-matched">Get matched</ButtonLink>
            <ButtonLink href="/for-consultants" variant="secondary">
              For consultants
            </ButtonLink>
          </>
        }
      >
        Open the link in your consultant&rsquo;s email. You don&rsquo;t need an account. No consultant
        yet? We can introduce you to one.
      </Close>
    </MarketingPage>
  );
}
