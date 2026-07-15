import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";
import { loadCompany } from "@/lib/store";
import { CO2eBox, InfoTip, PageHeader } from "@/components/ui";
import { consultantSaveFields, consultantSaveScope3Decision } from "@/lib/consultant-actions";
import { SCOPE3_OTHER_CATEGORIES } from "@/lib/factors";

export default async function ManageScope3({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || user.role !== "consultant") redirect("/login");

  const link = await db.query.consultantClients.findFirst({
    where: and(eq(consultantClients.consultantId, user.id), eq(consultantClients.companyId, id), isNull(consultantClients.archivedAt)),
  });
  if (!link) notFound();

  const company = await loadCompany(id);
  const inp = company.inputs;
  const base = `/consultant/clients/${id}/manage`;
  const qbConnected = company.connections.quickbooks.connected;
  const calcs = company.calcs.filter((c) => c.scope === 3);
  const find = (name: string) => calcs.find((c) => c.category.toLowerCase().includes(name))?.co2eTons ?? 0;
  const decisions = inp.scope3_other_categories ?? {};

  const boundSave = consultantSaveFields.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Scope 3 — Value Chain Emissions"
        subtitle={`Managing on behalf of ${company.name}.`}
      />

      {qbConnected && (
        <div className="card mb-5">
          <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Pre-filled from spend data</h2>
          <div className="mt-3 space-y-2 text-sm">
            {[
              ["Business travel", "Airlines, hotels, and car rentals from vendor spend", find("business travel")],
              ["Purchased goods & services", "All other vendor spend, by expense category", find("purchased goods")],
              ["Upstream freight", "Freight and delivery vendor spend", find("upstream freight")],
            ].map(([title, desc, tons]) => (
              <div key={title as string} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: "var(--bg)" }}>
                <div>
                  <p className="font-medium" style={{ color: "var(--text)" }}>{title}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </div>
                <span className="font-bold font-data" style={{ color: "var(--primary)" }}>
                  {(tons as number).toLocaleString("en-US", { maximumFractionDigits: 1 })} tCO2e
                </span>
              </div>
            ))}
          </div>
          <form action={boundSave}>
            <input type="hidden" name="redirect_to" value={`${base}/scope3`} />
            <label className="mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text)" }}>
              <input type="checkbox" name="qb_data_reviewed" value="true" defaultChecked={!!inp.qb_data_reviewed} />
              Pre-filled data reviewed and miscategorizations corrected
            </label>
            <button className="btn btn-secondary mt-3 px-3 py-1.5 text-xs">Save review status</button>
          </form>
        </div>
      )}

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
            Waste Disposal <InfoTip text="Annual tons by disposal method — waste hauler invoice has this." />
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
          First-time reporters typically skip these with documented justification — accepted by CDP and EcoVadis.
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
                          ? "Estimates from sector averages are always labeled low confidence — replacing them with the client's actual data upgrades the label automatically."
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
