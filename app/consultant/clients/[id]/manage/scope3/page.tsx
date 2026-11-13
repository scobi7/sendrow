import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { findOwnedLink } from "@/lib/guards";
import { loadCompany } from "@/lib/store";
import { CO2eBox, InfoTip, PageHeader } from "@/components/ui";
import { consultantSaveFields, consultantSaveScope3Decision } from "@/lib/consultant-actions";
import { SCOPE3_OTHER_CATEGORIES } from "@/lib/factors";

export default async function ManageScope3({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || user.role !== "consultant") redirect("/login");

  const link = await findOwnedLink(user.id, id);
  if (!link) notFound();

  const company = await loadCompany(id);
  const inp = company.inputs;
  const base = `/consultant/clients/${id}/manage`;
  const calcs = company.calcs.filter((c) => c.scope === 3);
  const find = (name: string) => calcs.find((c) => c.category.toLowerCase().includes(name))?.co2eTons ?? 0;
  const decisions = inp.scope3_other_categories ?? {};

  const boundSave = consultantSaveFields.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Scope 3: Value Chain Emissions"
        subtitle={`Managing on behalf of ${company.name}.`}
      />

      <form action={boundSave} className="space-y-5">
        <input type="hidden" name="redirect_to" value={`${base}/scope3`} />

        <div className="card">
          <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>
            Employee Commuting <InfoTip text="Uses EPA per-mile factors and 235 working days, adjusted for office days per week." />
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <label className="label">Avg daily round trip (miles)</label>
              <input name="commute_avg_miles" type="number" step="any" min={0} className="input" defaultValue={inp.commute_avg_miles ?? ""} />
            </div>
            <div>
              <label className="label">Main transport mode</label>
              <select name="commute_mode" className="input" defaultValue={inp.commute_mode ?? ""}>
                <option value="">Select…</option>
                {["Drive alone", "Carpool", "Public transit", "Rail", "Bike / walk / mostly remote"].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Days/week in office</label>
              <input name="commute_days_in_office" type="number" min={0} max={5} className="input" defaultValue={inp.commute_days_in_office ?? ""} />
            </div>
          </div>
          <CO2eBox label="Commuting emissions" tons={find("commuting")} />
        </div>

        <div className="card">
          <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>
            Waste Disposal <InfoTip text="Annual tons by disposal method. Waste hauler invoice has this." />
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <label className="label">Landfilled (tons/yr)</label>
              <input name="waste_landfill_tons" type="number" step="any" min={0} className="input" defaultValue={inp.waste_landfill_tons ?? ""} />
            </div>
            <div>
              <label className="label">Recycled (tons/yr)</label>
              <input name="waste_recycled_tons" type="number" step="any" min={0} className="input" defaultValue={inp.waste_recycled_tons ?? ""} />
            </div>
            <div>
              <label className="label">Composted (tons/yr)</label>
              <input name="waste_composted_tons" type="number" step="any" min={0} className="input" defaultValue={inp.waste_composted_tons ?? ""} />
            </div>
          </div>
          <CO2eBox label="Waste emissions" tons={find("waste")} />
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary">Save Scope 3</button>
        </div>
      </form>

      <div className="card mt-5">
        <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Remaining Categories</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          First-time reporters typically skip these with documented justification (accepted by CDP and EcoVadis).
        </p>
        <div className="mt-4 space-y-2">
          {SCOPE3_OTHER_CATEGORIES.map((cat) => {
            const d = decisions[cat];
            return (
              <div key={cat} className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm" style={{ border: "1px solid var(--divider)" }}>
                <span className="font-medium" style={{ color: "var(--text)" }}>{cat}</span>
                {d ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: d === "na" ? "var(--text-muted)" : "var(--warning)" }}
                      title={
                        d === "industry_average"
                          ? "Estimates from sector averages are always labeled low confidence. Replacing them with the client's actual data upgrades the label automatically."
                          : undefined
                      }
                    >
                      {d === "na" ? "Marked not applicable" : "Industry average estimate (low confidence)"}
                    </span>
                    <form action={consultantSaveScope3Decision.bind(null, id, cat, "clear")}>
                      <button className="text-xs underline" style={{ color: "var(--text-muted)" }}>undo</button>
                    </form>
                  </span>
                ) : (
                  <span className="flex gap-2">
                    <form action={consultantSaveScope3Decision.bind(null, id, cat, "na")}>
                      <button className="btn btn-secondary px-2.5 py-1 text-xs">Not applicable</button>
                    </form>
                    <form action={consultantSaveScope3Decision.bind(null, id, cat, "industry_average")}>
                      <button className="btn btn-secondary px-2.5 py-1 text-xs">Estimate w/ industry avg</button>
                    </form>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
