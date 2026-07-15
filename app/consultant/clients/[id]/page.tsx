import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, comments, consultantClients, dataRequests, emissionLineItems, evidence, events, intakeSessions, snapshots } from "@/lib/db/schema";
import { archiveClient, updateClientContact } from "@/lib/actions";
import { resendPortalEmail, renewPortalLink, replyToFlag, resolveFlag } from "@/lib/consultant-actions";
import { BackLink, StatusBadge, CompletenessMeter } from "@/components/workflow";
import { workflowStatus, nextDueDate, completenessPercent, STATUS_META } from "@/lib/client-status";
import { PortalLinkButton } from "./portal-link-button";
import type { ChecklistItem } from "@/lib/portal";

/** Client Detail View (#19 #6 #13): clicking into a client from the dashboard
 *  table. Requests → Review & Approve (current) or the frozen snapshot (past). */
export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, currentUser()]);

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user!.id),
      eq(consultantClients.companyId, id),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) notFound();

  const [companyRow, requests, sessions, snapshotList, evidenceRows, timeline, commentRows, flaggedItems] = await Promise.all([
    db.select().from(companies).where(eq(companies.id, id)).then((r) => r[0]),
    db.select().from(dataRequests).where(eq(dataRequests.companyId, id)).orderBy(desc(dataRequests.createdAt)),
    db.select({ status: intakeSessions.status }).from(intakeSessions).where(eq(intakeSessions.companyId, id)),
    db.select().from(snapshots).where(eq(snapshots.companyId, id)).orderBy(desc(snapshots.createdAt)),
    db.select({ id: evidence.id }).from(evidence).where(eq(evidence.companyId, id)),
    db.select().from(events).where(eq(events.companyId, id)).orderBy(desc(events.ts)).limit(10),
    db.select().from(comments).where(eq(comments.companyId, id)).orderBy(desc(comments.createdAt)),
    db
      .select({ id: emissionLineItems.id, category: emissionLineItems.category, sourceRef: emissionLineItems.sourceRef })
      .from(emissionLineItems)
      .where(and(eq(emissionLineItems.companyId, id), eq(emissionLineItems.status, "unmapped"))),
  ]);
  if (!companyRow) notFound();

  const statusInput = {
    openRequests: requests
      .filter((r) => r.status === "open")
      .map((r) => ({ dueDate: r.dueDate, checklist: r.checklist as ChecklistItem[] | null })),
    fulfilledRequests: requests
      .filter((r) => r.status === "fulfilled")
      .map((r) => ({ checklist: r.checklist as ChecklistItem[] | null })),
    pendingReviewCount: sessions.filter((s) => s.status === "pending_review" || s.status === "needs_info").length,
    hasSnapshot: snapshotList.length > 0,
    hasFulfilledRequest: requests.some((r) => r.status === "fulfilled"),
  };
  const status = workflowStatus(statusInput);
  const completeness = completenessPercent(statusInput);
  const due = nextDueDate(statusInput);

  const stuckCount = requests
    .filter((r) => r.status === "open")
    .flatMap((r) => (r.checklist as ChecklistItem[] | null) ?? [])
    .filter((c) => c.stuckNote && c.status !== "received").length;
  const flagsOpen = flaggedItems.length + stuckCount;

  // Received checklist items across all requests - "Evidence attached 12 of 12"
  const allChecklist = requests.flatMap((r) => (r.checklist as ChecklistItem[] | null) ?? []);
  const receivedItems = allChecklist.filter((c) => c.status === "received").length;

  const initials = companyRow.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const latestSnapshot = snapshotList[0] ?? null;

  // Comment threads grouped by line item (latest 4 threads)
  const lineLabels = new Map(
    (await db
      .select({ id: emissionLineItems.id, category: emissionLineItems.category, sourceRef: emissionLineItems.sourceRef })
      .from(emissionLineItems)
      .where(eq(emissionLineItems.companyId, id))
    ).map((i) => [i.id, i.sourceRef?.trim() || i.category.replace(/_/g, " ")])
  );
  const threads = new Map<string, typeof commentRows>();
  for (const c of commentRows) {
    if (!c.lineItemId) continue; // checklist-item threads render on the flag cards, not here
    const t = threads.get(c.lineItemId) ?? [];
    t.push(c);
    threads.set(c.lineItemId, t);
  }
  const threadList = [...threads.entries()].slice(0, 4);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink />

      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-data text-sm font-bold text-white"
            style={{ backgroundImage: "linear-gradient(135deg, var(--green), var(--teal))" }}
          >
            {initials}
          </span>
          <div>
            <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>{companyRow.name}</h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
              {companyRow.industry ?? "Industry not set"} ·{" "}
              {companyRow.headcountRange ? `${companyRow.headcountRange.replace(/_/g, "–")} employees` : "headcount not set"} ·{" "}
              {STATUS_META[status].label}
              {due && ` · due ${fmtDate(due + "T12:00:00")}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/consultant/requests/new?client=${id}`} className="btn btn-primary text-sm">
            + New request
          </Link>
          <form action={archiveClient.bind(null, id)}>
            <button className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
              Archive
            </button>
          </form>
        </div>
      </div>

      {/* Stats row: data received & review status */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="card-inner">
          <p className="eyebrow">Completeness</p>
          <p className="mt-2 font-data text-2xl font-bold" style={{ color: "var(--text)" }}>{completeness}%</p>
          <div className="mt-2"><CompletenessMeter percent={completeness} /></div>
        </div>
        <div className="card-inner">
          <p className="eyebrow">Evidence attached</p>
          <p className="mt-2 font-data text-2xl font-bold" style={{ color: "var(--text)" }}>
            {allChecklist.length > 0 ? `${receivedItems} of ${allChecklist.length}` : evidenceRows.length}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {evidenceRows.length} source file{evidenceRows.length !== 1 ? "s" : ""} in the locker
          </p>
        </div>
        <div className="card-inner">
          <p className="eyebrow">Flags open</p>
          <p className="mt-2 font-data text-2xl font-bold" style={{ color: flagsOpen > 0 ? "var(--danger)" : "var(--text)" }}>
            {flagsOpen}
          </p>
          {flagsOpen > 0 && (
            <Link href={`/consultant/clients/${id}/review`} className="mt-1 block text-xs underline" style={{ color: "var(--primary)" }}>
              Resolve in review →
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Requests */}
          <div className="glass-panel">
            <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Requests ({requests.length})
              </p>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                current → Review & Approve · past → frozen snapshot
              </span>
            </div>

            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--divider)", background: companyRow.clientContactEmail ? "transparent" : "var(--warning-tint)" }}>
              {!companyRow.clientContactEmail && (
                <p className="mb-2 text-xs font-medium" style={{ color: "var(--warning-strong)" }}>
                  No supplier contact on file - requests and reminders can&apos;t be emailed.
                </p>
              )}
              <form action={updateClientContact.bind(null, id)} className="flex flex-wrap items-center gap-2">
                <input name="contact_name" defaultValue={companyRow.clientContactName ?? ""} placeholder="Contact name" className="input flex-1 text-xs" style={{ minWidth: "10rem" }} />
                <input name="contact_email" type="email" defaultValue={companyRow.clientContactEmail ?? ""} placeholder="contact@supplier.com" className="input flex-1 text-xs" style={{ minWidth: "12rem" }} />
                <button className="btn btn-secondary shrink-0 px-3 py-1.5 text-xs">Save contact</button>
              </form>
            </div>

            {requests.length === 0 ? (
              <p className="px-5 py-5 text-sm" style={{ color: "var(--text-muted)" }}>
                No requests yet - {" "}
                <Link href={`/consultant/requests/new?client=${id}`} className="underline" style={{ color: "var(--primary)" }}>
                  send the first one
                </Link>
                .
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
                {requests.map((req) => {
                  const checklist = (req.checklist as ChecklistItem[] | null) ?? [];
                  const isOpen = req.status === "open";
                  const target = isOpen
                    ? `/consultant/clients/${id}/review`
                    : latestSnapshot
                      ? `/consultant/clients/${id}/snapshots/${latestSnapshot.id}`
                      : `/consultant/clients/${id}/review`;
                  const expired = req.expiresAt && new Date(req.expiresAt) < new Date() && isOpen;
                  return (
                    <div key={req.id} className="px-5 py-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <Link href={target} className="min-w-0 flex-1 transition-opacity hover:opacity-70">
                          <p className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>{req.description}</p>
                          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                            {req.periodLabel ? `${req.periodLabel} · ` : ""}
                            {req.dueDate ? `due ${fmtDate(req.dueDate + "T12:00:00")} · ` : ""}
                            {checklist.filter((c) => c.status === "received").length}/{checklist.length} items in
                            {expired && <span style={{ color: "var(--danger)" }}> · link expired</span>}
                          </p>
                        </Link>
                        <StatusBadge
                          status={
                            req.status === "fulfilled" ? "approved"
                            : statusInput.pendingReviewCount > 0 && isOpen ? "ready_for_review"
                            : expired || (req.dueDate && new Date(req.dueDate + "T23:59:59") < new Date() && isOpen) ? "overdue"
                            : isOpen ? "awaiting_reply" : "none"
                          }
                        />
                      </div>
                      {checklist.filter((c) => c.stuckNote && c.status !== "received").map((c) => (
                        <div key={c.id} className="mt-2 rounded-lg px-3 py-2.5" style={{ background: "var(--danger-tint)" }}>
                          <p className="text-xs" style={{ color: "var(--danger)" }}>
                            <strong>Flag - {c.label}:</strong> &ldquo;{c.stuckNote}&rdquo;
                          </p>
                          {/* Reply lands on the portal thread + goes out by email (X2) */}
                          <form action={replyToFlag.bind(null, id, req.id, c.id)} className="mt-2 flex items-start gap-2">
                            <textarea
                              name="reply"
                              rows={1}
                              required
                              placeholder="Answer the client - they'll see it on their upload page and by email"
                              className="min-h-[34px] flex-1 rounded-lg px-2.5 py-1.5 text-xs"
                              style={{ background: "var(--card)", border: "1px solid var(--divider)", color: "var(--text)" }}
                            />
                            <button className="btn btn-primary px-3 py-1.5 text-xs">Reply</button>
                          </form>
                          <form action={resolveFlag.bind(null, id, req.id, c.id)} className="mt-1.5">
                            <button className="text-xs underline" style={{ color: "var(--text-muted)" }}>
                              Mark resolved - clears the flag, keeps the thread
                            </button>
                          </form>
                        </div>
                      ))}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {req.token && <PortalLinkButton token={req.token} />}
                        {isOpen && (
                          <Link
                            href={`/consultant/clients/${id}/requests/${req.id}/chasing`}
                            className="rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-70"
                            style={{ background: "var(--divider)", color: "var(--text-muted)" }}
                          >
                            {req.remindersEnabled ? "Chasing on" : "Chasing paused"} · schedule →
                          </Link>
                        )}
                        {expired && (
                          <form action={renewPortalLink.bind(null, req.id, id)}>
                            <button className="rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-70" style={{ background: "var(--danger-tint)", color: "var(--danger)" }}>
                              ↻ Renew link (30 days)
                            </button>
                          </form>
                        )}
                        {req.token && isOpen && companyRow.clientContactEmail && (
                          <form action={resendPortalEmail.bind(null, req.id, id)}>
                            <button className="rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-70" style={{ background: "var(--primary-tint)", color: "var(--primary)" }}>
                              ↻ Resend email
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comment threads (#6) */}
          <div className="glass-panel">
            <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Comment threads</p>
            </div>
            {threadList.length === 0 ? (
              <p className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                No threads yet - comment on any line item in Review & Approve.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
                {threadList.map(([lineItemId, thread]) => {
                  const ordered = [...thread].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
                  const first = ordered[0];
                  const reply = ordered.find((c) => c.authorType !== first.authorType);
                  return (
                    <div key={lineItemId} className="px-5 py-3.5 text-sm">
                      <p style={{ color: "var(--text)" }}>
                        &ldquo;{first.body}&rdquo;{" "}
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          on {lineLabels.get(lineItemId) ?? "a line item"}
                        </span>
                      </p>
                      {reply && (
                        <p className="mt-1.5 rounded-lg px-3 py-2 text-xs" style={{ background: "var(--primary-tint)", color: "var(--text)" }}>
                          Reply from {companyRow.name}: &ldquo;{reply.body}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity timeline (#13) */}
          <div className="glass-panel">
            <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Activity timeline</p>
            </div>
            {timeline.length === 0 ? (
              <p className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>Nothing yet.</p>
            ) : (
              <div className="px-5 py-4">
                <div className="space-y-3">
                  {timeline.map((e) => (
                    <div key={e.id} className="flex items-start gap-3 text-sm">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--emerald)" }} />
                      <p style={{ color: "var(--text)" }}>
                        <span className="font-data text-xs" style={{ color: "var(--text-muted)" }}>{fmtDate(e.ts)}</span>{" "}
 - {eventLabel(e.verb, e.subject)}
                      </p>
                    </div>
                  ))}
                </div>
                <Link href={`/consultant/clients/${id}/activity`} className="mt-3 inline-block text-xs underline" style={{ color: "var(--primary)" }}>
                  Full activity log →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card h-fit">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Review & Approve</h2>
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Every submitted figure, its receipt, and its math - approve to freeze a snapshot.
            </p>
            <Link href={`/consultant/clients/${id}/review`} className="btn btn-primary mt-3 w-full text-sm">
              Open review
            </Link>
            <Link href={`/consultant/clients/${id}/ledger`} className="mt-2 block text-center text-xs underline" style={{ color: "var(--text-muted)" }}>
              Full data ledger →
            </Link>
          </div>

          <div className="card h-fit">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Snapshots</h2>
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Frozen, dated versions - the only thing that ever gets shared.
            </p>
            {snapshotList.length === 0 ? (
              <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>None yet - approve a review to create one.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {snapshotList.slice(0, 5).map((snap) => {
                  const st = snap.totals as { total: number };
                  return (
                    <Link
                      key={snap.id}
                      href={`/consultant/clients/${id}/snapshots/${snap.id}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/40"
                      style={{ border: "1px solid var(--divider)" }}
                    >
                      <span className="truncate text-xs font-semibold" style={{ color: "var(--text)" }}>{snap.label}</span>
                      <span className="ml-2 shrink-0 font-data text-xs" style={{ color: "var(--text)" }}>
                        {st.total.toLocaleString("en-US", { maximumFractionDigits: 1 })} t
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card h-fit">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>More</h2>
            <div className="mt-3 space-y-2 text-xs">
              <Link href={`/consultant/clients/${id}/manage`} className="block underline" style={{ color: "var(--text-muted)" }}>
                Enter data on behalf →
              </Link>
              <Link href={`/consultant/clients/${id}/activity`} className="block underline" style={{ color: "var(--text-muted)" }}>
                Activity + CSV export →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Wireframe-style plain-language event lines. */
function eventLabel(verb: string, subject: string): string {
  switch (verb) {
    case "request.created": return `Request sent via magic link - ${subject}`;
    case "request.renewed": return `Portal link renewed - ${subject}`;
    case "upload.received": return `Supplier submitted ${subject}`;
    case "session.approved": return `Upload approved - ${subject}`;
    case "session.flagged": return `Changes requested - ${subject}`;
    case "snapshot.created": return `Snapshot frozen - ${subject}`;
    case "snapshot.shared": return `Snapshot shared - ${subject}`;
    case "snapshot.approved_with_flags": return subject;
    case "review.changes_requested": return `Changes requested: "${subject}"`;
    case "comment.added": return `New comment on ${subject}`;
    default: return subject || verb;
  }
}
