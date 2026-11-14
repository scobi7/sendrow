import { MarketingPage, PageHead, Section, Band, Sheet, ButtonLink, Close, mk } from "@/components/marketing/parts";

const ROWS = [
  {
    title: "Client list",
    text: "Every client, how far their current request has got, and which ones need you next.",
  },
  {
    title: "Requests",
    text: "Pick what you need from each client: electricity and gas, fleet fuel, spend, travel or a commute survey. Start from a saved template.",
  },
  {
    title: "Client portal",
    text: "Your client opens one link and uploads bills, invoices or spreadsheets, or types the figures in. No account.",
  },
  {
    title: "Reminders",
    text: "Sendrow sends reminders until your client finishes.",
  },
  {
    title: "Review",
    text: "Each row shows its source document, the factor (name, value, source and year) and the formula. Fix or exclude a row and Sendrow logs the change.",
  },
  {
    title: "Snapshots",
    text: "Approve a dated snapshot and share it as a PDF in your brand, an Excel export that adds up to the totals, or a read-only link. A correction makes a new version and alerts everyone who had the old one.",
  },
  {
    title: "Questionnaire formats",
    text: "Fill CDP, EcoVadis and Walmart questionnaire fields from an approved snapshot.",
  },
  {
    title: "Deadlines",
    text: "A calendar of SB 253, CDP and EcoVadis dates, each with its source.",
  },
  {
    title: "Your brand",
    text: "Your logo and color on requests, the portal, emails and the PDF, with a small “Powered by Sendrow” line at the bottom.",
  },
];

export default function ForConsultants() {
  return (
    <MarketingPage>
      <PageHead
        title="Every client&rsquo;s emissions data, in one workspace."
        lede="Send each client a request, see who has answered, check every figure against its bill, and deliver a dated snapshot under your own brand."
      >
        <ButtonLink href="/signup">Get started</ButtonLink>
        <ButtonLink href="/demo" variant="secondary">Book a demo</ButtonLink>
      </PageHead>

      <Section title="What&rsquo;s in the workspace">
        <ul className={mk.rows}>
          {ROWS.map(({ title, text }) => (
            <li key={title}>
              <span className={mk.rowTitle}>{title}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Band>
        <Section title="Pricing" id="pricing">
          <div style={{ maxWidth: 720 }}>
            <Sheet layered>
              <p>We haven&rsquo;t published prices yet. Tell us about your practice and we&rsquo;ll send you a quote.</p>
              <div style={{ marginTop: 24 }}>
                <ButtonLink href="/pricing/agency">Get a quote</ButtonLink>
              </div>
            </Sheet>
          </div>
        </Section>
      </Band>

      <Close
        title="Send your first request."
        actions={
          <>
            <ButtonLink href="/signup">Get started</ButtonLink>
            <ButtonLink href="/demo" variant="secondary">Book a demo</ButtonLink>
          </>
        }
      >
        Add your brand, add a client, send the link.
      </Close>
    </MarketingPage>
  );
}
