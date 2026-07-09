import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, consultantClients, emissionLineItems, intakeSessions } from "@/lib/db/schema";
import { LedgerRow } from "./ledger-row";

const FILTERS = ["all", "mapped", "unmapped", "excluded"] as const;

/** The Data Ledger (Plan T1): every line item, inspectable and correctable.
 *  The consultant's verbs here are confirm, fix, exclude — never re-type. */
export default async function LedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; upload?: string }>;
}) {
  const [{ id }, { status: statusFilter, upload: uploadFilter }, user] = await Promise.all([
    params,
    searchParams,
    currentUser(),
  ]);

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user!.id),
      eq(consultantClients.companyId, id),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) notFound();

  const [company, items, sessions] = await Promise.all([
    db.query.companies.findFirst({ where: eq(companies.id, id) }),
    db
      .select()
      .from(emissionLineItems)
      .where(eq(emissionLineItems.companyId, id))
      .orderBy(desc(emissionLineItems.createdAt)),
    db
      .select()
      .from(intakeSessions)
      .where(eq(intakeSessions.companyId, id))
      .orderBy(desc(intakeSessions.createdAt)),
  ]);
  if (!company) notFound();

  const sessionByProfile = new Map(sessions.filter((s) => s.mappingProfileId).map((s) => [s.mappingProfileId!, s]));

  let displayed = items;
  if (statusFilter && statusFilter !== "all") displayed = displayed.filter((i) => i.status === statusFilter);
  if (uploadFilter) displayed = displayed.filter((i) => i.mappingProfileId === uploadFilter);

  const counts = {
    all: items.length,
    mapped: items.filter((i) => i.status === "mapped").length,
    unmapped: items.filter((i) => i.status === "unmapped").length,
    excluded: items.filter((i) => i.status === "excluded").length,
  };
  const totalT = displayed
    .filter((i) => i.status === "mapped")
    .reduce((sum, i) => sum + Number(i.co2eKg), 0) / 1000;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href={`/consultant/clients/${id}`}
        className="mb-4 inline-block text-sm font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--primary)" }}
      >
        ← Back to {company.name}
      </Link>

      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>Data Ledger</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Every figure, its receipt, and its math. Corrections keep the full audit trail.
          </p>
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Showing{" "}
          <span className="font-semibold font-data" style={{ color: "var(--text)" }}>
            {totalT.toLocaleString("en-US", { maximumFractionDigits: 2 })} t CO2e
          </span>{" "}
          across {displayed.length} row{displayed.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/consultant/clients/${id}/ledger${f === "all" ? "" : `?status=${f}`}`}
            className="rounded-full px-3 py-1 text-xs font-medium capitalize"
            style={
              (statusFilter ?? "all") === f && !uploadFilter
                ? { background: "var(--primary)", color: "#fff" }
                : { background: "var(--card)", color: "var(--text-muted)", border: "1px solid var(--divider)" }
            }
          >
            {f} ({counts[f]})
          </Link>
        ))}
        {uploadFilter && (
          <Link
            href={`/consultant/clients/${id}/ledger`}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "var(--warning-tint)", color: "var(--warning-strong)" }}
          >
            Upload: {sessionByProfile.get(uploadFilter)?.filename ?? "unknown"} ✕
          </Link>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="card py-12 text-center" style={{ color: "var(--text-muted)" }}>
          No rows{statusFilter && statusFilter !== "all" ? ` with status "${statusFilter}"` : " yet — data arrives via the portal or on-behalf entry"}.
        </div>
      ) : (
        <div className="overflow-x-auto" style={{ borderRadius: "var(--radius-lg)", background: "var(--card)", border: "1px solid var(--divider)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs font-semibold uppercase tracking-wide"
                style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}
              >
                <th className="px-4 py-3">Source / vendor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Raw</th>
                <th className="px-4 py-3 text-right">t CO2e</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Upload</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Fix</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((item) => {
                const session = item.mappingProfileId ? sessionByProfile.get(item.mappingProfileId) : undefined;
                const log = item.calcLog as { evidence_id?: string; reason?: string } | null;
                return (
                  <LedgerRow
                    key={item.id}
                    companyId={id}
                    item={{
                      id: item.id,
                      sourceRef: item.sourceRef,
                      scope: item.scope,
                      category: item.category,
                      rawValue: item.rawValue,
                      rawUnit: item.rawUnit,
                      co2eKg: item.co2eKg,
                      status: item.status,
                      period: item.period,
                      flagReason: log?.reason ?? null,
                    }}
                    evidenceId={log?.evidence_id ?? session?.evidenceId ?? null}
                    uploadName={session?.filename ?? null}
                    uploadHref={item.mappingProfileId ? `/consultant/clients/${id}/ledger?upload=${item.mappingProfileId}` : null}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
