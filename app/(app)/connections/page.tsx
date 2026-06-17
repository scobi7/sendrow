import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { connectQuickBooks, connectUtility, startUtilityConnect, syncUtilityNow, resync, markQBReviewed, markUtilityReviewed } from "@/lib/actions";
import { reportingPeriod } from "@/lib/calc";
import { PageHeader } from "@/components/ui";

export default async function Connections() {
  const user = (await currentUser())!;
  const company = await loadCompany(user.companyId);
  const qb = company.connections.quickbooks;
  const util = company.connections.utility;

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

  const period = reportingPeriod(company.fiscalYearEndMonth ?? 12);
  const money = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const dateStr = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : "");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Connect Your Data Sources"
        subtitle="These two connections do the majority of the heavy lifting. You approve access — we never see your passwords."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <div
          className="card"
          style={qb.connected ? { borderColor: "var(--primary)", background: "var(--primary-tint)" } : {}}
        >
          <div className="text-2xl">🧾</div>
          <h2 className="mt-2 font-bold font-display" style={{ color: "var(--text)" }}>QuickBooks</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            We pull your vendor bills and purchases to estimate value-chain (Scope 3) emissions from spend. Read-only access.
          </p>
          {qb.connected ? (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: "var(--status-green)" }}>
                ✓ Connected — last synced {dateStr(qb.lastSynced)}
              </span>
              <form action={resync.bind(null, "quickbooks")}>
                <button className="btn-secondary px-3 py-1.5 text-xs">Resync</button>
              </form>
            </div>
          ) : process.env.QUICKBOOKS_CLIENT_ID ? (
            <div className="mt-4">
              <a href="/api/auth/quickbooks/redirect" className="btn btn-primary w-full block text-center">
                Connect QuickBooks
              </a>
            </div>
          ) : (
            <form action={connectQuickBooks} className="mt-4">
              <button className="btn btn-primary w-full">Connect QuickBooks</button>
              <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>Demo mode: loads realistic sample data.</p>
            </form>
          )}
        </div>

        <div
          className="card"
          style={util.connected ? { borderColor: "var(--primary)", background: "var(--primary-tint)" } : {}}
        >
          <div className="text-2xl">⚡</div>
          <h2 className="mt-2 font-bold font-display" style={{ color: "var(--text)" }}>Utility Account</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            We pull electricity (kWh) and natural gas (therms) by month for each location — the basis of Scope 1 and 2.
          </p>
          {util.connected ? (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: "var(--status-green)" }}>
                ✓ Connected — last synced {dateStr(util.lastSynced)}
              </span>
              <form action={resync.bind(null, "utility")}>
                <button className="btn-secondary px-3 py-1.5 text-xs">Resync</button>
              </form>
            </div>
          ) : util.authEmail ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium" style={{ color: "var(--warning)" }}>
                Waiting on authorization for <strong>{util.authEmail}</strong>. If you haven&apos;t authorized yet, complete it at your utility&apos;s site, then click below.
              </p>
              <form action={syncUtilityNow}>
                <button className="btn btn-primary w-full">I authorized — pull my data</button>
              </form>
            </div>
          ) : process.env.UTILITYAPI_FORM_URL ? (
            <form action={startUtilityConnect} className="mt-4 space-y-2">
              <input
                name="email"
                type="email"
                required
                placeholder="Email on your utility account"
                className="input w-full"
              />
              <button type="submit" className="btn btn-primary w-full">Connect Utility Account</button>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>You&apos;ll be redirected to authorize your utility account.</p>
            </form>
          ) : (
            <form action={connectUtility} className="mt-4">
              <button className="btn btn-primary w-full">Connect Utility</button>
              <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>Demo mode: loads realistic sample data.</p>
            </form>
          )}
        </div>
      </div>

      {(qb.connected || util.connected) && (
        <section className="mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>Review What We Pulled</h2>
            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Reporting period: <strong style={{ color: "var(--text)" }}>{period.label}</strong>
            </span>
          </div>
          <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
            Only data within the reporting period flows into calculations. If something looks wrong, flag it and we&rsquo;ll investigate.
          </p>

          {qb.connected && (
            <details className="card mb-4" open>
              <summary className="cursor-pointer font-semibold font-display" style={{ color: "var(--text)" }}>
                QuickBooks — vendor spend by expense category ({company.qbTransactions.length} transactions)
              </summary>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr
                    className="text-left text-xs uppercase tracking-wide"
                    style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}
                  >
                    <th className="pb-2">Expense category</th>
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
              <PanelFooter reviewed={!!company.inputs.qb_data_reviewed} reviewAction={markQBReviewed} />
            </details>
          )}

          {util.connected && (
            <details className="card" open>
              <summary className="cursor-pointer font-semibold font-display" style={{ color: "var(--text)" }}>
                Utility — annual usage by location ({company.utilityData.length} meter-months)
              </summary>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr
                    className="text-left text-xs uppercase tracking-wide"
                    style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}
                  >
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
              <PanelFooter reviewed={!!company.inputs.scope2_reviewed} reviewAction={markUtilityReviewed} />
            </details>
          )}
        </section>
      )}
    </div>
  );
}

function PanelFooter({
  reviewed,
  reviewAction,
}: {
  reviewed: boolean;
  reviewAction: () => Promise<void>;
}) {
  return (
    <div className="mt-4 flex gap-3">
      {reviewed ? (
        <span className="btn btn-secondary pointer-events-none px-3 py-1.5 text-xs" style={{ color: "var(--status-green)" }}>
          ✓ Reviewed
        </span>
      ) : (
        <form action={reviewAction}>
          <button type="submit" className="btn btn-primary px-3 py-1.5 text-xs">✓ This looks right</button>
        </form>
      )}
      <a
        href="mailto:malachinguyenn@gmail.com?subject=GreenTrack data issue"
        className="btn btn-secondary px-3 py-1.5 text-xs"
      >
        Flag an issue
      </a>
    </div>
  );
}
