import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/store";
import { generateReport } from "@/lib/actions";
import { totals } from "@/lib/calc";
import { canGenerateReport } from "@/lib/progress";
import { PageHeader } from "@/components/ui";
import { questionnaireMapping, QUESTIONNAIRE_FORMATS } from "@/lib/mapping";

export default async function Reports({ searchParams }: { searchParams: { format?: string } }) {
  const user = (await currentUser())!;
  const company = await getCompany(user.companyId);
  const t = totals(company);
  const ready = canGenerateReport(company);
  const s = company.sectionStatus;
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  const format = searchParams.format && QUESTIONNAIRE_FORMATS.includes(searchParams.format) ? searchParams.format : null;
  const mapping = format ? questionnaireMapping(company, format) : null;

  const checks: [string, boolean, string][] = [
    ["Connections complete", s.connections === "complete", "QuickBooks and utility connected"],
    ["Scope 1 complete", s.scope1 === "complete", "All four subsections answered or N/A"],
    ["Scope 2 complete", s.scope2 === "complete", "Utility data reviewed"],
    ["Scope 3 complete (recommended)", s.scope3 === "complete", "Required for CDP/EcoVadis completeness"],
    ["Social & Governance (recommended)", s.social === "complete" && s.governance === "complete", "Needed for full questionnaire coverage"],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={company.reportGeneratedAt ? "Your Report is Ready" : "Generate Your Report"}
        subtitle="Run the pre-flight check, generate your outputs, and copy your numbers into your customer's platform." />

      <div className="card mb-6 grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
        {[["Scope 1", t.scope1], ["Scope 2", t.scope2Location], ["Scope 3", t.scope3], ["Total", t.total]].map(([label, v]) => (
          <div key={label as string}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-1 text-xl font-bold ${label === "Total" ? "text-brand-700" : "text-navy-900"}`}>{fmt(v as number)}</p>
            <p className="text-xs text-slate-400">tCO2e</p>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold text-navy-900">Pre-flight checklist</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {checks.map(([label, ok, detail]) => (
            <li key={label} className="flex items-center gap-3">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${ok ? "bg-brand-100 text-brand-700" : "bg-red-100 text-red-600"}`}>
                {ok ? "✓" : "!"}
              </span>
              <span className="font-medium text-slate-700">{label}</span>
              <span className="text-xs text-slate-400">— {detail}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="card flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-navy-900">📊 GHG Inventory Report</h3>
            <p className="mt-1 text-sm text-slate-500">Audit-ready PDF: Scope 1, 2 (dual reporting), 3, methodology, and data quality notes.</p>
          </div>
          {company.reportGeneratedAt ? (
            <Link href="/report/ghg" className="btn-primary">View / Download</Link>
          ) : (
            <form action={generateReport}>
              <button className="btn-primary" disabled={!ready}>Generate PDF</button>
            </form>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-navy-900">🗂️ Questionnaire Helper</h3>
          <p className="mt-1 text-sm text-slate-500">
            Select your customer&rsquo;s questionnaire format to see exactly which of your numbers answers which question. Copy them into their platform.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUESTIONNAIRE_FORMATS.map((f) => (
              <Link key={f} href={`/reports?format=${encodeURIComponent(f)}`}
                className={`btn-secondary px-3 py-1.5 text-xs ${format === f ? "border-brand-500 bg-brand-50 text-brand-700" : ""}`}>
                {f}
              </Link>
            ))}
          </div>
          {mapping && (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-2">Question</th>
                  <th className="pb-2">Their field</th>
                  <th className="pb-2 text-right">Your answer</th>
                </tr>
              </thead>
              <tbody>
                {mapping.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-2 text-xs font-bold text-slate-400">{row.questionId}</td>
                    <td className="py-2 pr-4 text-slate-700">{row.question}{row.note && <span className="block text-xs text-slate-400">{row.note}</span>}</td>
                    <td className="py-2 text-right font-semibold text-navy-900">{row.yourValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-navy-900">🔍 Audit Trail</h3>
            <p className="mt-1 text-sm text-slate-500">Every data point, its source, the emission factor used, and who entered it. Always available.</p>
          </div>
          <Link href="/report/audit" className="btn-secondary">View / Download</Link>
        </div>
      </div>

      {company.reportGeneratedAt && (
        <p className="mt-6 text-center text-sm text-slate-500">
          Done filing? See <Link href="/gaps" className="font-medium text-brand-700 underline">how to improve your score next year</Link>.
        </p>
      )}
    </div>
  );
}
