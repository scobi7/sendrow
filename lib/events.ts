import { db } from "./db";
import { events } from "./db/schema";

export type EventVerb =
  | "request.created" | "request.renewed" | "request.link_requested"
  | "upload.received" | "entry.received"
  | "session.approved" | "session.flagged" | "session.rejected"
  | "vendor.confirmed" | "fuel.converted"
  | "item.recategorized" | "item.quantity_edited" | "item.excluded" | "item.restored" | "item.marked_actual"
  | "comment.added" | "evidence.attached"
  | "snapshot.created" | "snapshot.shared" | "share.revoked"
  | "client.stuck";

/** Append-only event log (Ground Rule 3). Fire-and-forget — logging must
 *  never break the action it describes. */
export function logEvent(e: {
  companyId: string;
  actor: string;
  actorType: "consultant" | "supplier" | "system";
  verb: EventVerb;
  subject: string;
  subjectId?: string | null;
  meta?: Record<string, unknown>;
}): void {
  db.insert(events)
    .values({
      id: "ev_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
      companyId: e.companyId,
      actor: e.actor,
      actorType: e.actorType,
      verb: e.verb,
      subject: e.subject.slice(0, 300),
      subjectId: e.subjectId ?? null,
      meta: e.meta ?? null,
      ts: new Date().toISOString(),
    })
    .catch(() => {});
}
