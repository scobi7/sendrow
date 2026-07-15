import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, comments, consultantClients, dataRequests, emissionLineItems, intakeSessions } from "@/lib/db/schema";
import { convertDollarFuel, addLineItemComment } from "@/lib/consultant-actions";
import { isDollarFuelRow, fuelKindOf } from "@/lib/ledger";
import { BackLink } from "@/components/workflow";
import { VendorConfirm } from "../vendor-confirm";
import { SessionActions } from "../session-actions";
import { ApproveBar } from "./approve-bar";
import type { ChecklistItem } from "@/lib/portal";

/** Review & Approve (#7 #6 #18): opens when the supplier submits. Line items
 *  with their receipts and threads; approving freezes a snapshot and lands on
 *  Snapshot & Share - one continuous action, not two. */
export default async function ReviewApprovePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, currentUser()]);

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user!.id),
      eq(consultantClients.companyId, id),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) notFound();

  const [company, items, sessions, allComments, requests] = await Promise.all([
    db.query.companies.findFirst({ where: eq(companies.id, id) }),
    db.select().from(emissionLineItems).where(eq(emissionLineItems.companyId, id)).orderBy(desc(emissionLineItems.createdAt)),
    db.select().from(intakeSessions).where(eq(intakeSessions.companyId, id)).orderBy(desc(intakeSessions.createdAt)),
    db.select().from(comments).where(eq(comments.companyId, id)),
    db.select().from(dataRequests).where(eq(dataRequests.companyId, id)).orderBy(desc(dataRequests.createdAt)),
  ]);
  if (!company) notFound();

  const currentRequest = requests.find((r) => r.status === "open") ?? requests[0] ?? null;
  const pendingSessions = sessions.filter((s) => s.status === "pending_review" || s.status === "needs_info");

  // Flags = unmapped rows + unresolved stuck notes: what the warning modal counts
  const active = items.filter((i) => i.status !== "excluded");
  const unmapped = active.filter((i) => i.status === "unmapped");
  const stuckNotes = requests
    .filter((r) => r.status === "open")
    .flatMap((r) => (r.checklist as ChecklistItem[] | null) ?? [])
    .filter((c) => c.stuckNote && c.status !== "received");
  const openFlags = unmapped.length + stuckNotes.length;

  // Vendor confirmation (#18): flagged rows grouped by reference, dollar-fuel excluded
  const vendorCounts: Record<string, number> = {};
  const dollarFuel = unmapped.filter((i) =>
    isDollarFuelRow({ status: i.status, rawUnit: i.rawUnit, calcLog: (i.calcLog as Record<string, unknown>) ?? {} })
  );
  for (const item of unmapped) {
    if (isDollarFuelRow({ status: item.status, rawUnit: item.rawUnit, calcLog: (item.calcLog as Record<string, unknown>) ?? {} })) continue;
    const log = item.calcLog as { activity_type?: string } | null;
    const vendor = item.sourceRef?.trim() || log?.activity_type?.trim();
    if (vendor) vendorCounts[vendor] = (vendorCounts[vendor] ?? 0) + 1;
  }
  const unmappedVendors = Object.entries(vendorCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const fuelKinds = [...new Set(dollarFuel.map((i) => fuelKindOf({ calcLog: (i.calcLog as Record<string, unknown>) ?? {} })).filter(Boolean))] as string[];

  // Category groups: the wireframe's line-item cards
  const groups = new Map<string, typeof active>();
  for (const item of active) {
    const key = item.category;
    const g = groups.get(key) ?? [];
    g.push(item);
    groups.set(key, g);
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="mx-auto max-w-4xl">
      <BackLink />
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>Review - {company.name}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {currentRequest ? `${currentRequest.periodLabel ? `${currentRequest.periodLabel} · ` : ""}${currentRequest.description}` : "All submitted data"}
          </p>
        </div>
        <Link href={`/consultant/clients/${id}/ledger`} className="text-xs underline" style={{ color: "var(--text-muted)" }}>
          Full ledger (row-level fixes) →
        </Link>
      </div>

      {/* Open flags the dashboard counted - visible here, not just tallied (X2.4) */}
      {stuckNotes.length > 0 && (
        <div className="glass-panel mb-6">
          <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--danger)" }}>
              Client is stuck ({stuckNotes.length})
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
            {stuckNotes.map((c) => (
              <div key={c.id} className="px-5 py-3">
                <p className="text-sm" style={{ color: "var(--text)" }}>
                  <strong>Flag - {c.label}:</strong> &ldquo;{c.stuckNote}&rdquo;
                </p>
                <Link href={`/consultant/clients/${id}`} className="mt-1 inline-block text-xs underline" style={{ color: "var(--primary)" }}>
                  Reply from the client page →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploads waiting on a decision */}
      {pendingSessions.length > 0 && (
        <div className="glass-panel mb-6">
          <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Submitted uploads ({pendingSessions.length})
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
            {pendingSessions.map((s) => (
              <div key={s.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{s.filename}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {s.dataType} · {s.rowCount} rows · {fmtDate(s.createdAt)}
                      {s.evidenceId && (
                        <>
                          {" · "}
                          <a href={`/api/evidence/${s.evidenceId}`} className="underline" style={{ color: "var(--primary)" }}>
                            source file ↓
                          </a>
                        </>
                      )}
                    </p>
                    {s.reviewerNotes && (
                      <p className="mt-1 text-xs" style={{ color: "var(--warning-strong)" }}>Note: {s.reviewerNotes}</p>
                    )}
                  </div>
                </div>
                <SessionActions sessionId={s.id} companyId={id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category confirmation (#18): vendor memory */}
      {unmappedVendors.length > 0 && (
        <div className="mb-6">
          <VendorConfirm companyId={id} vendors={unmappedVendors} />
        </div>
      )}

      {/* Dollar-based fuel conversion */}
      {dollarFuel.length > 0 && (
        <div className="glass-panel mb-6" style={{ border: "1px solid var(--warning-border)" }}>
          <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--warning-strong)" }}>
              Dollar-based fuel ({dollarFuel.length} rows)
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Set the price you&apos;re applying ($/gallon) - every row converts to gallons × EPA factor, with the price and your name in each calc log.
            </p>
          </div>
          <form action={convertDollarFuel.bind(null, id)} className="flex flex-wrap items-end gap-3 px-5 py-4">
            {fuelKinds.includes("diesel") && (
              <div>
                <label className="label text-xs">Diesel $/gal</label>
                <input name="diesel_price" type="number" step="0.01" min="0.5" placeholder="4.10" className="input w-28 text-sm" />
              </div>
            )}
            {fuelKinds.includes("gasoline") && (
              <div>
                <label className="label text-xs">Gasoline $/gal</label>
                <input name="gasoline_price" type="number" step="0.01" min="0.5" placeholder="3.60" className="input w-28 text-sm" />
              </div>
            )}
            {fuelKinds.includes("propane") && (
              <div>
                <label className="label text-xs">Propane $/gal</label>
                <input name="propane_price" type="number" step="0.01" min="0.5" placeholder="2.80" className="input w-28 text-sm" />
              </div>
            )}
            <button className="btn btn-primary text-sm">Convert rows</button>
          </form>
        </div>
      )}

      {/* Line items by category */}
      {groups.size === 0 ? (
        <div className="card mb-6 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Nothing to review yet - data arrives via the portal or on-behalf entry.
        </div>
      ) : (
        <div className="mb-6 space-y-4">
          {[...groups.entries()].map(([category, groupItems]) => {
            const units = [...new Set(groupItems.map((i) => i.rawUnit))];
            const rawTotal = units.length === 1 ? groupItems.reduce((s, i) => s + Number(i.rawValue), 0) : null;
            const co2eT = groupItems.filter((i) => i.status === "mapped").reduce((s, i) => s + Number(i.co2eKg), 0) / 1000;
            const flagged = groupItems.filter((i) => i.status === "unmapped").length;
            const files = groupItems.filter((i) => {
              const log = i.calcLog as { evidence_id?: string } | null;
              return Boolean(log?.evidence_id);
            }).length;
            const estimated = groupItems.filter((i) => i.confidence === "estimated").length;
            const groupComments = allComments
              .filter((c) => groupItems.some((i) => i.id === c.lineItemId))
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
            const firstItemId = groupItems[0].id;

            return (
              <div key={category} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text)" }}>{prettyCategory(category)}</p>
                    <p className="mt-0.5 font-data text-lg font-bold" style={{ color: "var(--text)" }}>
                      {rawTotal !== null ? `${fmt(rawTotal)} ${units[0]}` : `${fmt(co2eT)} tCO2e`}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {groupItems.length} row{groupItems.length !== 1 ? "s" : ""}
                      {files > 0 && ` · ${files} file${files !== 1 ? "s" : ""} attached`}
                      {estimated > 0 && ` · ${estimated} estimated`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {flagged > 0 ? (
                      <span className="rounded-full px-2.5 py-1 font-data text-[11px] font-semibold" style={{ background: "var(--danger-tint)", color: "var(--danger)" }}>
                        {flagged} flagged
                      </span>
                    ) : (
                      <span className="badge">✓ mapped</span>
                    )}
                    <Link
                      href={`/consultant/clients/${id}/ledger?category=${encodeURIComponent(category)}${flagged > 0 ? "&status=unmapped" : ""}`}
                      className="text-xs underline"
                      style={{ color: "var(--text-muted)" }}
                    >
                      inspect rows
                    </Link>
                  </div>
                </div>

                {groupComments.length > 0 && (
                  <div className="mt-3 space-y-1.5 rounded-xl px-3 py-2.5" style={{ background: "var(--card-strong)", border: "1px solid var(--divider)" }}>
                    {groupComments.map((c) => (
                      <p key={c.id} className="text-xs" style={{ color: "var(--text)" }}>
                        <span className="font-semibold">{c.authorType === "consultant" ? "You" : company.name}:</span> {c.body}
                        <span className="ml-1" style={{ color: "var(--text-muted)" }}>· {fmtDate(c.createdAt)}</span>
                      </p>
                    ))}
                  </div>
                )}
                <form action={addLineItemComment.bind(null, id, firstItemId)} className="mt-2 flex gap-2">
                  <input name="body" placeholder={`Ask ${company.name} about this figure…`} className="input flex-1 text-xs" />
                  <button className="btn btn-secondary shrink-0 px-3 py-1.5 text-xs">Comment</button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      <ApproveBar companyId={id} openFlags={openFlags} flagSummary={flagSummary(unmapped.length, stuckNotes.length)} hasData={active.some((i) => i.status === "mapped")} />

      <p className="mt-3 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        Approving freezes an immutable snapshot and takes you straight to Snapshot & Share - corrections later create a new snapshot, this one stays on record.
      </p>
    </div>
  );
}

function prettyCategory(category: string): string {
  return category.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function flagSummary(unmappedCount: number, stuckCount: number): string {
  const parts: string[] = [];
  if (unmappedCount > 0) parts.push(`${unmappedCount} row${unmappedCount !== 1 ? "s" : ""} still uncategorized (zero emissions until mapped)`);
  if (stuckCount > 0) parts.push(`${stuckCount} checklist item${stuckCount !== 1 ? "s" : ""} where the supplier is stuck`);
  return parts.join(" and ");
}
