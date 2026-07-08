import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";
import { loadCompany } from "@/lib/store";
import { totals } from "@/lib/calc";
import { auditForCompany } from "@/lib/audit";
import { archiveClient, startUtilityConnectForClient } from "@/lib/actions";
import { PageHeader, StatusDot } from "@/components/ui";
import { SectionName } from "@/lib/types";

const SECTIONS: { key: SectionName; label: string; desc: string }[] = [
  { key: "connections", label: "Connections", desc: "QuickBooks + utility" },
  { key: "scope1", label: "Scope 1", desc: "Direct emissions" },
  { key: "scope2", label: "Scope 2", desc: "Electricity" },
  { key: "scope3", label: "Scope 3", desc: "Value chain" },
  { key: "social", label: "Social", desc: "Workforce metrics" },
  { key: "governance", label: "Governance", desc: "Policies & leadership" },
  { key: "reports", label: "Reports", desc: "Generated inventory" },
];

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  complete: "Complete",
};

export default async function ClientDetailPage({
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

  let company;
  try {
    company = await loadCompany(id);
  } catch {
    notFound();
  }

  const t = totals(company);
  const recentAudit = await auditForCompany(company.id);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const recent = recentAudit.slice(0, 10);

  const boundArchive = archiveClient.bind(null, id);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/consultant"
        className="mb-4 inline-block text-sm font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--primary)" }}
      >
        ← Back to clients
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>{company.name}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {company.industry ?? "Industry not set"} ·{" "}
            {company.headcountRange ? company.headcountRange.replace(/_/g, "–") : "Headcount not set"} employees
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/consultant/clients/${id}/manage`}
            className="btn btn-primary text-sm"
          >
            Manage on behalf
          </Link>
          <form action={boundArchive}>
            <button className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
              Archive client
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card">
            <h2
              className="text-sm font-bold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Section Progress
            </h2>
            <div className="mt-4 space-y-2">
              {SECTIONS.map(({ key, label, desc }) => {
                const status = company.sectionStatus[key];
                return (
                  <div key={key} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <StatusDot status={status} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{label}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium capitalize" style={{ color: "var(--text-muted)" }}>
                      {STATUS_LABEL[status] ?? status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Client Data Access
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Your client never needs an account. Create a data request from the{" "}
              <Link href={`/consultant/review/${id}`} className="font-medium underline" style={{ color: "var(--primary)" }}>
                review workspace
              </Link>{" "}
              and share the secure portal link — they upload files and enter data there.
            </p>
          </div>

          <div className="card">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Data Connections
            </h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>QuickBooks</p>
                  {company.connections.quickbooks.connected ? (
                    <p className="text-xs" style={{ color: "var(--status-green)" }}>
                      ✓ Connected — last synced{" "}
                      {company.connections.quickbooks.lastSynced
                        ? new Date(company.connections.quickbooks.lastSynced).toLocaleDateString()
                        : "—"}
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Not connected</p>
                  )}
                </div>
                {!company.connections.quickbooks.connected && process.env.QUICKBOOKS_CLIENT_ID && (
                  <a
                    href={`/api/auth/quickbooks/redirect?for=${company.id}`}
                    className="btn btn-secondary shrink-0 px-3 py-1.5 text-xs"
                  >
                    Connect QB
                  </a>
                )}
              </div>

              <div className="pt-4" style={{ borderTop: "1px solid var(--divider)" }}>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Utility Account</p>
                {company.connections.utility.connected ? (
                  <p className="text-xs" style={{ color: "var(--status-green)" }}>
                    ✓ Connected — last synced{" "}
                    {company.connections.utility.lastSynced
                      ? new Date(company.connections.utility.lastSynced).toLocaleDateString()
                      : "—"}
                  </p>
                ) : company.connections.utility.authUid ? (
                  <p className="text-xs" style={{ color: "var(--warning)" }}>
                    Pending — auth sent to {company.connections.utility.authEmail}
                  </p>
                ) : process.env.UTILITYAPI_FORM_URL ? (
                  <form
                    action={startUtilityConnectForClient.bind(null, company.id)}
                    className="mt-2 flex gap-2"
                  >
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="Client utility email"
                      className="input flex-1 text-xs"
                    />
                    <button type="submit" className="btn btn-secondary shrink-0 px-3 py-1.5 text-xs">
                      Connect
                    </button>
                  </form>
                ) : (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Not connected</p>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Recent Activity
            </h2>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                No activity yet — client hasn't started filling in data.
              </p>
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
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {row.prev} → {row.next}
                      </p>
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
          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>Updates as client enters data.</p>
        </div>
      </div>
    </div>
  );
}
