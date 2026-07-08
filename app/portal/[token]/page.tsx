import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dataRequests, companies } from "@/lib/db/schema";
import { portalTokenValid } from "@/lib/portal";
import type { ChecklistItem } from "@/lib/portal";
import { PortalChecklist } from "./portal-checklist";
import { getBrandForCompany } from "@/lib/branding";

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
          Data upload links are valid for 30 days. Please ask your consultant to send a new one.
        </p>
      </main>
    );
  }

  const [[company], brand] = await Promise.all([
    db.select({ name: companies.name }).from(companies).where(eq(companies.id, request.companyId)),
    getBrandForCompany(request.companyId),
  ]);
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
          <PortalChecklist token={token} items={checklist} />
        </>
      )}
    </main>
  );
}
