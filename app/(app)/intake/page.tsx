import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mappingProfiles, emissionLineItems, scope3Screening } from "@/lib/db/schema";
import { currentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";

export default async function IntakePage() {
  const user = await currentUser();
  const companyId = user!.companyId;

  const [profiles, lineItems, screening] = await Promise.all([
    db.select().from(mappingProfiles).where(eq(mappingProfiles.companyId, companyId)),
    db.select({ id: emissionLineItems.id }).from(emissionLineItems).where(eq(emissionLineItems.companyId, companyId)),
    db.select({ id: scope3Screening.id }).from(scope3Screening).where(eq(scope3Screening.companyId, companyId)).limit(1),
  ]);

  // Onboarding gate: boundary + screening must exist before first upload (soft — screening is one page away)
  if (screening.length === 0) redirect("/scope3-screening?from=intake");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Data Intake"
        subtitle="Upload a spreadsheet to import emissions data. Your column mapping is saved and reused for future uploads."
      />

      <div className="mb-8 flex items-center justify-between">
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          {lineItems.length} line item{lineItems.length !== 1 ? "s" : ""} imported
          {lineItems.length > 0 && (
            <> · <Link href="/workpaper" className="underline" style={{ color: "var(--primary)" }}>View workpaper</Link></>
          )}
        </div>
        <Link href="/intake/upload" className="btn btn-primary text-sm px-5 py-2">
          Upload spreadsheet
        </Link>
      </div>

      {profiles.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ border: "1px dashed var(--divider)" }}
        >
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>No imports yet</p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Upload a CSV or Excel file to get started. Any column format works.
          </p>
          <Link href="/intake/upload" className="btn btn-primary mt-6 inline-block px-6">
            Upload your first spreadsheet
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Saved mapping profiles
          </h2>
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl px-5 py-4"
              style={{ border: "1px solid var(--divider)", background: "var(--card)" }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{p.name}</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  Active from {p.effectiveFrom}
                </p>
              </div>
              <Link
                href={`/intake/upload?profile=${p.id}`}
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ background: "var(--primary-tint)", color: "var(--primary)" }}
              >
                Upload with this profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
