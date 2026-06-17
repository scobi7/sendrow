import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { totals } from "@/lib/calc";
import { canGenerateReport, progressPercent } from "@/lib/progress";
import { KpiCard, IntegrationCard, ComplianceTracker, StatusDot } from "@/components/ui";
import { ScopeChartToggle } from "@/components/scope-chart";
import { SectionName } from "@/lib/types";

const SECTIONS: [SectionName, string, string, string][] = [
  ["connections", "Connections", "/connections", "Link QuickBooks and your utility account"],
  ["scope1", "Scope 1", "/scope1", "Fleet fuel, natural gas, refrigerants, equipment"],
  ["scope2", "Scope 2", "/scope2", "Electricity — pre-filled from utility data"],
  ["scope3", "Scope 3", "/scope3", "Value chain — pre-filled from QuickBooks"],
  ["social", "Social", "/social", "Headcount, safety, training"],
  ["governance", "Governance", "/governance", "Leadership and policy checklist"],
  ["reports", "Reports", "/reports", "Generate your GHG inventory"],
];

const STEP_LABELS = ["Connect", "Scope 1", "Scope 2", "Scope 3", "Social", "Govern.", "Reports"];

export default async function Dashboard() {
  const user = (await currentUser())!;
  const company = await loadCompany(user.companyId);
  const pct = progressPercent(company);
  const t = totals(company);
  const ready = canGenerateReport(company);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

  const currentStep = SECTIONS.findIndex(([key]) => company.sectionStatus[key] !== "complete");
  const trackerIndex = currentStep === -1 ? SECTIONS.length : currentStep;
  const remaining = SECTIONS.filter(([key]) => company.sectionStatus[key] !== "complete").length;

  const qb = company.connections.quickbooks;
  const util = company.connections.utility;

  return (
    <div className="mx-auto max-w-2xl">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display" style={{ color: "var(--text)" }}>
            {user.name.split(" ")[0]}&rsquo;s Dashboard
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{company.name}</p>
        </div>
        <Link
          href="/reports"
          className="btn btn-primary text-sm"
          style={!ready ? { opacity: 0.4, pointerEvents: "none" } : {}}
        >
          Generate Report
        </Link>
      </div>

      {/* KPI 2×2 grid */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <KpiCard
          label="Total emissions"
          value={`${fmt(t.total)} tCO₂e`}
          caption="YTD, Scopes 1–3"
        />
        <KpiCard
          label="Scope 1"
          value={`${fmt(t.scope1)} tCO₂e`}
          caption="Direct emissions"
        />
        <KpiCard
          label="Scope 2"
          value={`${fmt(t.scope2Location)} tCO₂e`}
          caption="Purchased energy"
        />
        <KpiCard
          label="Progress"
          value={`${pct}%`}
          caption={remaining > 0 ? `${remaining} section${remaining !== 1 ? "s" : ""} remaining` : "All sections complete"}
        />
      </div>

      {/* Integration cards */}
      <div className="mb-4 space-y-3">
        <IntegrationCard
          name="QuickBooks"
          initials="QB"
          connected={qb.connected}
          lastSynced={qb.lastSynced}
        />
        <IntegrationCard
          name="Utility Account"
          initials="U"
          connected={util.connected}
          lastSynced={util.lastSynced}
        />
      </div>

      {/* Emissions by scope — bar / donut toggle */}
      <div
        className="mb-4 p-5"
        style={{
          background: "var(--primary-tint)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <ScopeChartToggle
          data={[
            { label: "Scope 1", value: t.scope1 },
            { label: "Scope 2", value: t.scope2Location },
            { label: "Scope 3", value: t.scope3 },
          ]}
        />
      </div>

      {/* Reporting status stepper */}
      <div
        className="mb-4 p-5"
        style={{
          background: "var(--primary-tint)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <h2 className="mb-5 text-sm font-bold font-display" style={{ color: "var(--text)" }}>
          Reporting status
        </h2>
        <ComplianceTracker steps={STEP_LABELS} currentIndex={trackerIndex} />
      </div>

      {/* Section checklist */}
      <div className="space-y-2">
        {SECTIONS.map(([key, name, href, help]) => {
          const status = company.sectionStatus[key];
          return (
            <div
              key={key}
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--divider)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div className="flex items-center gap-3">
                <StatusDot status={status} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{help}</p>
                </div>
              </div>
              <Link href={href} className="btn btn-secondary px-3 py-1.5 text-xs">Go</Link>
            </div>
          );
        })}
      </div>

    </div>
  );
}
