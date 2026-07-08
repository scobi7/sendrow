import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { intakeSessions, dataRequests, pipelineStatus, emissionLineItems } from "@/lib/db/schema";
import { loadCompany } from "@/lib/store";
import { getLineItemTotals } from "@/lib/report-totals";

const STATUS_LABEL: Record<string, string> = {
  auto_approved: "Auto-approved",
  approved: "Approved",
  pending_review: "Under review",
  needs_info: "Needs info",
  rejected: "Rejected",
};

const STATUS_COLOR: Record<string, string> = {
  auto_approved: "var(--primary)",
  approved: "var(--primary)",
  pending_review: "#d97706",
  needs_info: "#dc2626",
  rejected: "#6b7280",
};

export default async function Dashboard() {
  const user = await currentUser();
  if (!user?.companyId) redirect("/onboarding");

  const companyId = user.companyId;

  const [company, sessions, openRequests, pipeline, lineItemTotals, lineItemQuality] = await Promise.all([
    loadCompany(companyId),
    db.select().from(intakeSessions).where(eq(intakeSessions.companyId, companyId)).orderBy(desc(intakeSessions.createdAt)).limit(5),
    db.select().from(dataRequests).where(eq(dataRequests.companyId, companyId)).then(r => r.filter(d => d.status === "open")),
    db.select().from(pipelineStatus).where(eq(pipelineStatus.companyId, companyId)).then(r => r[0] ?? null),
    getLineItemTotals(companyId),
    db.select({ confidence: emissionLineItems.confidence, status: emissionLineItems.status })
      .from(emissionLineItems).where(eq(emissionLineItems.companyId, companyId)),
  ]);

  const pStatus = pipeline?.status ?? "not_started";
  const hasApprovedSession = sessions.some(s => s.status === "auto_approved" || s.status === "approved");
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

  // Data quality: unmapped rows count against "% actual" — they are data we hold but can't yet use
  const qTotal = lineItemQuality.length;
  const qUnmapped = lineItemQuality.filter((i) => i.status === "unmapped").length;
  const qActual = lineItemQuality.filter((i) => i.status !== "unmapped" && i.confidence === "actual").length;
  const qEstimated = qTotal - qActual - qUnmapped;
  const pct = (n: number) => (qTotal > 0 ? Math.round((n / qTotal) * 100) : 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-display" style={{ color: "var(--text)" }}>
            {company.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Welcome back, {user.name.split(" ")[0]}
          </p>
        </div>
        <Link
          href="/reports"
          className="btn btn-primary"
          style={!hasApprovedSession ? { opacity: 0.4, pointerEvents: "none" } : {}}
        >
          Generate Report
        </Link>
      </div>

      {/* Pipeline status banner */}
      <div
        className="flex items-center justify-between rounded-2xl px-5 py-4"
        style={{
          background: pStatus === "locked" ? "var(--primary-tint)" : pStatus === "in_progress" ? "#fef9c3" : "var(--card)",
          border: `1px solid ${pStatus === "locked" ? "var(--primary)" : pStatus === "in_progress" ? "#fde68a" : "var(--divider)"}`,
        }}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Pipeline</p>
          <p className="mt-0.5 font-semibold" style={{ color: "var(--text)" }}>
            {pStatus === "locked" ? "Locked — future uploads auto-process" : pStatus === "in_progress" ? "In progress — data under review" : "Not started — upload your first file"}
          </p>
        </div>
        {pStatus === "not_started" && (
          <Link href="/intake/upload" className="btn btn-primary text-sm">Upload data →</Link>
        )}
      </div>

      {/* Open data requests */}
      {openRequests.length > 0 && (
        <div className="rounded-2xl" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
          <div className="px-5 pt-4 pb-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#dc2626" }}>Action needed</p>
          </div>
          <div className="divide-y" style={{ borderColor: "#fecaca" }}>
            {openRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm" style={{ color: "var(--text)" }}>{req.description}</p>
                <Link href="/intake/upload" className="btn btn-secondary text-xs shrink-0 ml-4">Upload</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emission totals (when data imported) */}
      {lineItemTotals && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Scope 1", value: fmt(lineItemTotals.scope1), caption: "Direct · tCO₂e" },
            { label: "Scope 2", value: fmt(lineItemTotals.scope2Location), caption: "Electricity · tCO₂e" },
            { label: "Scope 3", value: fmt(lineItemTotals.scope3), caption: "Value chain · tCO₂e" },
          ].map(({ label, value, caption }) => (
            <div key={label} className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--divider)" }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</p>
              <p className="mt-2 font-data text-3xl font-extrabold" style={{ color: "var(--text)" }}>{value}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{caption}</p>
            </div>
          ))}
        </div>
      )}

      {/* Data quality bar */}
      {qTotal > 0 && (
        <div className="rounded-2xl px-5 py-4" style={{ background: "var(--card)", border: "1px solid var(--divider)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Data quality</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {pct(qActual)}% actual · {pct(qEstimated)}% estimated
              {qUnmapped > 0 && <span style={{ color: "#dc2626", fontWeight: 600 }}> · {pct(qUnmapped)}% unmapped ({qUnmapped} row{qUnmapped !== 1 ? "s" : ""})</span>}
            </p>
          </div>
          <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--divider)" }}>
            <div style={{ width: `${pct(qActual)}%`, background: "var(--primary)" }} />
            <div style={{ width: `${pct(qEstimated)}%`, background: "#d97706" }} />
            <div style={{ width: `${pct(qUnmapped)}%`, background: "#dc2626" }} />
          </div>
          {qUnmapped > 0 && (
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Unmapped rows hold 0 emissions until categorized —{" "}
              <Link href="/workpaper" className="underline" style={{ color: "#dc2626" }}>review them in the workpaper</Link>.
            </p>
          )}
        </div>
      )}

      {/* Recent uploads */}
      <div className="rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--divider)" }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Recent uploads</p>
          <Link href="/intake" className="text-xs" style={{ color: "var(--primary)" }}>View all →</Link>
        </div>
        {sessions.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No uploads yet.</p>
            <Link href="/intake/upload" className="btn btn-primary mt-4 inline-block text-sm">Upload your first file →</Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{s.filename}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {s.dataType} · {s.rowCount} rows · {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ background: `${STATUS_COLOR[s.status]}22`, color: STATUS_COLOR[s.status] }}
                >
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Upload data", href: "/intake/upload", desc: "Add a spreadsheet" },
          { label: "Workpaper", href: "/workpaper", desc: "Review line items" },
          { label: "Scope 3 screening", href: "/scope3-screening", desc: "Materiality decisions" },
        ].map(({ label, href, desc }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl px-4 py-3 transition-colors hover:opacity-80"
            style={{ background: "var(--card)", border: "1px solid var(--divider)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}
