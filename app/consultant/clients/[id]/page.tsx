import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, consultantClients, intakeSessions, dataRequests, pipelineStatus, emissionLineItems } from "@/lib/db/schema";
import { loadCompany } from "@/lib/store";
import { totals } from "@/lib/calc";
import { auditForCompany } from "@/lib/audit";
import { archiveClient, updateClientContact } from "@/lib/actions";
import { resendPortalEmail } from "@/lib/consultant-actions";
import { SessionActions } from "./session-actions";
import { DataRequestForm } from "./data-request-form";
import { LockPipelineButton } from "./lock-pipeline-button";
import { PortalLinkButton } from "./portal-link-button";
import { VendorConfirm } from "./vendor-confirm";
import type { ChecklistItem } from "@/lib/portal";

const STATUS_LABEL: Record<string, string> = {
  auto_approved: "Auto-approved",
  approved: "Approved",
  pending_review: "Pending review",
  needs_info: "Needs info",
  rejected: "Rejected",
};

const STATUS_COLOR: Record<string, string> = {
  auto_approved: "var(--primary)",
  approved: "var(--primary)",
  pending_review: "#d97706",
  needs_info: "#dc2626",
  rejected: "#6b7280",
};

export default async function ClientWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, user] = await Promise.all([params, currentUser()]);

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user!.id),
      eq(consultantClients.companyId, id),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) notFound();

  const [companyRow, sessions, requests, pipeline, unmappedItems, fullCompany, recentAudit] = await Promise.all([
    db.select().from(companies).where(eq(companies.id, id)).then(r => r[0]),
    db.select().from(intakeSessions).where(eq(intakeSessions.companyId, id)).orderBy(desc(intakeSessions.createdAt)).limit(20),
    db.select().from(dataRequests).where(eq(dataRequests.companyId, id)).orderBy(desc(dataRequests.createdAt)),
    db.select().from(pipelineStatus).where(eq(pipelineStatus.companyId, id)).then(r => r[0] ?? null),
    db.select({
      mappingProfileId: emissionLineItems.mappingProfileId,
      sourceRef: emissionLineItems.sourceRef,
      calcLog: emissionLineItems.calcLog,
    })
      .from(emissionLineItems)
      .where(and(eq(emissionLineItems.companyId, id), eq(emissionLineItems.status, "unmapped"))),
    loadCompany(id).catch(() => null),
    auditForCompany(id),
  ]);
  if (!companyRow || !fullCompany) notFound();

  const t = totals(fullCompany);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const recent = recentAudit.slice(0, 8);

  const pStatus = pipeline?.status ?? "not_started";
  const pendingSessions = sessions.filter(s => s.status === "pending_review" || s.status === "needs_info");
  const unmappedByProfile: Record<string, number> = {};
  const vendorCounts: Record<string, number> = {};
  for (const item of unmappedItems) {
    if (item.mappingProfileId) {
      unmappedByProfile[item.mappingProfileId] = (unmappedByProfile[item.mappingProfileId] ?? 0) + 1;
    }
    const log = item.calcLog as { activity_type?: string } | null;
    const vendor = item.sourceRef?.trim() || log?.activity_type?.trim();
    if (vendor) vendorCounts[vendor] = (vendorCounts[vendor] ?? 0) + 1;
  }
  const unmappedVendors = Object.entries(vendorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const boundArchive = archiveClient.bind(null, id);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/consultant"
        className="mb-4 inline-block text-sm font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--primary)" }}
      >
        ← Back to clients
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>{companyRow.name}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {companyRow.industry ?? "Industry not set"} ·{" "}
            {companyRow.headcountRange ? companyRow.headcountRange.replace(/_/g, "–") : "Headcount not set"} employees
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/consultant/clients/${id}/manage`} className="btn btn-secondary text-sm">
            Enter data on behalf
          </Link>
          <form action={boundArchive}>
            <button className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
              Archive client
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Pipeline status + lock */}
          <div
            className="flex items-center justify-between rounded-2xl px-5 py-4"
            style={{
              background: pStatus === "locked" ? "var(--primary-tint)" : pStatus === "in_progress" ? "var(--warning-tint)" : "var(--card)",
              border: `1px solid ${pStatus === "locked" ? "var(--primary)" : pStatus === "in_progress" ? "var(--warning-border)" : "var(--divider)"}`,
            }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Pipeline</p>
              <p className="mt-0.5 font-semibold" style={{ color: "var(--text)" }}>
                {pStatus === "locked" ? "Locked — all uploads auto-process" : pStatus === "in_progress" ? "In progress" : "Not started"}
              </p>
            </div>
            {pStatus === "in_progress" && <LockPipelineButton companyId={id} />}
          </div>

          {/* Unmapped vendors — confirm once, mapped for every client (vendor memory) */}
          <VendorConfirm companyId={id} vendors={unmappedVendors} />

          {/* Sessions requiring action */}
          {pendingSessions.length > 0 && (
            <div className="rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--divider)" }}>
              <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  Needs review ({pendingSessions.length})
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
                {pendingSessions.map((s) => (
                  <div key={s.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{s.filename}</p>
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                          {s.dataType} · {s.rowCount} rows · score {s.sessionScore} · {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                        {s.mappingProfileId && (unmappedByProfile[s.mappingProfileId] ?? 0) > 0 && (
                          <p className="mt-1 text-xs font-semibold" style={{ color: "var(--danger)" }}>
                            ⚠ {unmappedByProfile[s.mappingProfileId]} unmapped row{unmappedByProfile[s.mappingProfileId] !== 1 ? "s" : ""} — zero emissions until categorized
                          </p>
                        )}
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ background: `${STATUS_COLOR[s.status]}22`, color: STATUS_COLOR[s.status] }}
                      >
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </div>
                    <SessionActions sessionId={s.id} companyId={id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data requests */}
          <div className="rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--divider)" }}>
            <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Data requests</p>
            </div>
            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--divider)", background: companyRow.clientContactEmail ? "transparent" : "var(--warning-tint)" }}>
              {!companyRow.clientContactEmail && (
                <p className="mb-2 text-xs font-medium" style={{ color: "var(--warning-strong)" }}>
                  No client contact on file — requests and reminders can&apos;t be emailed. Add one below or share the portal link manually.
                </p>
              )}
              <form action={updateClientContact.bind(null, id)} className="flex flex-wrap items-center gap-2">
                <input
                  name="contact_name"
                  defaultValue={companyRow.clientContactName ?? ""}
                  placeholder="Contact name"
                  className="input flex-1 text-xs"
                  style={{ minWidth: "10rem" }}
                />
                <input
                  name="contact_email"
                  type="email"
                  defaultValue={companyRow.clientContactEmail ?? ""}
                  placeholder="contact@client.com"
                  className="input flex-1 text-xs"
                  style={{ minWidth: "12rem" }}
                />
                <button className="btn btn-secondary shrink-0 px-3 py-1.5 text-xs">Save contact</button>
              </form>
            </div>
            {requests.length === 0 ? (
              <p className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>No requests sent yet.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
                {requests.map((req) => {
                  const checklist = (req.checklist as ChecklistItem[] | null) ?? [];
                  const sentMap = (req.remindersSentAt as Record<string, string> | null) ?? {};
                  const lastReminder = Object.keys(sentMap).sort((a, b) => Number(a) - Number(b)).pop();
                  return (
                    <div key={req.id} className="px-5 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm" style={{ color: "var(--text)" }}>{req.description}</p>
                          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                            {req.dueDate ? `Due ${req.dueDate} · ` : ""}sent {new Date(req.createdAt).toLocaleDateString()}
                            {lastReminder ? ` · day-${lastReminder} reminder sent` : ""}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            background: req.status === "open" ? "var(--warning-tint)" : req.status === "fulfilled" ? "var(--primary-tint)" : "var(--divider)",
                            color: req.status === "open" ? "var(--warning-strong)" : req.status === "fulfilled" ? "var(--primary)" : "var(--text-muted)",
                          }}
                        >
                          {req.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {checklist.map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full px-2 py-0.5 text-xs"
                            style={
                              item.status === "received"
                                ? { background: "var(--primary-tint)", color: "var(--primary)" }
                                : { background: "var(--divider)", color: "var(--text-muted)" }
                            }
                          >
                            {item.status === "received" ? "✓ " : "○ "}{item.label}
                          </span>
                        ))}
                        {req.token && <PortalLinkButton token={req.token} />}
                        {req.token && req.status === "open" && companyRow.clientContactEmail && (
                          <form action={resendPortalEmail.bind(null, req.id, id)}>
                            <button className="rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-70" style={{ background: "var(--primary-tint)", color: "var(--primary)" }}>
                              ✉ Email link to {companyRow.clientContactEmail}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="px-5 py-4" style={{ borderTop: "1px solid var(--divider)" }}>
              <DataRequestForm companyId={id} consultantId={user!.id} />
            </div>
          </div>

          {/* All uploads */}
          <div className="rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--divider)" }}>
            <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>All uploads</p>
            </div>
            {sessions.length === 0 ? (
              <p className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>No uploads yet.</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{s.filename}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {s.dataType} · {s.rowCount} rows · {new Date(s.createdAt).toLocaleDateString()}
                        {s.evidenceId && (
                          <>
                            {" · "}
                            <a href={`/api/evidence/${s.evidenceId}`} className="underline" style={{ color: "var(--primary)" }}>
                              source file ↓
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ background: `${STATUS_COLOR[s.status]}22`, color: STATUS_COLOR[s.status] }}
                    >
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card h-fit">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Emissions Summary
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Scope 1", fmt(t.scope1)],
                ["Scope 2 (location)", fmt(t.scope2Location)],
                ["Scope 2 (market)", fmt(t.scope2Market)],
                ["Scope 3", fmt(t.scope3)],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
                  <dd className="font-semibold font-data" style={{ color: "var(--text)" }}>{val} t</dd>
                </div>
              ))}
              <div
                className="flex justify-between pt-3 text-base"
                style={{ borderTop: "1px solid var(--divider)" }}
              >
                <dt className="font-bold" style={{ color: "var(--text)" }}>Total CO2e</dt>
                <dd className="font-bold font-data" style={{ color: "var(--primary)" }}>{fmt(t.total)} t</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>Updates as data is approved.</p>
          </div>

          <div className="card h-fit">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Recent Activity
            </h2>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>No activity yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {recent.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-start justify-between gap-4 pb-2 last:border-0"
                    style={{ borderBottom: "1px solid var(--divider)" }}
                  >
                    <div>
                      <span className="text-xs font-medium capitalize" style={{ color: "var(--text)" }}>{row.section}</span>
                      <span className="mx-1" style={{ color: "var(--divider)" }}>·</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{row.field}</span>
                    </div>
                    <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(row.ts).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
