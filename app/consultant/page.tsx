import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, consultantClients, dataRequests, intakeSessions, snapshots } from "@/lib/db/schema";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { StatCard, StatusBadge, CompletenessMeter } from "@/components/workflow";
import { archiveClient, deleteClient } from "@/lib/actions";
import { DeleteClientButton } from "./delete-client-button";
import { workflowStatus, nextDueDate, completenessPercent, type WorkflowStatus } from "@/lib/client-status";
import type { ChecklistItem } from "@/lib/portal";

const FILTER_STATUS: Record<string, WorkflowStatus> = {
  overdue: "overdue",
  ready: "ready_for_review",
  awaiting: "awaiting_reply",
};

/** Consultant Dashboard (#19): home screen, logs in here first. */
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

  const [rows, requests, sessions, snapshotRows] = ids.length
    ? await Promise.all([
        db.select().from(companies).where(inArray(companies.id, ids)),
        db.select().from(dataRequests).where(inArray(dataRequests.companyId, ids)).orderBy(desc(dataRequests.createdAt)),
        db
          .select({ companyId: intakeSessions.companyId, status: intakeSessions.status })
          .from(intakeSessions)
          .where(inArray(intakeSessions.companyId, ids)),
        db.select({ companyId: snapshots.companyId }).from(snapshots).where(inArray(snapshots.companyId, ids)),
      ])
    : [[], [], [], []];

  const clients = rows.map((row) => {
    const reqs = requests.filter((r) => r.companyId === row.id);
    const input = {
      openRequests: reqs
        .filter((r) => r.status === "open")
        .map((r) => ({ dueDate: r.dueDate, checklist: r.checklist as ChecklistItem[] | null })),
      fulfilledRequests: reqs
        .filter((r) => r.status === "fulfilled")
        .map((r) => ({ checklist: r.checklist as ChecklistItem[] | null })),
      pendingReviewCount: sessions.filter(
        (s) => s.companyId === row.id && (s.status === "pending_review" || s.status === "needs_info")
      ).length,
      hasSnapshot: snapshotRows.some((s) => s.companyId === row.id),
      hasFulfilledRequest: reqs.some((r) => r.status === "fulfilled"),
    };
    return {
      row,
      status: workflowStatus(input),
      due: nextDueDate(input),
      completeness: completenessPercent(input),
    };
  });

  const counts = {
    overdue: clients.filter((c) => c.status === "overdue").length,
    ready: clients.filter((c) => c.status === "ready_for_review").length,
    awaiting: clients.filter((c) => c.status === "awaiting_reply").length,
  };

  const activeFilter = rawFilter && FILTER_STATUS[rawFilter] ? rawFilter : null;
  const displayed = activeFilter ? clients.filter((c) => c.status === FILTER_STATUS[activeFilter]) : clients;
  const fmtDue = (d: string | null) =>
    d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {clients.length} active client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/consultant/requests/new" className="btn btn-primary">
          + New request
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Overdue" value={counts.overdue} tone="danger" active={activeFilter === "overdue"}
          href={activeFilter === "overdue" ? "/consultant" : "/consultant?filter=overdue"} />
        <StatCard label="Ready to review" value={counts.ready} tone="primary" active={activeFilter === "ready"}
          href={activeFilter === "ready" ? "/consultant" : "/consultant?filter=ready"} />
        <StatCard label="Awaiting response" value={counts.awaiting} tone="warning" active={activeFilter === "awaiting"}
          href={activeFilter === "awaiting" ? "/consultant" : "/consultant?filter=awaiting"} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Your clients
        </h2>
        {activeFilter && (
          <Link href="/consultant" className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
            Show all
          </Link>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="card py-12 text-center" style={{ color: "var(--text-muted)" }}>
          {activeFilter ? (
            "No clients in this state right now."
          ) : (
            <>
              No clients yet.{" "}
              <Link href="/consultant/clients/new" className="underline" style={{ color: "var(--primary)" }}>
                Add your first client
              </Link>{" "}
              to get started.
            </>
          )}
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs font-semibold uppercase tracking-wide"
                style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}
              >
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Completeness</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayed.map(({ row, status, due, completeness }) => (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--divider)" }}>
                  <td className="px-4 py-3.5">
                    <Link href={`/consultant/clients/${row.id}`} className="block transition-opacity hover:opacity-70">
                      <p className="font-medium" style={{ color: "var(--text)" }}>{row.name}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {row.clientContactEmail ?? "no contact set"}
                      </p>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-4 py-3.5 font-data text-xs" style={{ color: due && new Date(due + "T23:59:59") < new Date() ? "var(--danger)" : "var(--text)" }}>
                    {fmtDue(due)}
                  </td>
                  <td className="px-4 py-3.5">
                    <CompletenessMeter percent={completeness} compact />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/consultant/clients/${row.id}`} className="btn btn-secondary px-3 py-1 text-xs">
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
