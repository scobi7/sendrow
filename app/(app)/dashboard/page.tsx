import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/store";
import { totals } from "@/lib/calc";
import { canGenerateReport, progressPercent } from "@/lib/progress";
import { PageHeader, ProgressBar, StatusDot } from "@/components/ui";
import { SectionName } from "@/lib/types";

const SECTIONS: [SectionName, string, string, string][] = [
  ["connections", "Connections", "/connections", "Link QuickBooks and your utility account"],
  ["scope1", "Scope 1 — Direct emissions", "/scope1", "Fleet fuel, natural gas, refrigerants, equipment"],
  ["scope2", "Scope 2 — Electricity", "/scope2", "Pre-filled from your utility data"],
  ["scope3", "Scope 3 — Value chain", "/scope3", "Pre-filled from QuickBooks, plus commuting and waste"],
  ["social", "Social — Workforce", "/social", "Headcount, safety, training"],
  ["governance", "Governance — Policies", "/governance", "Leadership and policy checklist"],
  ["reports", "Reports", "/reports", "Generate your GHG inventory and questionnaire answers"],
];

export default function Dashboard() {
  const user = currentUser()!;
  const company = getCompany(user.companyId);
  const pct = progressPercent(company);
  const t = totals(company);
  const ready = canGenerateReport(company);
  const firstTime = company.sectionStatus.connections === "not_started";
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between">
        <PageHeader title={`Welcome back, ${user.name.split(" ")[0]}`} subtitle={company.name} />
        <Link href="/reports"
          className={ready ? "btn-primary" : "btn pointer-events-none bg-slate-200 text-slate-400"}>
          Generate Report
        </Link>
      </div>

      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-600">Overall progress</span>
        <span className="font-bold text-navy-900">{pct}%</span>
      </div>
      <ProgressBar percent={pct} className="mb-8" />

      {firstTime && (
        <Link href="/connections" className="mb-6 block rounded-xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm font-medium text-brand-800 hover:bg-brand-100">
          👉 Start here — connect your QuickBooks and utility account. The two connections do most of the work for you.
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {SECTIONS.map(([key, name, href, help]) => {
            const status = company.sectionStatus[key];
            return (
              <div key={key} className="card flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <StatusDot status={status} />
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{name}</p>
                    <p className="text-xs text-slate-400">{help}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium capitalize text-slate-400">{status.replace("_", " ")}</span>
                  <Link href={href} className="btn-secondary px-3 py-1.5 text-xs">Go</Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card h-fit">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Live emissions summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-slate-600">Scope 1</dt><dd className="font-semibold">{fmt(t.scope1)} t</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Scope 2 (location)</dt><dd className="font-semibold">{fmt(t.scope2Location)} t</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Scope 2 (market)</dt><dd className="font-semibold">{fmt(t.scope2Market)} t</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">Scope 3</dt><dd className="font-semibold">{fmt(t.scope3)} t</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
              <dt className="font-bold text-navy-900">Total CO2e</dt>
              <dd className="font-bold text-brand-700">{fmt(t.total)} t</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-400">
            Updates in real time as you enter data. All calculations are performed server-side and logged to your audit trail.
          </p>
        </div>
      </div>
    </div>
  );
}
