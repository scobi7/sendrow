import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { loadCompany, getFactor } from "@/lib/store";
import { totals } from "@/lib/calc";
import { fiscalPeriodLabel } from "@/lib/mapping";
import PrintButton from "../print-button";

export default async function GHGReport() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const company = await loadCompany(user.companyId);
  const t = totals(company);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const s1 = company.calcs.filter((c) => c.scope === 1);
  const s2 = company.calcs.filter((c) => c.scope === 2);
  const s3 = company.calcs.filter((c) => c.scope === 3);
  const estimates = company.calcs.filter((c) => c.basis !== "measured");
  const factorIds = Array.from(new Set(company.calcs.map((c) => c.factorId).filter(Boolean))) as string[];

  return (
    <main className="mx-auto max-w-3xl px-8 py-10" style={{ background: "#fff", color: "var(--text)" }}>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/reports" className="text-sm font-medium hover:opacity-70" style={{ color: "var(--primary)" }}>
          ← Back to reports
        </Link>
        <div className="flex gap-2 no-print">
          <PrintButton label="Print" />
          <a href="/api/report/pdf" download className="btn btn-primary text-sm px-4 py-2">Download PDF</a>
        </div>
      </div>

      <header className="pb-6" style={{ borderBottom: `4px solid var(--primary)` }}>
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--primary)" }}>
          Greenhouse Gas Inventory Report
        </p>
        <h1 className="mt-2 text-3xl font-bold font-display" style={{ color: "var(--text)" }}>{company.name}</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Reporting period: {fiscalPeriodLabel(company)} · Industry: {company.industry}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Prepared with GreenTrack · Generated {company.reportGeneratedAt ? new Date(company.reportGeneratedAt).toLocaleDateString() : new Date().toLocaleDateString()}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>Summary of Emissions</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--divider)" }}><td className="py-2">Scope 1 — Direct emissions</td><td className="py-2 text-right font-semibold">{fmt(t.scope1)} tCO2e</td></tr>
            <tr style={{ borderBottom: "1px solid var(--divider)" }}><td className="py-2">Scope 2 — Electricity (location-based)</td><td className="py-2 text-right font-semibold">{fmt(t.scope2Location)} tCO2e</td></tr>
            <tr style={{ borderBottom: "1px solid var(--divider)" }}><td className="py-2">Scope 2 — Electricity (market-based)</td><td className="py-2 text-right font-semibold">{fmt(t.scope2Market)} tCO2e</td></tr>
            <tr style={{ borderBottom: "1px solid var(--divider)" }}><td className="py-2">Scope 3 — Value chain</td><td className="py-2 text-right font-semibold">{fmt(t.scope3)} tCO2e</td></tr>
            <tr>
              <td className="py-3 font-bold" style={{ color: "var(--text)" }}>Total (Scope 1 + 2 location-based + 3)</td>
              <td className="py-3 text-right text-lg font-bold" style={{ color: "var(--primary)" }}>{fmt(t.total)} tCO2e</td>
            </tr>
          </tbody>
        </table>
      </section>

      {[
        ["Scope 1 — Direct Emissions by Source", s1],
        ["Scope 2 — Electricity by Location (dual reporting)", s2],
        ["Scope 3 — Value Chain by Category", s3],
      ].map(([title, rows]) => (
        <section key={title as string} className="mt-8">
          <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>{title as string}</h2>
          {(rows as typeof s1).length === 0 ? (
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>No emissions recorded in this scope.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide" style={{ borderBottom: "2px solid var(--divider)", color: "var(--text-muted)" }}>
                  <th className="pb-2">Source</th>
                  <th className="pb-2 text-right">tCO2e</th>
                  {title === "Scope 2 — Electricity by Location (dual reporting)" && <th className="pb-2 text-right">Market-based</th>}
                </tr>
              </thead>
              <tbody>
                {(rows as typeof s1).map((c) => (
                  <tr key={c.id} className="align-top" style={{ borderBottom: "1px solid var(--divider)" }}>
                    <td className="py-2">
                      {c.category}
                      {c.basis !== "measured" && (
                        <span
                          className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                          style={{ background: "var(--warning-tint)", color: "var(--warning)" }}
                        >
                          {c.basis === "spend_based" ? "Spend-based" : "Estimate"}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right font-medium">{fmt(c.co2eTons)}</td>
                    {title === "Scope 2 — Electricity by Location (dual reporting)" && <td className="py-2 text-right font-medium">{fmt(c.marketBasedTons ?? 0)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}

      <section className="mt-8">
        <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>Methodology Statement</h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          This inventory was prepared in accordance with the GHG Protocol Corporate Accounting and Reporting Standard.
          Scope 2 emissions are reported using both the location-based and market-based methods per the GHG Protocol
          Scope 2 Guidance. Scope 3 categories derived from financial records use the spend-based method with USEEIO
          sector emission intensities. Activity data was sourced from utility records, accounting system exports, and
          management estimates as noted. All calculations are traceable in the accompanying Audit Trail document.
        </p>
        <h3 className="mt-4 text-sm font-bold" style={{ color: "var(--text)" }}>Emission factors used</h3>
        <ul className="mt-2 space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {factorIds.map((fid) => {
            const f = getFactor(fid);
            return <li key={fid}>• {f.factor_name}: {f.value} {f.unit} — {f.source} ({f.year_effective})</li>;
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>Data Quality Notes</h2>
        {estimates.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>All reported values are based on measured activity data.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {estimates.map((c) => (
              <li key={c.id}>
                • <strong style={{ color: "var(--text)" }}>{c.category}</strong>: {c.basis === "spend_based"
                  ? "calculated from financial spend using USEEIO sector averages — a recognized estimation method for first-time reporters."
                  : "estimated; flagged low-confidence. Replacing with measured data is recommended next cycle."}
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-10 pt-4 text-xs" style={{ borderTop: "1px solid var(--divider)", color: "var(--text-muted)" }}>
        {company.name} — GHG Inventory — {fiscalPeriodLabel(company)} — Page generated by GreenTrack.
        Emission factors are representative published values; verify against cited sources before external submission.
      </footer>
    </main>
  );
}
