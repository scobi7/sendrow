import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, consultantClients, events } from "@/lib/db/schema";

const VERB_LABEL: Record<string, string> = {
  "request.created": "Data request sent",
  "request.renewed": "Portal link renewed",
  "request.link_requested": "Client asked for a new link",
  "upload.received": "File received",
  "entry.received": "Manual entry received",
  "session.approved": "Upload approved",
  "session.flagged": "Upload flagged",
  "session.rejected": "Upload rejected",
  "vendor.confirmed": "Vendor categorized",
  "fuel.converted": "Dollar fuel converted",
  "item.recategorized": "Row recategorized",
  "item.quantity_edited": "Quantity corrected",
  "item.excluded": "Row excluded",
  "item.restored": "Row restored",
  "item.marked_actual": "Estimate replaced with actual",
  "comment.added": "Comment",
  "evidence.attached": "Evidence attached",
  "snapshot.created": "Snapshot frozen",
  "snapshot.shared": "Snapshot shared",
  "snapshot.approved_with_flags": "Approved with open flags",
  "share.revoked": "Share revoked",
  "review.changes_requested": "Changes requested",
  "client.stuck": "Client asked for help",
  "flag.replied": "Reply sent to client",
  "email.sent": "Email handed to the mail service",
  "email.failed": "Email failed to send",
};

/** The immutable activity log (U1.3 / Ground Rule 3): who did what, when —
 *  the diary that IS the product when auditors show up. */
export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, currentUser()]);

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user!.id),
      eq(consultantClients.companyId, id),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) notFound();

  const [company, rows] = await Promise.all([
    db.query.companies.findFirst({ where: eq(companies.id, id) }),
    db.select().from(events).where(eq(events.companyId, id)).orderBy(desc(events.ts)).limit(200),
  ]);
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/consultant/clients/${id}`}
        className="mb-4 inline-block text-sm font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--primary)" }}
      >
        ← Back to {company.name}
      </Link>

      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>Activity</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Every action, permanently recorded — this log can&apos;t be edited or deleted. It stays here as the
            audit trail; the numbers and methodology ship inside each snapshot&apos;s exports.
          </p>
        </div>
        <a href={`/api/events/export?companyId=${id}`} className="btn btn-secondary text-sm">
          Export CSV
        </a>
      </div>

      {rows.length === 0 ? (
        <div className="card py-12 text-center" style={{ color: "var(--text-muted)" }}>
          No activity yet — events appear here the moment anything happens.
        </div>
      ) : (
        <div className="glass-panel">
          <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
            {rows.map((e) => {
              const label = VERB_LABEL[e.verb] ?? e.verb.replace(/[._]/g, " ");
              return (
                <div key={e.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm" style={{ color: "var(--text)" }}>
                      <span className="font-medium">{label}</span>
                      {e.subject && <span style={{ color: "var(--text-muted)" }}> — {e.subject}</span>}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {e.actorType === "supplier" ? "Client (via portal)" : e.actorType === "system" ? "System" : "You"} ·{" "}
                      {new Date(e.ts).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
