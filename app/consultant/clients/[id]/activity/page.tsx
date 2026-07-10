import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, consultantClients, events } from "@/lib/db/schema";

const VERB_LABEL: Record<string, { icon: string; label: string }> = {
  "request.created": { icon: "📨", label: "Data request sent" },
  "request.renewed": { icon: "🔄", label: "Portal link renewed" },
  "request.link_requested": { icon: "🙋", label: "Client asked for a new link" },
  "upload.received": { icon: "📎", label: "File received" },
  "entry.received": { icon: "⌨️", label: "Manual entry received" },
  "session.approved": { icon: "✅", label: "Upload approved" },
  "session.flagged": { icon: "🚩", label: "Upload flagged" },
  "session.rejected": { icon: "🚫", label: "Upload rejected" },
  "vendor.confirmed": { icon: "🏷", label: "Vendor categorized" },
  "fuel.converted": { icon: "⛽", label: "Dollar fuel converted" },
  "item.recategorized": { icon: "✏️", label: "Row recategorized" },
  "item.quantity_edited": { icon: "✏️", label: "Quantity corrected" },
  "item.excluded": { icon: "➖", label: "Row excluded" },
  "item.restored": { icon: "➕", label: "Row restored" },
  "item.marked_actual": { icon: "🎯", label: "Estimate replaced with actual" },
  "comment.added": { icon: "💬", label: "Comment" },
  "evidence.attached": { icon: "🧾", label: "Evidence attached" },
  "snapshot.created": { icon: "🔒", label: "Snapshot frozen" },
  "snapshot.shared": { icon: "📤", label: "Snapshot shared" },
  "share.revoked": { icon: "🚫", label: "Share revoked" },
  "client.stuck": { icon: "⚑", label: "Client asked for help" },
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
            Every action, permanently recorded. This log can&apos;t be edited or deleted.
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
              const v = VERB_LABEL[e.verb] ?? { icon: "•", label: e.verb };
              return (
                <div key={e.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-0.5 shrink-0 text-base">{v.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm" style={{ color: "var(--text)" }}>
                      <span className="font-medium">{v.label}</span>
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
