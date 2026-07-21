import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, consultantClients, dataRequests, emissionLineItems, intakeSessions, shareLinks, snapshots } from "@/lib/db/schema";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { PipelineBoard, type BoardCard } from "@/components/pipeline-board";
import {
  pipelineStage,
  isOverdue,
  nextDueDate,
  completenessPercent,
  type PipelineStage,
} from "@/lib/client-status";
import type { ChecklistItem } from "@/lib/portal";

/** Consultant home (Plan Y1): the client book as a Pipedrive-style pipeline
 *  board. Stage is derived from workflow data, so a client advances by real
 *  actions (respond, review, approve, share) - never by dragging. */
export default async function ConsultantDashboard() {
  const user = (await currentUser())!;

  const links = await db
    .select()
    .from(consultantClients)
    .where(and(eq(consultantClients.consultantId, user.id), isNull(consultantClients.archivedAt)));
  const ids = links.map((l) => l.companyId);

  const [rows, requests, sessions, snapshotRows, shares, unmappedRows] = ids.length
    ? await Promise.all([
        db.select().from(companies).where(inArray(companies.id, ids)),
        db.select().from(dataRequests).where(inArray(dataRequests.companyId, ids)).orderBy(desc(dataRequests.createdAt)),
        db
          .select({ companyId: intakeSessions.companyId, status: intakeSessions.status })
          .from(intakeSessions)
          .where(inArray(intakeSessions.companyId, ids)),
        db.select({ companyId: snapshots.companyId }).from(snapshots).where(inArray(snapshots.companyId, ids)),
        db
          .select({ companyId: shareLinks.companyId, recipientLabel: shareLinks.recipientLabel, createdAt: shareLinks.createdAt })
          .from(shareLinks)
          .where(and(inArray(shareLinks.companyId, ids), isNull(shareLinks.revokedAt))),
        db
          .select({ companyId: emissionLineItems.companyId })
          .from(emissionLineItems)
          .where(and(inArray(emissionLineItems.companyId, ids), eq(emissionLineItems.status, "unmapped"))),
      ])
    : [[], [], [], [], [], []];

  const cards: BoardCard[] = rows.map((row) => {
    const reqs = requests.filter((r) => r.companyId === row.id);
    const openReqs = reqs.filter((r) => r.status === "open");
    const input = {
      openRequests: openReqs.map((r) => ({ dueDate: r.dueDate, checklist: r.checklist as ChecklistItem[] | null })),
      fulfilledRequests: reqs
        .filter((r) => r.status === "fulfilled")
        .map((r) => ({ checklist: r.checklist as ChecklistItem[] | null })),
      pendingReviewCount: sessions.filter(
        (s) => s.companyId === row.id && (s.status === "pending_review" || s.status === "needs_info")
      ).length,
      hasSnapshot: snapshotRows.some((s) => s.companyId === row.id),
      hasFulfilledRequest: reqs.some((r) => r.status === "fulfilled"),
    };

    const stage = pipelineStage(input);
    // Flags = unmapped rows + open stuck notes on open requests.
    const stuck = openReqs.flatMap((r) => (r.checklist as ChecklistItem[] | null) ?? []).filter((c) => c.stuckNote && c.status !== "received").length;
    const flags = unmappedRows.filter((u) => u.companyId === row.id).length + stuck;

    // Most recent share recipient, for the "shared to X" badge on approved cards.
    const share = shares
      .filter((s) => s.companyId === row.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

    return {
      id: row.id,
      name: row.name,
      contact: row.clientContactEmail ?? null,
      completeness: completenessPercent(input),
      due: nextDueDate(input),
      overdue: isOverdue(input),
      flags,
      stage,
      sharedWith: stage === "approved" ? share?.recipientLabel ?? null : null,
      next: nextAction(stage, row.id),
    };
  });

  const needReview = cards.filter((c) => c.stage === "review").length;
  const overdue = cards.filter((c) => c.overdue).length;

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {cards.length} active client{cards.length !== 1 ? "s" : ""}
            {needReview > 0 && <> &middot; <span style={{ color: "var(--primary)" }}>{needReview} need your review</span></>}
            {overdue > 0 && <> &middot; <span style={{ color: "var(--danger)" }}>{overdue} overdue</span></>}
          </p>
        </div>
        <Link href="/consultant/requests/new" className="btn btn-primary">
          + New request
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="card py-12 text-center" style={{ color: "var(--text-muted)" }}>
          No clients yet.{" "}
          <Link href="/consultant/clients/new" className="underline" style={{ color: "var(--primary)" }}>
            Add your first client
          </Link>{" "}
          to get started.
        </div>
      ) : (
        <PipelineBoard cards={cards} />
      )}
    </div>
  );
}

/** The single most useful destination per stage - the card links straight to it. */
function nextAction(stage: PipelineStage, id: string): { label: string; href: string } {
  const client = `/consultant/clients/${id}`;
  switch (stage) {
    case "new":
      return { label: "Send request", href: `/consultant/requests/new?client=${id}` };
    case "requested":
      return { label: "Open", href: client };
    case "responding":
      return { label: "Open", href: client };
    case "review":
      return { label: "Review", href: `${client}/review` };
    case "approved":
      return { label: "View", href: client };
  }
}
