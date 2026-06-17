import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { totals } from "@/lib/calc";
import { canGenerateReport, progressPercent } from "@/lib/progress";
import { IntegrationCard, ComplianceTracker, StatusDot, ProgressBar, ScopeBarChart, ScopeDonutChart } from "@/components/ui";
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

const STEP_LABELS = ["Connect", "Scope 1", "Scope 2", "Scope 3", "Social", "Govern.", "Reports"];

export default async function Dashboard() {
  const user = (await currentUser())!;
  const company = await loadCompany(user.companyId);
  const pct = progressPercent(company);
  const t = totals(company);
  const ready = canGenerateReport(company);
  const firstTime = company.sectionStatus.connections === "not_started";
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  const remaining = SECTIONS.filter(([key]) => company.sectionStatus[key] !== "complete").length;

  const currentStep = SECTIONS.findIndex(([key]) => company.sectionStatus[key] !== "complete");
  const trackerIndex = currentStep === -1 ? SECTIONS.length : currentStep;

  const qb = company.connections.quickbooks;
  const util = company.connections.utility;

  const chartData = [
    { label: "Scope 1", value: t.scope1 },
    { label: "Scope 2", value: t.scope2Location },
    { label: "Scope 3", value: t.scope3 },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-display" style={{ color: "var(--text)" }}>
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{company.name}</p>
        </div>
        <Link
          href="/reports"
          className="btn btn-primary"
          style={!ready ? { opacity: 0.4, pointerEvents: "none" } : {}}
        >
          Generate Report
        </Link>
      </div>

      {/* Progress */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium" style={{ color: "var(--text-muted)" }}>Overall progress</span>
          <span className="font-semibold font-data" style={{ color: "var(--text)" }}>{pct}%</span>
        </div>
        <ProgressBar percent={pct} />
      </div>

      {/* Stepper */}
      <div className="p-5" style={{ background: "var(--card)", borderRadius: "var(--radius-lg)" }}>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Reporting Status
        </h2>
        <ComplianceTracker steps={STEP_LABELS} currentIndex={trackerIndex} />
      </div>

      {firstTime && (
        <Link
          href="/connections"
          className="block px-5 py-4 text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: "var(--card)",
            border: "1px solid var(--primary)",
            borderRadius: "var(--radius-sm)",
            color: "var(--primary)",
          }}
        >
          Start here → connect your QuickBooks and utility account. The two connections do most of the work for you.
        </Link>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total Emissions",
            value: fmt(t.total),
            caption: "tCO₂e · YTD",
            accent: false,
          },
          {
            label: "Scope 1",
            value: fmt(t.scope1),
            caption: "Direct · tCO₂e",
            accent: false,
          },
          {
            label: "Scope 2",
            value: fmt(t.scope2Location),
            caption: "Electricity · tCO₂e",
            accent: false,
          },
          {
            label: "Progress",
            value: `${pct}%`,
            caption: remaining > 0
              ? `${remaining} of 7 complete`
              : "All sections complete",
            accent: true,
          },
        ].map(({ label, value, caption, accent }) => (
          <div
            key={label}
            className="flex flex-col justify-between rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid rgba(15,50,28,0.06)" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </p>
            <p
              className="mt-3 font-data text-4xl font-extrabold leading-none sm:text-5xl"
              style={{ color: accent ? "var(--primary)" : "var(--text)" }}
            >
              {value}
            </p>
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              {caption}
            </p>
          </div>
        ))}
      </div>

      {/* ── Chart panels ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Bar chart */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--card)", border: "1px solid rgba(15,50,28,0.06)" }}
        >
          <p
            className="mb-5 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Emissions by Scope
          </p>
          <ScopeBarChart data={chartData} />
        </div>

        {/* Donut chart */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--card)", border: "1px solid rgba(15,50,28,0.06)" }}
        >
          <p
            className="mb-5 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Scope Breakdown
          </p>
          <ScopeDonutChart data={chartData} />
        </div>
      </div>

      {/* ── Integration cards ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <IntegrationCard name="QuickBooks" initials="QB" connected={qb.connected} lastSynced={qb.lastSynced} />
        <IntegrationCard name="Utility Account" initials="U" connected={util.connected} lastSynced={util.lastSynced} />
      </div>

      {/* ── Section checklist ── */}
      <div className="space-y-3">
        {SECTIONS.map(([key, name, href, help]) => {
          const status = company.sectionStatus[key];
          return (
            <div
              key={key}
              className="flex items-center justify-between px-5 py-4"
              style={{ background: "var(--card)", borderRadius: "var(--radius-sm)" }}
            >
              <div className="flex items-center gap-3">
                <StatusDot status={status} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{help}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium capitalize" style={{ color: "var(--text-muted)" }}>
                  {status.replace("_", " ")}
                </span>
                <Link href={href} className="btn btn-secondary px-3 py-1.5 text-xs">Go</Link>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
