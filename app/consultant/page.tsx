import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { loadCompany } from "@/lib/store";
import { totals } from "@/lib/calc";
import { progressPercent } from "@/lib/progress";
import { PageHeader, StatusDot } from "@/components/ui";
import { SectionName } from "@/lib/types";

const SECTION_LABELS: Record<SectionName, string> = {
  connections: "Connections",
  scope1: "Scope 1",
  scope2: "Scope 2",
  scope3: "Scope 3",
  social: "Social",
  governance: "Gov.",
  reports: "Reports",
};

const DATA_SECTIONS: SectionName[] = ["connections", "scope1", "scope2", "scope3", "social", "governance"];

export default async function ConsultantDashboard({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const [{ filter: rawFilter }, rawUser] = await Promise.all([searchParams, currentUser()]);
  const user = rawUser!;

  const activeLinks = await db
    .select()
    .from(consultantClients)
    .where(eq(consultantClients.consultantId, user.id));

  const filtered_links = activeLinks.filter((cc) => !cc.archivedAt);

  const clientResults = await Promise.allSettled(
    filtered_links.map(async (link) => {
      const company = await loadCompany(link.companyId);
      const pct = progressPercent(company);
      const t = totals(company);
      const needsAttention = DATA_SECTIONS.some((s) => company.sectionStatus[s] === "not_started");
      return { company, pct, t, needsAttention };
    })
  );

  const clients = clientResults
    .filter((r): r is PromiseFulfilledResult<{ company: Awaited<ReturnType<typeof loadCompany>>; pct: number; t: ReturnType<typeof totals>; needsAttention: boolean }> => r.status === "fulfilled")
    .map((r) => r.value);

  const showFilter = rawFilter === "attention";
  const displayed = showFilter ? clients.filter((c) => c.needsAttention) : clients;
  const attentionCount = clients.filter((c) => c.needsAttention).length;
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start justify-between">
        <PageHeader
          title={`Welcome back, ${user.name.split(" ")[0]}`}
          subtitle={`${clients.length} active client${clients.length !== 1 ? "s" : ""}`}
        />
        <Link href="/consultant/clients/new" className="btn-primary">
          + Add Client
        </Link>
      </div>

      {attentionCount > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <Link
            href={showFilter ? "/consultant" : "/consultant?filter=attention"}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              showFilter
                ? "bg-amber-500 text-white"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            ⚠ {attentionCount} Needs Attention
          </Link>
          {showFilter && (
            <Link href="/consultant" className="text-xs text-slate-400 hover:underline">
              Show all
            </Link>
          )}
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="card py-12 text-center text-slate-400">
          {showFilter
            ? "No clients need attention right now."
            : "No clients yet. Add your first client to get started."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Client</th>
                {DATA_SECTIONS.map((s) => (
                  <th key={s} className="px-2 py-3 text-center">
                    {SECTION_LABELS[s]}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Total CO2e</th>
                <th className="px-4 py-3 text-right">Progress</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map(({ company, pct, t, needsAttention }) => (
                <tr key={company.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {needsAttention && (
                        <span className="h-2 w-2 rounded-full bg-amber-400" title="Needs attention" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{company.name}</p>
                        <p className="text-xs text-slate-400">{company.industry ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  {DATA_SECTIONS.map((s) => (
                    <td key={s} className="px-2 py-3 text-center">
                      <span className="inline-flex justify-center">
                        <StatusDot status={company.sectionStatus[s]} />
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {fmt(t.total)} t
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-xs font-semibold ${
                        pct === 100 ? "text-emerald-600" : pct > 50 ? "text-amber-600" : "text-slate-400"
                      }`}
                    >
                      {pct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/consultant/clients/${company.id}`}
                      className="btn-secondary px-3 py-1 text-xs"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
