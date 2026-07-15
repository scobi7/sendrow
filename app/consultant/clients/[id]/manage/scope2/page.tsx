import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";
import { loadCompany, getFactor } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import { consultantSaveFields } from "@/lib/consultant-actions";

export default async function ManageScope2({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || user.role !== "consultant") redirect("/login");

  const link = await db.query.consultantClients.findFirst({
    where: and(eq(consultantClients.consultantId, user.id), eq(consultantClients.companyId, id), isNull(consultantClients.archivedAt)),
  });
  if (!link) notFound();

  const company = await loadCompany(id);
  const inp = company.inputs;
  const connected = company.connections.utility.connected;
  const base = `/consultant/clients/${id}/manage`;
  const num = (n: number, d = 1) => n.toLocaleString("en-US", { maximumFractionDigits: d });

  const rows = company.locations.map((loc) => {
    const kwh = company.utilityData.filter((m) => m.locationId === loc.id).reduce((s, m) => s + m.kwh, 0);
    const calc = company.calcs.find((c) => c.scope === 2 && c.category.includes(loc.city || loc.address));
    const f = getFactor(loc.egridSubregion);
    return { loc, kwh, locBased: calc?.co2eTons ?? 0, mktBased: calc?.marketBasedTons ?? 0, subregion: f.factor_name };
  });

  const boundSave = consultantSaveFields.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Scope 2 — Electricity Emissions"
        subtitle={`Pre-filled from utility connection for ${company.name}.`}
      />

      {!connected && rows.every((r) => r.kwh === 0) ? (
        <div className="card text-center">
          <p style={{ color: "var(--text-muted)" }}>
            No utility data on file yet — it arrives when the client answers a data request (utility bills item),
            or you can enter it on their behalf from the client page.
          </p>
          <Link href={`/consultant/clients/${id}`} className="btn btn-primary mt-4 inline-flex">Back to client</Link>
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide" style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}>
                  <th className="pb-2">Location</th>
                  <th className="pb-2">Grid region</th>
                  <th className="pb-2 text-right">kWh</th>
                  <th className="pb-2 text-right">Location-based</th>
                  <th className="pb-2 text-right">Market-based</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ loc, kwh, locBased, mktBased, subregion }) => (
                  <tr key={loc.id} style={{ borderBottom: "1px solid var(--divider)" }}>
                    <td className="py-2 font-medium">{loc.city || loc.address}, {loc.state}</td>
                    <td className="py-2" style={{ color: "var(--text-muted)" }}>{subregion}</td>
                    <td className="py-2 text-right font-data">{num(kwh, 0)}</td>
                    <td className="py-2 text-right font-semibold font-data">{num(locBased)} t</td>
                    <td className="py-2 text-right font-semibold font-data">{num(mktBased)} t</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form action={boundSave} className="card mt-6">
            <input type="hidden" name="redirect_to" value={`${base}/scope2`} />
            <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Renewable Energy Credits</h2>
            <div className="mt-3 flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="has_recs" value="yes" defaultChecked={inp.has_recs === true} /> Yes — on a green tariff or purchases RECs
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
                <label className="label">Certificate reference</label>
                <input name="rec_certificate_name" type="text" className="input" placeholder="e.g. 2025 Green-e certificate" defaultValue={inp.rec_certificate_name ?? ""} />
              </div>
            </div>
            <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--divider)" }}>
              <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Market-based override</h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Replaces the derived market-based figure in totals and exports. Leave blank to use the calculated
                value. Every change is audit-logged with your reason.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Market-based Scope 2 (tCO2e)</label>
                  <input
                    name="scope2_market_override_tons"
                    type="number"
                    step="0.01"
                    min={0}
                    className="input"
                    placeholder="calculated"
                    defaultValue={inp.scope2_market_override_tons ?? ""}
                  />
                </div>
                <div>
                  <label className="label">Reason</label>
                  <input
                    name="scope2_market_override_reason"
                    type="text"
                    className="input"
                    placeholder="e.g. supplier-specific contract factor"
                    defaultValue={inp.scope2_market_override_reason ?? ""}
                  />
                </div>
              </div>
            </div>

            <label className="mt-5 flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text)" }}>
              <input type="checkbox" name="scope2_reviewed" value="true" defaultChecked={!!inp.scope2_reviewed} />
              Data reviewed and correct
            </label>
            <div className="mt-5 flex justify-end">
              <button className="btn btn-primary">Save Scope 2</button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
