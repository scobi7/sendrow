import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, consultantClients, dataRequests, emissionLineItems, intakeSessions, pipelineStatus } from "@/lib/db/schema";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { loadCompany } from "@/lib/store";
import { totals } from "@/lib/calc";
import { PageHeader } from "@/components/ui";
import { archiveClient, deleteClient } from "@/lib/actions";
import { DeleteClientButton } from "./delete-client-button";
import type { ChecklistItem } from "@/lib/portal";

const PIPELINE_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  locked: "Locked",
};

export default async function ConsultantDashboard({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const [{ filter: rawFilter }, rawUser] = await Promise.all([searchParams, currentUser()]);
  const user = rawUser!;

  const links = await db
    .select()
    .from(consultantClients)
    .where(and(eq(consultantClients.consultantId, user.id), isNull(consultantClients.archivedAt)));
  const ids = links.map((l) => l.companyId);

  const [rows, requests, pipelines, unmapped, sessions] = ids.length
    ? await Promise.all([
        db.select().from(companies).where(inArray(companies.id, ids)),
        db.select().from(dataRequests).where(inArray(dataRequests.companyId, ids)),
        db.select().from(pipelineStatus).where(inArray(pipelineStatus.companyId, ids)),
        db
          .select({ companyId: emissionLineItems.companyId, id: emissionLineItems.id })
          .from(emissionLineItems)
          .where(and(inArray(emissionLineItems.companyId, ids), eq(emissionLineItems.status, "unmapped"))),
        db
          .select({ companyId: intakeSessions.companyId, status: intakeSessions.status, createdAt: intakeSessions.createdAt })
          .from(intakeSessions)
          .where(inArray(intakeSessions.companyId, ids))
          .orderBy(desc(intakeSessions.createdAt)),
      ])
    : [[], [], [], [], []];

  const clientResults = await Promise.allSettled(
    rows.map(async (row) => {
      const company = await loadCompany(row.id);
      const t = totals(company);

      const reqs = requests.filter((r) => r.companyId === row.id);
      const openReqs = reqs.filter((r) => r.status === "open");
      let itemsReceived = 0;
      let itemsTotal = 0;
      for (const r of openReqs) {
        const checklist = (r.checklist as ChecklistItem[] | null) ?? [];
        itemsTotal += checklist.length;
        itemsReceived += checklist.filter((i) => i.status === "received").length;
      }

      const pipeline = pipelines.find((p) => p.companyId === row.id)?.status ?? "not_started";
      const unmappedCount = unmapped.filter((u) => u.companyId === row.id).length;
      const clientSessions = sessions.filter((s) => s.companyId === row.id);
      const pendingReview = clientSessions.filter((s) => s.status === "pending_review" || s.status === "needs_info").length;
      const lastActivity = clientSessions[0]?.createdAt ?? reqs[0]?.createdAt ?? null;
      const needsAttention = unmappedCount > 0 || pendingReview > 0 || !row.clientContactEmail;

      return { row, t, openReqs: openReqs.length, itemsReceived, itemsTotal, pipeline, unmappedCount, pendingReview, lastActivity, needsAttention };
    })
  );

  const clients = clientResults
    .filter((r): r is PromiseFulfilledResult<Extract<typeof r, { status: "fulfilled" }>["value"]> => r.status === "fulfilled")
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
          style={{ borderRadius: "var(--radius-lg)", background: "var(--card)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs font-semibold uppercase tracking-wide"
                style={{ borderBottom: "1px solid var(--divider)", background: "var(--card)", color: "var(--text-muted)" }}
              >
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Pipeline</th>
                <th className="px-4 py-3">Open requests</th>
                <th className="px-4 py-3 text-center">To review</th>
                <th className="px-4 py-3 text-center">Unmapped</th>
                <th className="px-4 py-3 text-right">Total CO2e</th>
                <th className="px-4 py-3 text-right">Last activity</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayed.map(({ row, t, openReqs, itemsReceived, itemsTotal, pipeline, unmappedCount, pendingReview, lastActivity, needsAttention }) => (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--divider)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {needsAttention && (
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          title={!row.clientContactEmail ? "No client contact email" : "Needs attention"}
                          style={{ background: "var(--warning)" }}
                        />
                      )}
                      <div>
                        <p className="font-medium" style={{ color: "var(--text)" }}>{row.name}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {row.clientContactEmail ?? "no contact set"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={
                        pipeline === "locked"
                          ? { background: "var(--primary-tint)", color: "var(--primary)" }
                          : pipeline === "in_progress"
                            ? { background: "var(--warning-tint)", color: "var(--warning-strong)" }
                            : { background: "var(--divider)", color: "var(--text-muted)" }
                      }
                    >
                      {PIPELINE_LABEL[pipeline] ?? pipeline}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {openReqs === 0 ? (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text)" }}>
                        {openReqs} open{itemsTotal > 0 ? ` · ${itemsReceived}/${itemsTotal} items in` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pendingReview > 0 ? (
                      <span className="text-xs font-semibold" style={{ color: "var(--warning-strong)" }}>{pendingReview}</span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {unmappedCount > 0 ? (
                      <span className="text-xs font-semibold" style={{ color: "var(--danger)" }}>{unmappedCount}</span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium font-data" style={{ color: "var(--text)" }}>
                    {fmt(t.total)} t
                  </td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: "var(--text-muted)" }}>
                    {lastActivity ? new Date(lastActivity).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/consultant/clients/${row.id}`}
                        className="btn btn-secondary px-3 py-1 text-xs"
                      >
                        Open
                      </Link>
                      <form action={archiveClient.bind(null, row.id)}>
                        <button className="px-2 py-1 text-xs transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Archive">
                          Archive
                        </button>
                      </form>
                      <DeleteClientButton action={deleteClient.bind(null, row.id)} companyName={row.name} />
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
