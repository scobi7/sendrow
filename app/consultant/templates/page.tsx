import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dataRequests, requestTemplates, consultantClients } from "@/lib/db/schema";
import { and, inArray, isNull } from "drizzle-orm";
import { saveRequestTemplate } from "@/lib/consultant-actions";
import { BackLink } from "@/components/workflow";
import { NewTemplateForm } from "./new-template-form";

const TYPE_LABELS: Record<string, string> = {
  utility_bills: "Electricity & gas",
  fleet_fuel_dollar: "Fleet fuel",
  vendor_invoices: "Spend data",
  business_travel: "Business travel",
  commute_survey: "Commute survey",
};

/** Engagement Templates (#23): a consultant's standard request package,
 *  reused when starting a new request for any client. */
export default async function TemplatesPage() {
  const user = (await currentUser())!;

  const [templates, links] = await Promise.all([
    db.select().from(requestTemplates).where(eq(requestTemplates.consultantId, user.id)).orderBy(desc(requestTemplates.createdAt)),
    db
      .select({ companyId: consultantClients.companyId })
      .from(consultantClients)
      .where(and(eq(consultantClients.consultantId, user.id), isNull(consultantClients.archivedAt))),
  ]);

  // "Used on N clients": requests whose description matches the template name
  const ids = links.map((l) => l.companyId);
  const requests = ids.length
    ? await db
        .select({ companyId: dataRequests.companyId, description: dataRequests.description })
        .from(dataRequests)
        .where(inArray(dataRequests.companyId, ids))
    : [];
  const usedOn = (t: { description: string }) =>
    new Set(requests.filter((r) => r.description === t.description).map((r) => r.companyId)).size;

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink />
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>Engagement templates</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          What to ask for - saved once, reused when starting a new request for any client.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="card mb-6 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No templates yet. Save one below, or tick &ldquo;Save this setup as a template&rdquo; when sending a request.
        </div>
      ) : (
        <div className="mb-6 space-y-3">
          {templates.map((t, i) => {
            const types = (t.dataTypes as string[]) ?? [];
            const clients = usedOn(t);
            return (
              <div key={t.id} className="card flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold" style={{ color: "var(--text)" }}>{t.name}</p>
                    {i === 0 && <span className="badge">Default</span>}
                  </div>
                  <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>
                    {types.length > 0 ? types.map((k) => TYPE_LABELS[k] ?? k).join(", ") : t.description}
                    {t.periodLabel && ` · ${t.periodLabel}`}
                    {t.dueInDays && ` · due in ${t.dueInDays} days`}
                  </p>
                  <p className="mt-1 font-data text-[11px]" style={{ color: "var(--neutral-muted)" }}>
                    Used on {clients} client{clients !== 1 ? "s" : ""}
                  </p>
                </div>
                <Link href={`/consultant/requests/new?template=${t.id}`} className="btn btn-secondary shrink-0 text-xs">
                  Start new request
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <NewTemplateForm action={saveRequestTemplate} />
    </div>
  );
}
