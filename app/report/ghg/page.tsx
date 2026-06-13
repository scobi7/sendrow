import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getCompany, getFactor } from "@/lib/store";
import { totals } from "@/lib/calc";
import { fiscalPeriodLabel } from "@/lib/mapping";
import PrintButton from "../print-button";

export default async function GHGReport() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const company = await getCompany(user!.companyId);
  const t = totals(company);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const s1 = company.calcs.filter((c) => c.scope === 1);
  const s2 = company.calcs.filter((c) => c.scope === 2);
  const s3 = company.calcs.filter((c) => c.scope === 3);
  const estimates = company.calcs.filter((c) => c.basis !== "measured");
  const factorIds = Array.from(new Set(company.calcs.map((c) => c.factorId).filter(Boolean))) as string[];

  return (
    <main className="mx-auto max-w-3xl bg-white px-8 py-10 text-slate-800">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href="/reports" className="text-sm text-brand-700 hover:underline">← Back to reports</Link>
        <PrintButton label="Download PDF" />
      </div>

      <header className="border-b-4 border-brand-600 pb-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Greenhouse Gas Inventory Report</p>
        <h1 className="mt-2 text-3xl font-bold text-navy-900">{company.name}</h1>
        <p className="mt-1 text-slate-500">Reporting period: {fiscalPeriodLabel(company)} · Industry: {company.industry}</p>
        <p className="text-xs text-slate-400">Prepared with GreenTrack · Generated {company.reportGeneratedAt ? new Date(company.reportGeneratedAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-navy-900">Summary of Emissions</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-200"><td className="py-2">Scope 1 — Direct emissions</td><td className="py-2 text-right font-semibold">{fmt(t.scope1)} tCO2e</td></tr>
            <tr className="border-b border-slate-200"><td className="py-2">Scope 2 — Electricity (location-based)</td><td className="py-2 text-right font-semibold">{fmt(t.scope2Location)} tCO2e</td></tr>
            <tr className="border-b border-slate-200"><td className="py-2">Scope 2 — Electricity (market-based)</td><td className="py-2 text-right font-semibold">{fmt(t.scope2Market)} tCO2e</td></tr>
            <tr className="border-b border-slate-200"><td className="py-2">Scope 3 — Value chain</td><td className="py-2 text-right font-semibold">{fmt(t.scope3)} tCO2e</td></tr>
            <tr><td className="py-3 font-bold text-navy-900">Total (Scope 1 + 2 location-based + 3)</td><td className="py-3 text-right text-lg font-bold text-brand-700">{fmt(t.total)} tCO2e</td></tr>
          </tbody>
        </table>
      </section>

      {[
        ["Scope 1 — Direct Emissions by Source", s1],
        ["Scope 2 — Electricity by Location (dual reporting)", s2],
        ["Scope 3 — Value Chain by Category", s3],
      ].map(([title, rows]) => (
        <section key={title as string} className="mt-8">
          <h2 className="text-lg font-bold text-navy-900">{title as string}</h2>
          {(rows as typeof s1).length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No emissions recorded in this scope.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Source</th>
                  <th className="pb-2 text-right">tCO2e</th>
                  {title === "Scope 2 — Electricity by Location (dual reporting)" && <th className="pb-2 text-right">Market-based</th>}
                </tr>
              </thead>
              <tbody>
                {(rows as typeof s1).map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 align-top">
                    <td className="py-2">
                      {c.category}
                      {c.basis !== "measured" && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">{c.basis === "spend_based" ? "Spend-based" : "Estimate"}</span>}
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
        <h2 className="text-lg font-bold text-navy-900">Methodology Statement</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This inventory was prepared in accordance with the GHG Protocol Corporate Accounting and Reporting Standard.
          Scope 2 emissions are reported using both the location-based and market-based methods per the GHG Protocol
          Scope 2 Guidance. Scope 3 categories derived from financial records use the spend-based method with USEEIO
          sector emission intensities. Activity data was sourced from utility records, accounting system exports, and
          management estimates as noted. All calculations are traceable in the accompanying Audit Trail document.
        </p>
        <h3 className="mt-4 text-sm font-bold text-navy-900">Emission factors used</h3>
        <ul className="mt-2 space-y-1 text-xs text-slate-500">
          {factorIds.map((fid) => {
            const f = getFactor(fid);
            return <li key={fid}>• {f.factor_name}: {f.value} {f.unit} — {f.source} ({f.year_effective})</li>;
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-navy-900">Data Quality Notes</h2>
        {estimates.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">All reported values are based on measured activity data.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {estimates.map((c) => (
              <li key={c.id}>
                • <strong>{c.category}</strong>: {c.basis === "spend_based"
                  ? "calculated from financial spend using USEEIO sector averages — a recognized estimation method for first-time reporters."
                  : "estimated; flagged low-confidence. Replacing with measured data is recommended next cycle."}
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-400">
        {company.name} — GHG Inventory — {fiscalPeriodLabel(company)} — Page generated by GreenTrack.
        Demo build: emission factors are representative published values; verify against cited sources before external submission.
      </footer>
    </main>
  );
}
