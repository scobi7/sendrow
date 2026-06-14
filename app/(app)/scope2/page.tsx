import { currentUser } from "@/lib/auth";
import { ensureDB, getCompany, getFactor } from "@/lib/store";
import { saveFields } from "@/lib/actions";
import { PageHeader } from "@/components/ui";
import Link from "next/link";

export default async function Scope2() {
  await ensureDB();
  const user = currentUser()!;
  const company = getCompany(user.companyId);
  const inp = company.inputs;
  const connected = company.connections.utility.connected;
  const num = (n: number, d = 1) => n.toLocaleString("en-US", { maximumFractionDigits: d });

  const rows = company.locations.map((loc) => {
    const kwh = company.utilityData.filter((m) => m.locationId === loc.id).reduce((s, m) => s + m.kwh, 0);
    const calc = company.calcs.find((c) => c.scope === 2 && c.category.includes(loc.city || loc.address));
    const f = getFactor(loc.egridSubregion);
    return { loc, kwh, locBased: calc?.co2eTons ?? 0, mktBased: calc?.marketBasedTons ?? 0, subregion: f.factor_name };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Scope 2 — Your Electricity Emissions"
        subtitle="Pre-filled from your utility connection. Review the numbers and add renewable energy credits if you have them." />

      {!connected ? (
        <div className="card text-center">
          <p className="text-slate-600">Connect your utility account first — this section fills itself in.</p>
          <Link href="/connections" className="btn-primary mt-4 inline-flex">Go to Connections</Link>
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Location</th>
                  <th className="pb-2">Grid region</th>
                  <th className="pb-2 text-right">kWh</th>
                  <th className="pb-2 text-right">Location-based</th>
                  <th className="pb-2 text-right">Market-based</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ loc, kwh, locBased, mktBased, subregion }) => (
                  <tr key={loc.id} className="border-b border-slate-100">
                    <td className="py-2 font-medium">{loc.city || loc.address}, {loc.state}</td>
                    <td className="py-2 text-slate-500">{subregion}</td>
                    <td className="py-2 text-right">{num(kwh, 0)}</td>
                    <td className="py-2 text-right font-semibold">{num(locBased)} t</td>
                    <td className="py-2 text-right font-semibold">{num(mktBased)} t</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
              <strong>Why two columns?</strong> The GHG Protocol requires both. <em>Location-based</em> uses the average
              emissions of your regional grid. <em>Market-based</em> reflects the electricity you actually purchased —
              green tariffs and renewable energy certificates (RECs) lower this number. Many California companies have
              RECs and don&rsquo;t realize it.
            </p>
          </div>

          <form action={saveFields} className="card mt-6">
            <input type="hidden" name="redirect_to" value="/scope2" />
            <h2 className="font-semibold text-navy-900">Renewable Energy Credits</h2>
            <div className="mt-3 flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="has_recs" value="yes" defaultChecked={inp.has_recs === true} /> Yes, we purchase RECs or are on a green tariff
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="has_recs" value="no" defaultChecked={inp.has_recs === false} /> No / not sure
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="label">% of electricity covered</label>
                <input name="rec_coverage_pct" type="number" min={0} max={100} className="input" defaultValue={inp.rec_coverage_pct ?? ""} />
              </div>
              <div>
                <label className="label">Certificate reference (upload in production)</label>
                <input name="rec_certificate_name" type="text" className="input" placeholder="e.g. 2025 Green-e certificate" defaultValue={inp.rec_certificate_name ?? ""} />
              </div>
            </div>
            <label className="mt-5 flex items-center gap-2 text-sm font-medium text-navy-900">
              <input type="checkbox" name="scope2_reviewed" value="true" defaultChecked={!!inp.scope2_reviewed} />
              I have reviewed this data and it looks correct
            </label>
            <div className="mt-5 flex justify-end">
              <button className="btn-primary">Save Scope 2</button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
