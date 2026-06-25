import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { generateReport } from "@/lib/actions";
import { totals } from "@/lib/calc";
import { canGenerateReport } from "@/lib/progress";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { questionnaireMapping, QUESTIONNAIRE_FORMATS } from "@/lib/mapping";

export default async function Reports({ searchParams }: { searchParams: Promise<{ format?: string }> }) {
  const [{ format: rawFormat }, user] = await Promise.all([searchParams, currentUser()]);
  const company = await loadCompany(user!.companyId);
  const t = totals(company);
  const ready = canGenerateReport(company);
  const s = company.sectionStatus;
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  const format = rawFormat && QUESTIONNAIRE_FORMATS.includes(rawFormat) ? rawFormat : null;
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
      <PageHeader
        title={company.reportGeneratedAt ? "Your Report is Ready" : "Generate Your Report"}
        subtitle="Run the pre-flight check, generate your outputs, and copy your numbers into your customer's platform."
      />

      <div className="card mb-6 grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
        {[["Scope 1", t.scope1], ["Scope 2", t.scope2Location], ["Scope 3", t.scope3], ["Total", t.total]].map(([label, v]) => (
          <div key={label as string}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p
              className="mt-1 text-xl font-bold font-data"
              style={{ color: label === "Total" ? "var(--primary)" : "var(--text)" }}
            >
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
                style={{
                  background: ok ? "var(--primary-tint)" : "var(--danger-tint)",
                  color: ok ? "var(--primary)" : "var(--danger)",
                }}
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
              Audit-ready PDF: Scope 1, 2 (dual reporting), 3, methodology, and data quality notes.
            </p>
          </div>
          {company.reportGeneratedAt ? (
            <div className="flex flex-col gap-2 items-end">
              <Link href="/report/ghg" className="btn btn-secondary text-sm">View report</Link>
              <a href="/api/report/pdf" download className="btn btn-primary text-sm">Download PDF</a>
            </div>
          ) : (
            <form action={generateReport}>
              <SubmitButton className="btn btn-primary" disabled={!ready} pendingText="Generating…">Generate PDF</SubmitButton>
            </form>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold font-display" style={{ color: "var(--text)" }}>Questionnaire Helper</h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Select your customer&rsquo;s questionnaire format to see exactly which of your numbers answers which question. Copy them into their platform.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUESTIONNAIRE_FORMATS.map((f) => (
              <Link
                key={f}
                href={`/reports?format=${encodeURIComponent(f)}`}
                className="btn btn-secondary px-3 py-1.5 text-xs"
                style={
                  format === f
                    ? { borderColor: "var(--primary)", background: "var(--primary-tint)", color: "var(--primary)" }
                    : {}
                }
              >
                {f}
              </Link>
            ))}
          </div>
          {mapping && (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr
                  className="text-left text-xs uppercase tracking-wide"
                  style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}
                >
                  <th className="pb-2 pr-2">Question</th>
                  <th className="pb-2">Their field</th>
                  <th className="pb-2 text-right">Your answer</th>
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
              Every data point, its source, the emission factor used, and who entered it. Always available.
            </p>
          </div>
          <Link href="/report/audit" className="btn btn-secondary">View / Download</Link>
        </div>
      </div>

      {company.reportGeneratedAt && (
        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Done filing? See{" "}
          <Link href="/gaps" className="font-medium underline" style={{ color: "var(--primary)" }}>
            how to improve your score next year
          </Link>.
        </p>
      )}
    </div>
  );
}
