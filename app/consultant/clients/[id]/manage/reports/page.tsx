import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";
import { loadCompany } from "@/lib/store";
import { totals } from "@/lib/calc";
import { canGenerateReport, progressPercent } from "@/lib/progress";
import { PageHeader } from "@/components/ui";
import { questionnaireMapping, QUESTIONNAIRE_FORMATS } from "@/lib/mapping";
import { consultantGenerateReport } from "@/lib/consultant-actions";

export default async function ManageReports({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const [{ id }, { format: rawFormat }] = await Promise.all([params, searchParams]);
  const user = await currentUser();
  if (!user || user.role !== "consultant") redirect("/login");

  const link = await db.query.consultantClients.findFirst({
    where: and(eq(consultantClients.consultantId, user.id), eq(consultantClients.companyId, id), isNull(consultantClients.archivedAt)),
  });
  if (!link) notFound();

  const company = await loadCompany(id);
  const t = totals(company);
  const ready = canGenerateReport(company);
  const pct = progressPercent(company);
  const s = company.sectionStatus;
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  const format = rawFormat && QUESTIONNAIRE_FORMATS.includes(rawFormat) ? rawFormat : null;
  const mapping = format ? questionnaireMapping(company, format) : null;
  const base = `/consultant/clients/${id}/manage`;

  const boundGenerate = consultantGenerateReport.bind(null, id);

  const checks: [string, boolean, string][] = [
    ["Connections complete", s.connections === "complete", "Spend and utility data on file"],
    ["Scope 1 complete", s.scope1 === "complete", "All subsections answered or N/A"],
    ["Scope 2 complete", s.scope2 === "complete", "Utility data reviewed"],
    ["Scope 3 complete (recommended)", s.scope3 === "complete", "Required for CDP/EcoVadis completeness"],
  ];

  return (
    <div>
      <PageHeader
        title={company.reportGeneratedAt ? "Report Ready" : "Generate Report"}
        subtitle={`${pct}% complete for ${company.name}. ${ready ? "Ready to generate." : "Complete required sections first."}`}
      />

      <div className="card mb-6 grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
        {[["Scope 1", t.scope1], ["Scope 2", t.scope2Location], ["Scope 3", t.scope3], ["Total", t.total]].map(([label, v]) => (
          <div key={label as string}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="mt-1 text-xl font-bold font-data" style={{ color: label === "Total" ? "var(--primary)" : "var(--text)" }}>
              {fmt(v as number)}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>tCO2e</p>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Pre-flight checklist</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {checks.map(([label, ok, detail]) => (
            <li key={label} className="flex items-center gap-3">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: ok ? "var(--primary-tint)" : "var(--danger-tint)", color: ok ? "var(--primary)" : "var(--danger)" }}
              >
                {ok ? "✓" : "!"}
              </span>
              <span className="font-medium" style={{ color: "var(--text)" }}>{label}</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>— {detail}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="card flex items-center justify-between">
          <div>
            <h3 className="font-semibold font-display" style={{ color: "var(--text)" }}>GHG Inventory Report</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Audit-ready PDF for {company.name}: Scope 1, 2 (dual), 3, methodology, data quality notes.
            </p>
          </div>
          {company.reportGeneratedAt ? (
            <div className="flex flex-col items-end gap-2">
              <Link href={`/consultant/report/${id}/ghg`} className="btn btn-secondary text-sm">View report</Link>
              <a href={`/api/report/pdf?companyId=${id}`} download className="btn btn-primary text-sm">Download PDF</a>
            </div>
          ) : (
            <form action={boundGenerate}>
              <button className="btn btn-primary" disabled={!ready}>Generate PDF</button>
            </form>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold font-display" style={{ color: "var(--text)" }}>Questionnaire Helper</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Select the customer&rsquo;s questionnaire format to map {company.name}&rsquo;s numbers to specific questions.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUESTIONNAIRE_FORMATS.map((f) => (
              <Link
                key={f}
                href={`${base}/reports?format=${encodeURIComponent(f)}`}
                className="btn btn-secondary px-3 py-1.5 text-xs"
                style={format === f ? { borderColor: "var(--primary)", background: "var(--primary-tint)", color: "var(--primary)" } : {}}
              >
                {f}
              </Link>
            ))}
          </div>
          {mapping && (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide" style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}>
                  <th className="pb-2 pr-2">Question</th>
                  <th className="pb-2">Their field</th>
                  <th className="pb-2 text-right">Answer</th>
                </tr>
              </thead>
              <tbody>
                {mapping.map((row, i) => (
                  <tr key={i} className="align-top" style={{ borderBottom: "1px solid var(--divider)" }}>
                    <td className="py-2 pr-2 text-xs font-bold" style={{ color: "var(--text-muted)" }}>{row.questionId}</td>
                    <td className="py-2 pr-4" style={{ color: "var(--text)" }}>
                      {row.question}
                      {row.note && <span className="block text-xs" style={{ color: "var(--text-muted)" }}>{row.note}</span>}
                    </td>
                    <td className="py-2 text-right font-semibold font-data" style={{ color: "var(--text)" }}>{row.yourValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <h3 className="font-semibold font-display" style={{ color: "var(--text)" }}>Audit Trail</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Every data point, its source, the emission factor used, and who entered it.
            </p>
          </div>
          <Link href={`/consultant/report/${id}/audit`} className="btn btn-secondary">View / Download</Link>
        </div>
      </div>
    </div>
  );
}
