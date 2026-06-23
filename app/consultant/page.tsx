import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { loadCompany } from "@/lib/store";
import { totals } from "@/lib/calc";
import { progressPercent } from "@/lib/progress";
import { PageHeader, StatusDot } from "@/components/ui";
import { SectionName } from "@/lib/types";
import { archiveClient, deleteClient } from "@/lib/actions";

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

  const filtered_links = await db
    .select()
    .from(consultantClients)
    .where(and(eq(consultantClients.consultantId, user.id), isNull(consultantClients.archivedAt)));

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
        <Link href="/consultant/clients/new" className="btn btn-primary">
          + Add Client
        </Link>
      </div>

      {attentionCount > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <Link
            href={showFilter ? "/consultant" : "/consultant?filter=attention"}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={
              showFilter
                ? { background: "var(--warning)", color: "#fff" }
                : { background: "var(--warning-tint)", color: "var(--warning)" }
            }
          >
            {attentionCount} Needs Attention
          </Link>
          {showFilter && (
            <Link
              href="/consultant"
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              Show all
            </Link>
          )}
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="card py-12 text-center" style={{ color: "var(--text-muted)" }}>
          {showFilter
            ? "No clients need attention right now."
            : "No clients yet. Add your first client to get started."}
        </div>
      ) : (
        <div
          className="overflow-hidden"
          style={{
            borderRadius: "var(--radius-lg)",
            background: "var(--card)",
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs font-semibold uppercase tracking-wide"
                style={{ borderBottom: "1px solid var(--divider)", background: "var(--card)", color: "var(--text-muted)" }}
              >
                <th className="px-4 py-3">Client</th>
                {DATA_SECTIONS.map((s) => (
                  <th key={s} className="px-2 py-3 text-center">{SECTION_LABELS[s]}</th>
                ))}
                <th className="px-4 py-3 text-right">Total CO2e</th>
                <th className="px-4 py-3 text-right">Progress</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayed.map(({ company, pct, t, needsAttention }) => (
                <tr
                  key={company.id}
                  style={{ borderBottom: "1px solid var(--divider)" }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {needsAttention && (
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          title="Needs attention"
                          style={{ background: "var(--warning)" }}
                        />
                      )}
                      <div>
                        <p className="font-medium" style={{ color: "var(--text)" }}>{company.name}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{company.industry ?? "—"}</p>
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
                  <td className="px-4 py-3 text-right font-medium font-data" style={{ color: "var(--text)" }}>
                    {fmt(t.total)} t
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="text-xs font-semibold font-data"
                      style={{
                        color: pct === 100 ? "var(--status-green)" : pct > 50 ? "var(--warning)" : "var(--text-muted)",
                      }}
                    >
                      {pct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/consultant/clients/${company.id}`}
                        className="btn btn-secondary px-3 py-1 text-xs"
                      >
                        View
                      </Link>
                      <form action={archiveClient.bind(null, company.id)}>
                        <button className="px-2 py-1 text-xs transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Archive">
                          Archive
                        </button>
                      </form>
                      <form action={deleteClient.bind(null, company.id)} onSubmit={(e) => { if (!confirm(`Permanently delete ${company.name}? This cannot be undone.`)) e.preventDefault(); }}>
                        <button className="px-2 py-1 text-xs transition-opacity hover:opacity-70" style={{ color: "var(--danger)" }} title="Delete">
                          Delete
                        </button>
                      </form>
                    </div>
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
