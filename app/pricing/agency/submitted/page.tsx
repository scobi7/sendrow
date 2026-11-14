import { MarketingPage, PageHead, ButtonLink } from "@/components/marketing/parts";

export default function AgencySubmittedPage() {
  return (
    <MarketingPage>
      <PageHead
        title="Thanks, we have your request"
        lede={<>We received your quote request and will get back to you. In the meantime, look around.</>}
      >
        <ButtonLink href="/for-consultants">See the consultant platform</ButtonLink>
        <ButtonLink href="/" variant="secondary">Back to home</ButtonLink>
      </PageHead>
    </MarketingPage>
  );
}
