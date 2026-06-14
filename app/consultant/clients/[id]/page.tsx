import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ensureDB, loadDB, getCompany } from "@/lib/store";
import { totals } from "@/lib/calc";
import { auditForCompany } from "@/lib/audit";
import { generateInviteToken, archiveClient } from "@/lib/actions";
import { PageHeader, StatusDot } from "@/components/ui";
import { SectionName } from "@/lib/types";
import { CopyButton } from "./copy-link";

const SECTIONS: { key: SectionName; label: string; desc: string }[] = [
  { key: "connections", label: "Connections", desc: "QuickBooks + utility" },
  { key: "scope1", label: "Scope 1", desc: "Direct emissions" },
  { key: "scope2", label: "Scope 2", desc: "Electricity" },
  { key: "scope3", label: "Scope 3", desc: "Value chain" },
  { key: "social", label: "Social", desc: "Workforce metrics" },
  { key: "governance", label: "Governance", desc: "Policies & leadership" },
  { key: "reports", label: "Reports", desc: "Generated inventory" },
];

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  complete: "Complete",
};

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { invite?: string };
}) {
  await ensureDB();
  const user = currentUser()!;
  const db = loadDB();

  const link = db.consultantClients.find(
    (cc) => cc.consultantId === user.id && cc.companyId === params.id && !cc.archivedAt
  );
  if (!link) notFound();

  let company;
  try {
    company = getCompany(params.id);
  } catch {
    notFound();
  }

  const t = totals(company);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const recentAudit = auditForCompany(company.id).slice(0, 10);

  const inviteToken = searchParams.invite;
  const inviteUrl = inviteToken
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://greentrack.app"}/connect/${inviteToken}`
    : null;

  const boundGenerate = generateInviteToken.bind(null, params.id);
  const boundArchive = archiveClient.bind(null, params.id);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/consultant" className="mb-4 inline-block text-sm text-brand-700 hover:underline">
        ← Back to clients
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{company.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {company.industry ?? "Industry not set"} ·{" "}
            {company.headcountRange ? company.headcountRange.replace(/_/g, "–") : "Headcount not set"} employees
          </p>
        </div>
        <form action={boundArchive}>
          <button className="text-xs text-slate-400 hover:text-red-600">Archive client</button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Section Status */}
          <div className="card">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Section Progress</h2>
            <div className="mt-4 space-y-2">
              {SECTIONS.map(({ key, label, desc }) => {
                const status = company.sectionStatus[key];
                return (
                  <div key={key} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <StatusDot status={status} />
                      <div>
                        <p className="text-sm font-medium text-navy-900">{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium capitalize text-slate-400">
                      {STATUS_LABEL[status] ?? status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invite Link */}
          <div className="card">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Client Invite Link</h2>
            <p className="mt-2 text-sm text-slate-500">
              Generate a 7-day invite link so your client can create their account and start entering data.
            </p>
            {inviteUrl ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="flex-1 truncate text-xs text-slate-600">{inviteUrl}</span>
                  <CopyButton value={inviteUrl} />
                </div>
                <p className="text-xs text-slate-400">This link expires in 7 days.</p>
              </div>
            ) : (
              <form action={boundGenerate} className="mt-3">
                <button className="btn-secondary text-sm">Generate invite link</button>
              </form>
            )}
          </div>

          {/* Recent Audit Log */}
          <div className="card">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Recent Activity</h2>
            {recentAudit.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No activity yet — client hasn't started filling in data.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {recentAudit.map((row) => (
                  <div key={row.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
                    <div>
                      <span className="text-xs font-medium text-slate-700 capitalize">{row.section}</span>
                      <span className="mx-1 text-slate-300">·</span>
                      <span className="text-xs text-slate-500">{row.field}</span>
                      <p className="text-xs text-slate-400">
                        {row.prev} → {row.next}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-300">
                      {new Date(row.ts).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Emissions Summary */}
        <div className="card h-fit">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Emissions Summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Scope 1</dt>
              <dd className="font-semibold">{fmt(t.scope1)} t</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Scope 2 (location)</dt>
              <dd className="font-semibold">{fmt(t.scope2Location)} t</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Scope 2 (market)</dt>
              <dd className="font-semibold">{fmt(t.scope2Market)} t</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Scope 3</dt>
              <dd className="font-semibold">{fmt(t.scope3)} t</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
              <dt className="font-bold text-navy-900">Total CO2e</dt>
              <dd className="font-bold text-brand-700">{fmt(t.total)} t</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-400">
            Updates as client enters data.
          </p>
        </div>
      </div>
    </div>
  );
}
