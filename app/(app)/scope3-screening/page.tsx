import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { scope3Screening } from "@/lib/db/schema";
import { currentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ScreeningForm } from "./screening-form";
import { SCOPE3_CATEGORIES } from "./categories";

export default async function Scope3ScreeningPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await currentUser();
  const companyId = user!.companyId;
  const { from } = await searchParams;
  const fromIntake = from === "intake";

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
      {fromIntake && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ border: "1px solid var(--primary)", background: "var(--primary-tint)", color: "var(--text)" }}
        >
          <span className="font-semibold">One step before your first upload:</span> screen your Scope 3
          categories so we know which emissions to look for in your data. Save your screening below to
          unlock Data Intake.
        </div>
      )}
      <ScreeningForm
        companyId={companyId}
        categories={SCOPE3_CATEGORIES}
        savedMap={savedMap}
        continueHref={fromIntake ? "/intake" : undefined}
      />
    </div>
  );
}
