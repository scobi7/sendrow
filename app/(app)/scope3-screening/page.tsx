import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { scope3Screening } from "@/lib/db/schema";
import { currentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ScreeningForm } from "./screening-form";
import { SCOPE3_CATEGORIES } from "./categories";

export default async function Scope3ScreeningPage() {
  const user = await currentUser();
  const companyId = user!.companyId;

  const saved = await db
    .select()
    .from(scope3Screening)
    .where(eq(scope3Screening.companyId, companyId));

  const savedMap = Object.fromEntries(saved.map((r) => [r.categoryNumber, r]));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Scope 3 Screening"
        subtitle="Mark which categories are relevant to your operations. Excluded categories stay in the report with your reasoning."
      />
      <ScreeningForm companyId={companyId} categories={SCOPE3_CATEGORIES} savedMap={savedMap} />
    </div>
  );
}
