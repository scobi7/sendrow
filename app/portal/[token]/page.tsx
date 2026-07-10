import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dataRequests, companies, emissionLineItems } from "@/lib/db/schema";
import { desc, and } from "drizzle-orm";
import { portalTokenValid } from "@/lib/portal";
import type { ChecklistItem } from "@/lib/portal";
import { PortalChecklist } from "./portal-checklist";
import { getBrandForCompany } from "@/lib/branding";
import { RequestNewLink } from "./request-new-link";

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [request] = await db.select().from(dataRequests).where(eq(dataRequests.token, token));
  const valid = request && portalTokenValid({ token: request.token, expiresAt: request.expiresAt, status: request.status });

  if (!valid) {
    // White-label surface: no Sendrow branding, even on the error state (§11)
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center" style={{ background: "var(--bg)" }}>
        <h1 className="mt-8 text-xl font-bold font-display" style={{ color: "var(--text)" }}>
          This link has expired
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Data upload links are valid for 30 days — but getting a fresh one takes a single click.
        </p>
        <RequestNewLink token={token} />
      </main>
    );
  }

  const [[company], brand, priorRows] = await Promise.all([
    db.select({ name: companies.name }).from(companies).where(eq(companies.id, request.companyId)),
    getBrandForCompany(request.companyId),
    // Prefill from last time (U1.4): the supplier's most recent approved rows
    db
      .select({
        activityDate: emissionLineItems.activityDate,
        rawValue: emissionLineItems.rawValue,
        rawUnit: emissionLineItems.rawUnit,
        calcLog: emissionLineItems.calcLog,
        period: emissionLineItems.period,
      })
      .from(emissionLineItems)
      .where(and(eq(emissionLineItems.companyId, request.companyId), eq(emissionLineItems.status, "mapped")))
      .orderBy(desc(emissionLineItems.createdAt))
      .limit(24),
  ]);
  const prefill = priorRows.map((r) => ({
    date: r.activityDate ?? "",
    activity: String((r.calcLog as { activity_type?: string } | null)?.activity_type ?? ""),
    quantity: String(Number(r.rawValue)),
    unit: r.rawUnit,
    period: r.period,
  }));
  const checklist = (request.checklist as ChecklistItem[] | null) ?? [];
  const received = checklist.filter((i) => i.status === "received").length;

  return (
    <main
      className="mx-auto min-h-screen max-w-2xl px-6 py-12"
      style={{
        background: "var(--bg)",
        ...(brand?.accentColor ? ({ "--primary": brand.accentColor } as React.CSSProperties) : {}),
      }}
    >
      {/* White-label surface: consultant branding, never Sendrow (contracts/ §11) */}
      <div className="mb-10">
        {brand && (
          <div className="mb-6 flex items-center gap-3">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt={brand.brandName} className="h-9 w-auto" />
            ) : (
              <span className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>{brand.brandName}</span>
            )}
          </div>
        )}
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Data request for
        </p>
        <h1 className="mt-1 text-2xl font-extrabold font-display" style={{ color: "var(--text)" }}>
          {company?.name ?? "your company"}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{request.description}</p>
        {request.periodLabel && (
          <p className="mt-1 text-sm font-medium" style={{ color: "var(--text)" }}>
            📅 Data should cover: {request.periodLabel}
          </p>
        )}
        {request.dueDate && (
          <p className="mt-1 text-sm font-medium" style={{ color: "var(--warning)" }}>Due {request.dueDate}</p>
        )}
      </div>

      {request.status === "fulfilled" ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card)" }}>
          <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>✓ All done</p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Everything requested has been received. Your consultant will review it and be in touch.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
            {received} of {checklist.length} item{checklist.length !== 1 ? "s" : ""} received. No account needed — this page is your secure upload link.
          </p>
          <PortalChecklist token={token} items={checklist} prefill={prefill} />
        </>
      )}
    </main>
  );
}
