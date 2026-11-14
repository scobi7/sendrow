import { fmtShortDate } from "@/lib/format";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, consultantClients, dataRequests, intakeSessions, snapshots } from "@/lib/db/schema";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { StatCard, StatusBadge, CompletenessMeter } from "@/components/workflow";
import { archiveClient, deleteClient } from "@/lib/actions";
import { DeleteClientButton } from "./delete-client-button";
import { UndoToast } from "@/components/undo-toast";
import { workflowStatus, nextDueDate, completenessPercent, type WorkflowStatus } from "@/lib/client-status";
import type { ChecklistItem } from "@/lib/portal";
import { DeadlineStrip } from "@/components/deadline-strip";

const GET_STARTED: { title: string; description: string; link?: { href: string; label: string } }[] = [
  {
    title: "Add your brand",
    description: "Your logo and color go on every request, portal page and report.",
    link: { href: "/consultant/settings", label: "Open settings" },
  },
  {
    title: "Add a client",
    description: "The company you are collecting emissions data from.",
    link: { href: "/consultant/clients/new", label: "Add client" },
  },
  {
    title: "Send a data request",
    description: "Your client gets one link, no account needed.",
    link: { href: "/consultant/requests/new", label: "New request" },
  },
  {
    title: "Review and freeze a snapshot",
    description: "Approve what comes back, then share a dated, read-only version.",
  },
];

const FILTER_STATUS: Record<string, WorkflowStatus> = {
  overdue: "overdue",
  ready: "ready_for_review",
  awaiting: "awaiting_reply",
};

/** Consultant Dashboard (#19): home screen, logs in here first. */
export default async function ConsultantDashboard({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; archived?: string }>;
}) {
  const [{ filter: rawFilter, archived: rawArchived }, rawUser] = await Promise.all([searchParams, currentUser()]);
  const user = rawUser!;

  // Name for the Undo toast. Looked up only through this consultant's own link
  // (archived rows included), so another consultant's client name never shows.
  const undoTarget = rawArchived
    ? (
        await db
          .select({ companyId: companies.id, name: companies.name })
          .from(consultantClients)
          .innerJoin(companies, eq(companies.id, consultantClients.companyId))
          .where(and(eq(consultantClients.consultantId, user.id), eq(consultantClients.companyId, rawArchived)))
          .limit(1)
      )[0]
    : undefined;

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
    d ? fmtShortDate(new Date(d + "T12:00:00")) : "None";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>
            Clients
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {clients.length} active client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/consultant/clients/new" className="btn btn-secondary">
            Add client
          </Link>
          <Link href="/consultant/requests/new" className="btn btn-primary">
            New request
          </Link>
        </div>
      </div>

      <DeadlineStrip today={new Date().toISOString().slice(0, 10)} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
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
        activeFilter ? (
          <div className="card py-12 text-center" style={{ color: "var(--text-muted)" }}>
            No clients in this state right now.
          </div>
        ) : (
          <div className="card p-6">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Get started</h2>
            <ol className="mt-4 list-none divide-y p-0" style={{ borderColor: "var(--divider)" }}>
              {GET_STARTED.map((step, i) => (
                <li key={step.title} className="flex items-start gap-4 py-3">
                  <span className="font-data text-sm" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{step.title}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{step.description}</p>
                  </div>
                  {step.link && (
                    <Link href={step.link.href} className="btn btn-secondary shrink-0 px-3 py-1 text-xs">
                      {step.link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )
      ) : (
        <div className="glass-panel overflow-x-auto">
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

      {undoTarget && <UndoToast companyId={undoTarget.companyId} name={undoTarget.name} />}
    </div>
  );
}
