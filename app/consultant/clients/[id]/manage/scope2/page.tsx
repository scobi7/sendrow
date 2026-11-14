import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { findOwnedLink } from "@/lib/guards";
import { loadCompany } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import { consultantSaveFields } from "@/lib/consultant-actions";

export default async function ManageScope2({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || user.role !== "consultant") redirect("/login");

  const link = await findOwnedLink(user.id, id);
  if (!link) notFound();

  const company = await loadCompany(id);
  const inp = company.inputs;
  const base = `/consultant/clients/${id}/manage`;

  const boundSave = consultantSaveFields.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Scope 2: Electricity emissions"
        subtitle={`Renewable energy and market-based adjustments for ${company.name}.`}
      />

      <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>
        Electricity emissions are calculated from the utility data on file for this client. Record renewable
        energy coverage and any market-based override below, then mark the data as reviewed.
      </p>

      <form action={boundSave} className="card">
        <input type="hidden" name="redirect_to" value={`${base}/scope2`} />
        <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Renewable energy credits</h2>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="has_recs" value="yes" defaultChecked={inp.has_recs === true} /> Yes, on a green tariff or purchases RECs
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="has_recs" value="no" defaultChecked={inp.has_recs === false} /> No / not sure
          </label>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
    </div>
  );
}
