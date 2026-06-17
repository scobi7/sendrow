import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { connectQuickBooks, connectUtility, startUtilityConnect, syncUtilityNow, syncUtilityByUid, resync, markQBReviewed, markUtilityReviewed, disconnectQuickBooks, disconnectUtility } from "@/lib/actions";
import { reportingPeriod } from "@/lib/calc";
import { PageHeader } from "@/components/ui";

const UTIL_ERRORS: Record<string, string> = {
  not_found: "Authorization not found yet — your utility provider may still be processing it. Wait a few minutes and try again.",
  pending: "Your utility account is authorized but no meters are active yet. This can take up to 24 hours. Try again shortly.",
  api_error: "We had trouble reaching UtilityAPI. Check that your UTILITYAPI_KEY is set and try again.",
};

export default async function Connections({
  searchParams,
}: {
  searchParams: Promise<{ util_error?: string }>;
}) {
  const { util_error } = await searchParams;
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

  // Build the UtilityAPI auth URL server-side (env var not exposed to client)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const formUrl = process.env.UTILITYAPI_FORM_URL ?? "";
  const utilityAuthUrl = formUrl
    ? `${formUrl}?redirect_url=${encodeURIComponent(`${appUrl}/connections`)}`
    : null;

  const period = reportingPeriod(company.fiscalYearEndMonth ?? 12);
  const money = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const dateStr = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";

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
          <h2 className="font-bold font-display" style={{ color: "var(--text)" }}>QuickBooks</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            We pull your vendor bills and purchases to estimate value-chain (Scope 3) emissions from spend. Read-only access.
          </p>
          {qb.connected ? (
            <div className="mt-4 space-y-3">
              <span className="block text-sm font-semibold" style={{ color: "var(--status-green)" }}>
                ✓ Connected — last synced {dateStr(qb.lastSynced)}
              </span>
              <div className="flex gap-2">
                <form action={resync.bind(null, "quickbooks")}>
                  <button className="btn btn-secondary px-3 py-1.5 text-xs">Resync</button>
                </form>
                <form action={disconnectQuickBooks}>
                  <button
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                    style={{ color: "var(--danger)", background: "var(--danger-tint)" }}
                  >
                    Disconnect
                  </button>
                </form>
              </div>
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
          <h2 className="font-bold font-display" style={{ color: "var(--text)" }}>Utility Account</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            We pull electricity (kWh) and natural gas (therms) by month for each location — the basis of Scope 1 and 2.
          </p>
          {util.connected ? (
            <div className="mt-4 space-y-3">
              <span className="block text-sm font-semibold" style={{ color: "var(--status-green)" }}>
                ✓ Connected — last synced {dateStr(util.lastSynced)}
              </span>
              <div className="flex gap-2">
                <form action={resync.bind(null, "utility")}>
                  <button className="btn btn-secondary px-3 py-1.5 text-xs">Resync</button>
                </form>
                <form action={disconnectUtility}>
                  <button
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                    style={{ color: "var(--danger)", background: "var(--danger-tint)" }}
                  >
                    Disconnect
                  </button>
                </form>
              </div>
            </div>
          ) : util.authEmail ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium" style={{ color: "var(--warning)" }}>
                Waiting on authorization for <strong>{util.authEmail}</strong>.
              </p>
              {util_error && UTIL_ERRORS[util_error] && (
                <p className="rounded-lg px-3 py-2 text-xs font-medium" style={{ background: "var(--warning-tint)", color: "var(--warning)" }}>
                  {UTIL_ERRORS[util_error]}
                </p>
              )}
              {utilityAuthUrl && (
                <a
                  href={utilityAuthUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full block text-center"
                >
                  Authorize at your utility →
                </a>
              )}
              <form action={syncUtilityNow}>
                <button className="btn btn-primary w-full">I authorized — pull my data</button>
              </form>
              <details className="text-xs" style={{ color: "var(--text-muted)" }}>
                <summary className="cursor-pointer py-1 font-medium">Have your Authorization UID? Enter it manually →</summary>
                <form action={syncUtilityByUid} className="mt-2 flex gap-2">
                  <input
                    name="auth_uid"
                    className="input flex-1"
                    placeholder="e.g. 587140"
                    required
                  />
                  <button type="submit" className="btn btn-primary px-4 py-2 text-xs shrink-0">Pull data</button>
                </form>
                <p className="mt-1" style={{ color: "var(--text-muted)" }}>Find this on your UtilityAPI authorization receipt under &ldquo;Authorization UID&rdquo;.</p>
              </details>
              <form action={disconnectUtility}>
                <button
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors"
                  style={{ color: "var(--danger)", background: "var(--danger-tint)" }}
                >
                  Cancel — start over
                </button>
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
