import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { emissionLineItems } from "@/lib/db/schema";
import { currentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { WorkpaperTable } from "./workpaper-table";

export default async function WorkpaperPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const [{ scope: scopeParam }, user] = await Promise.all([searchParams, currentUser()]);
  const companyId = user!.companyId;

  const scopeFilter = scopeParam ? parseInt(scopeParam) : null;

  const items = await db
    .select()
    .from(emissionLineItems)
    .where(
      scopeFilter
        ? and(
            eq(emissionLineItems.companyId, companyId),
            eq(emissionLineItems.scope, scopeFilter)
          )
        : eq(emissionLineItems.companyId, companyId)
    )
    .orderBy(emissionLineItems.createdAt);

  const totalKg = items.reduce((sum, i) => sum + Number(i.co2eKg), 0);
  const byScope = [1, 2, 3].map((s) => ({
    scope: s,
    kg: items.filter((i) => i.scope === s).reduce((sum, i) => sum + Number(i.co2eKg), 0),
  }));
  const unmappedCount = items.filter((i) => i.status === "unmapped").length;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Workpaper"
        subtitle="Every imported line item with its full audit trail — factor applied, formula, and result."
      />

      {unmappedCount > 0 && (
        <div className="mb-6 rounded-xl px-4 py-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
          <span className="font-semibold">{unmappedCount} row{unmappedCount !== 1 ? "s" : ""} could not be mapped</span>
          <span style={{ color: "var(--text)" }}> — flagged below with the reason, contributing 0 emissions until categorized. Nothing was dropped.</span>
        </div>
      )}

      {/* Summary */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl p-4" style={{ border: "1px solid var(--divider)", background: "var(--card)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Total</p>
          <p className="mt-1 text-2xl font-black font-data" style={{ color: "var(--text)" }}>
            {(totalKg / 1000).toFixed(2)}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>tCO₂e</p>
        </div>
        {byScope.map(({ scope, kg }) => (
          <div key={scope} className="rounded-xl p-4" style={{ border: "1px solid var(--divider)", background: "var(--card)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Scope {scope}</p>
            <p className="mt-1 text-2xl font-black font-data" style={{ color: "var(--text)" }}>
              {(kg / 1000).toFixed(2)}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>tCO₂e</p>
          </div>
        ))}
      </div>

      {/* Scope filter */}
      <div className="mb-4 flex items-center gap-2">
        {[null, 1, 2, 3].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/workpaper?scope=${s}` : "/workpaper"}
            className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            style={
              scopeFilter === s
                ? { background: "var(--primary)", color: "#fff" }
                : { background: "var(--divider)", color: "var(--text-muted)" }
            }
          >
            {s ? `Scope ${s}` : "All"}
          </Link>
        ))}
        <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
          {items.length} line item{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ border: "1px dashed var(--divider)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No data yet. <Link href="/intake" className="underline" style={{ color: "var(--primary)" }}>Upload a spreadsheet</Link> to get started.
          </p>
        </div>
      ) : (
        <WorkpaperTable items={items} />
      )}
    </div>
  );
}
