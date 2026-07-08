import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, emissionLineItems, shareLinks } from "@/lib/db/schema";
import { getBrandForCompany } from "@/lib/branding";
import { periodTotals, yoyDelta } from "@/lib/period";
import { loadCompany } from "@/lib/store";
import { totals } from "@/lib/calc";

/** Read-only, consultant-branded results page (Plan N5). This is how a company
 *  "sees their dashboard": a link their consultant shares — no login, and no
 *  Sendrow branding anywhere (contracts/ §11). */
export default async function SharedResultsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const link = await db.query.shareLinks.findFirst({
    where: and(eq(shareLinks.token, token), isNull(shareLinks.revokedAt)),
  });

  if (!link) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center" style={{ background: "var(--bg)" }}>
        <h1 className="text-xl font-bold font-display" style={{ color: "var(--text)" }}>
          This link is no longer active
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Please ask your consultant for a current results link.
        </p>
      </main>
    );
  }

  const [companyRow, brand, fullCompany, periodItems] = await Promise.all([
    db.query.companies.findFirst({ where: eq(companies.id, link.companyId) }),
    getBrandForCompany(link.companyId),
    loadCompany(link.companyId).catch(() => null),
    db
      .select({
        period: emissionLineItems.period,
        scope: emissionLineItems.scope,
        co2eKg: emissionLineItems.co2eKg,
        status: emissionLineItems.status,
      })
      .from(emissionLineItems)
      .where(eq(emissionLineItems.companyId, link.companyId)),
  ]);
  if (!companyRow || !fullCompany) return null;

  const t = totals(fullCompany);
  const byPeriod = periodTotals(periodItems.map((i) => ({ ...i, co2eKg: Number(i.co2eKg) })));
  const yoy = yoyDelta(byPeriod);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  return (
    <main
      className="mx-auto min-h-screen max-w-2xl px-6 py-12"
      style={{
        background: "var(--bg)",
        ...(brand?.accentColor ? ({ "--primary": brand.accentColor } as React.CSSProperties) : {}),
      }}
    >
      {brand && (
        <div className="mb-8 flex items-center gap-3">
          {brand.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoUrl} alt={brand.brandName} className="h-9 w-auto" />
          ) : (
            <span className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>{brand.brandName}</span>
          )}
        </div>
      )}

      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        Emissions summary for
      </p>
      <h1 className="mt-1 text-2xl font-extrabold font-display" style={{ color: "var(--text)" }}>
        {companyRow.name}
      </h1>

      <div className="card mt-8">
        <dl className="space-y-3 text-sm">
          {[
            ["Scope 1 — direct", fmt(t.scope1)],
            ["Scope 2 — electricity (location)", fmt(t.scope2Location)],
            ["Scope 2 — electricity (market)", fmt(t.scope2Market)],
            ["Scope 3 — value chain", fmt(t.scope3)],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
              <dd className="font-semibold font-data" style={{ color: "var(--text)" }}>{val} t CO2e</dd>
            </div>
          ))}
          <div className="flex justify-between pt-3 text-base" style={{ borderTop: "1px solid var(--divider)" }}>
            <dt className="font-bold" style={{ color: "var(--text)" }}>Total</dt>
            <dd className="font-bold font-data" style={{ color: "var(--primary)" }}>{fmt(t.total)} t CO2e</dd>
          </div>
        </dl>
      </div>

      {byPeriod.filter((p) => p.period !== "untagged").length > 0 && (
        <div className="card mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            By reporting period
          </h2>
          {yoy && (
            <p
              className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold"
              style={
                yoy.pct <= 0
                  ? { background: "var(--primary-tint)", color: "var(--primary)" }
                  : { background: "var(--warning-tint)", color: "var(--warning-strong)" }
              }
            >
              {yoy.pct <= 0 ? "▼" : "▲"} {Math.abs(yoy.pct).toFixed(1)}% vs {yoy.previous}
            </p>
          )}
          <dl className="mt-3 space-y-2 text-sm">
            {byPeriod
              .filter((p) => p.period !== "untagged")
              .map((p) => (
                <div key={p.period} className="flex justify-between">
                  <dt style={{ color: "var(--text)" }}>{p.period}</dt>
                  <dd className="font-semibold font-data" style={{ color: "var(--text)" }}>
                    {(p.total / 1000).toLocaleString("en-US", { maximumFractionDigits: 2 })} t CO2e
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      )}

      <p className="mt-8 text-xs" style={{ color: "var(--text-muted)" }}>
        Prepared by {brand?.brandName ?? "your consultant"}. Figures reflect data received and reviewed to date.
      </p>
    </main>
  );
}
