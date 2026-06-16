import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { connectQuickBooks, connectUtility, startUtilityConnect, syncUtilityNow, resync } from "@/lib/actions";
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

  const money = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const dateStr = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : "");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Connect Your Data Sources"
        subtitle="These two connections do the majority of the heavy lifting. You approve access — we never see your passwords." />

      <div className="grid gap-6 sm:grid-cols-2">
        <div className={`card ${qb.connected ? "border-brand-300 bg-brand-50/50" : ""}`}>
          <div className="text-2xl">🧾</div>
          <h2 className="mt-2 font-bold text-navy-900">QuickBooks</h2>
          <p className="mt-1 text-sm text-slate-500">
            We pull your vendor bills and purchases to estimate value-chain (Scope 3) emissions from spend. Read-only access.
          </p>
          {qb.connected ? (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-700">✓ Connected — last synced {dateStr(qb.lastSynced)}</span>
              <form action={resync.bind(null, "quickbooks")}><button className="btn-secondary px-3 py-1.5 text-xs">Resync</button></form>
            </div>
          ) : process.env.QUICKBOOKS_CLIENT_ID ? (
            <div className="mt-4">
              <a href="/api/auth/quickbooks/redirect" className="btn-primary w-full block text-center">
                Connect QuickBooks
              </a>
            </div>
          ) : (
            <form action={connectQuickBooks} className="mt-4">
              <button className="btn-primary w-full">Connect QuickBooks</button>
              <p className="mt-2 text-center text-xs text-slate-400">Demo mode: loads realistic sample data.</p>
            </form>
          )}
        </div>

        <div className={`card ${util.connected ? "border-brand-300 bg-brand-50/50" : ""}`}>
          <div className="text-2xl">⚡</div>
          <h2 className="mt-2 font-bold text-navy-900">Utility Account</h2>
          <p className="mt-1 text-sm text-slate-500">
            We pull electricity (kWh) and natural gas (therms) by month for each location — the basis of Scope 1 and 2.
          </p>
          {util.connected ? (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-700">✓ Connected — last synced {dateStr(util.lastSynced)}</span>
              <form action={resync.bind(null, "utility")}><button className="btn-secondary px-3 py-1.5 text-xs">Resync</button></form>
            </div>
          ) : util.authUid ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-amber-700 font-medium">
                Authorization email sent to <strong>{util.authEmail}</strong>. Check your inbox, authorize your utility account, then click below.
              </p>
              <form action={syncUtilityNow}>
                <button className="btn-primary w-full">I authorized — pull my data</button>
              </form>
            </div>
          ) : process.env.UTILITYAPI_KEY ? (
            <form action={startUtilityConnect} className="mt-4 space-y-2">
              <input
                name="email"
                type="email"
                required
                placeholder="Email on your utility account"
                className="input w-full"
              />
              <button type="submit" className="btn-primary w-full">Send Authorization Email</button>
            </form>
          ) : (
            <form action={connectUtility} className="mt-4">
              <button className="btn-primary w-full">Connect Utility</button>
              <p className="mt-2 text-center text-xs text-slate-400">Demo mode: loads realistic sample data.</p>
            </form>
          )}
        </div>
      </div>

      {(qb.connected || util.connected) && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-navy-900">Review What We Pulled</h2>
          <p className="mb-4 text-sm text-slate-500">
            Check the data below before it flows into your calculations. If something looks wrong, flag it and we&rsquo;ll investigate.
          </p>

          {qb.connected && (
            <details className="card mb-4" open>
              <summary className="cursor-pointer font-semibold text-navy-900">
                QuickBooks — vendor spend by expense category ({company.qbTransactions.length} transactions)
              </summary>
              <table className="mt-4 w-full text-sm">
                <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Expense category</th><th className="pb-2 text-right">Annual spend</th></tr></thead>
                <tbody>
                  {Object.entries(spendByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                    <tr key={cat} className="border-b border-slate-100">
                      <td className="py-2">{cat}</td>
                      <td className="py-2 text-right font-medium">{money(amt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PanelFooter />
            </details>
          )}

          {util.connected && (
            <details className="card" open>
              <summary className="cursor-pointer font-semibold text-navy-900">
                Utility — annual usage by location ({company.utilityData.length} meter-months)
              </summary>
              <table className="mt-4 w-full text-sm">
                <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Location</th><th className="pb-2 text-right">kWh</th><th className="pb-2 text-right">Therms</th></tr></thead>
                <tbody>
                  {Object.entries(kwhByLocation).map(([loc, v]) => (
                    <tr key={loc} className="border-b border-slate-100">
                      <td className="py-2">{loc}</td>
                      <td className="py-2 text-right font-medium">{num(v.kwh)}</td>
                      <td className="py-2 text-right font-medium">{num(v.therms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PanelFooter />
            </details>
          )}
        </section>
      )}
    </div>
  );
}

function PanelFooter() {
  return (
    <div className="mt-4 flex gap-3">
      <span className="btn-secondary pointer-events-none px-3 py-1.5 text-xs text-brand-700">✓ This looks right</span>
      <a href="mailto:support@greentrack.example?subject=Data%20issue" className="btn-secondary px-3 py-1.5 text-xs">Flag an issue</a>
    </div>
  );
}
