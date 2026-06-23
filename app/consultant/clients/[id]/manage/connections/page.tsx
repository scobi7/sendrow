import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";
import { loadCompany } from "@/lib/store";
import { reportingPeriod } from "@/lib/calc";
import { PageHeader } from "@/components/ui";
import { consultantMarkQBReviewed, consultantMarkUtilityReviewed } from "@/lib/consultant-actions";
import { startUtilityConnectForClient } from "@/lib/actions";

export default async function ManageConnections({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || user.role !== "consultant") redirect("/login");

  const link = await db.query.consultantClients.findFirst({
    where: and(eq(consultantClients.consultantId, user.id), eq(consultantClients.companyId, id), isNull(consultantClients.archivedAt)),
  });
  if (!link) notFound();

  const company = await loadCompany(id);
  const qb = company.connections.quickbooks;
  const util = company.connections.utility;
  const period = reportingPeriod(company.fiscalYearEndMonth ?? 12);

  const spendByCategory: Record<string, number> = {};
  for (const t of company.qbTransactions)
    spendByCategory[t.category] = (spendByCategory[t.category] ?? 0) + t.amount;

  const kwhByLocation: Record<string, { kwh: number; therms: number }> = {};
  for (const m of company.utilityData) {
    const loc = company.locations.find((l) => l.id === m.locationId);
    const key = loc ? `${loc.city || loc.address} (${loc.state})` : m.locationId;
    kwhByLocation[key] = {
      kwh: (kwhByLocation[key]?.kwh ?? 0) + m.kwh,
      therms: (kwhByLocation[key]?.therms ?? 0) + m.therms,
    };
  }

  const dateStr = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";

  const boundMarkQB = consultantMarkQBReviewed.bind(null, id);
  const boundMarkUtil = consultantMarkUtilityReviewed.bind(null, id);
  const boundUtilConnect = startUtilityConnectForClient.bind(null, id);

  const money = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <div>
      <PageHeader
        title="Data Connections"
        subtitle={`Managing connections for ${company.name}.`}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {/* QuickBooks */}
        <div className="card" style={qb.connected ? { borderColor: "var(--primary)", background: "var(--primary-tint)" } : {}}>
          <h2 className="font-bold font-display" style={{ color: "var(--text)" }}>QuickBooks</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Pulls vendor bills to estimate Scope 3 emissions from spend. The client must authorize this connection.
          </p>
          {qb.connected ? (
            <p className="mt-4 text-sm font-semibold" style={{ color: "var(--status-green)" }}>
              Connected — last synced {dateStr(qb.lastSynced)}
            </p>
          ) : process.env.QUICKBOOKS_CLIENT_ID ? (
            <div className="mt-4">
              <a
                href={`/api/auth/quickbooks/redirect?for=${id}`}
                className="btn btn-primary block w-full text-center text-sm"
              >
                Connect QuickBooks for this client
              </a>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                You can connect on behalf of your client if you have their QuickBooks credentials.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              QuickBooks not configured — client must connect from their dashboard.
            </p>
          )}
        </div>

        {/* Utility */}
        <div className="card" style={util.connected ? { borderColor: "var(--primary)", background: "var(--primary-tint)" } : {}}>
          <h2 className="font-bold font-display" style={{ color: "var(--text)" }}>Utility Account</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Pulls electricity (kWh) and natural gas (therms) for Scope 1 and 2 calculations.
          </p>
          {util.connected ? (
            <p className="mt-4 text-sm font-semibold" style={{ color: "var(--status-green)" }}>
              Connected — last synced {dateStr(util.lastSynced)}
            </p>
          ) : util.authEmail ? (
            <div className="mt-4">
              <p className="text-sm font-medium" style={{ color: "var(--warning)" }}>
                Waiting on authorization for <strong>{util.authEmail}</strong>.
              </p>
            </div>
          ) : process.env.UTILITYAPI_FORM_URL ? (
            <form action={boundUtilConnect} className="mt-4 space-y-2">
              <input
                name="email"
                type="email"
                required
                placeholder="Client utility account email"
                className="input w-full"
              />
              <button type="submit" className="btn btn-primary w-full text-sm">
                Start utility connection
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              Client must connect their utility account from their own dashboard.
            </p>
          )}
        </div>
      </div>

      {(qb.connected || util.connected) && (
        <section className="mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>Pulled Data</h2>
            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Period: <strong style={{ color: "var(--text)" }}>{period.label}</strong>
            </span>
          </div>

          {qb.connected && (
            <details className="card mb-4" open>
              <summary className="cursor-pointer font-semibold font-display" style={{ color: "var(--text)" }}>
                QuickBooks — spend by category ({company.qbTransactions.length} transactions)
              </summary>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide" style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}>
                    <th className="pb-2">Category</th>
                    <th className="pb-2 text-right">Annual spend</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(spendByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                    <tr key={cat} style={{ borderBottom: "1px solid var(--divider)" }}>
                      <td className="py-2">{cat}</td>
                      <td className="py-2 text-right font-medium font-data">{money(amt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex gap-3">
                {company.inputs.qb_data_reviewed ? (
                  <span className="btn btn-secondary pointer-events-none px-3 py-1.5 text-xs" style={{ color: "var(--status-green)" }}>Reviewed</span>
                ) : (
                  <form action={boundMarkQB}>
                    <button className="btn btn-primary px-3 py-1.5 text-xs">Mark as reviewed</button>
                  </form>
                )}
              </div>
            </details>
          )}

          {util.connected && (
            <details className="card" open>
              <summary className="cursor-pointer font-semibold font-display" style={{ color: "var(--text)" }}>
                Utility — annual usage by location ({company.utilityData.length} meter-months)
              </summary>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide" style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}>
                    <th className="pb-2">Location</th>
                    <th className="pb-2 text-right">kWh</th>
                    <th className="pb-2 text-right">Therms</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(kwhByLocation).map(([loc, v]) => (
                    <tr key={loc} style={{ borderBottom: "1px solid var(--divider)" }}>
                      <td className="py-2">{loc}</td>
                      <td className="py-2 text-right font-medium font-data">{num(v.kwh)}</td>
                      <td className="py-2 text-right font-medium font-data">{num(v.therms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex gap-3">
                {company.inputs.scope2_reviewed ? (
                  <span className="btn btn-secondary pointer-events-none px-3 py-1.5 text-xs" style={{ color: "var(--status-green)" }}>Reviewed</span>
                ) : (
                  <form action={boundMarkUtil}>
                    <button className="btn btn-primary px-3 py-1.5 text-xs">Mark as reviewed</button>
                  </form>
                )}
              </div>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
