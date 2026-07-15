import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";
import { loadCompany } from "@/lib/store";
import { CO2eBox, InfoTip, PageHeader } from "@/components/ui";
import { consultantSaveFields } from "@/lib/consultant-actions";

export default async function ManageScope1({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || user.role !== "consultant") redirect("/login");

  const link = await db.query.consultantClients.findFirst({
    where: and(eq(consultantClients.consultantId, user.id), eq(consultantClients.companyId, id), isNull(consultantClients.archivedAt)),
  });
  if (!link) notFound();

  const company = await loadCompany(id);
  const inp = company.inputs;
  const calcs = company.calcs.filter((c) => c.scope === 1);
  const sub = (prefix: string) =>
    calcs.filter((c) => c.category.toLowerCase().startsWith(prefix)).reduce((s, c) => s + c.co2eTons, 0);
  const utilityTherms = company.utilityData.reduce((s, m) => s + m.therms, 0);
  const base = `/consultant/clients/${id}/manage`;

  const boundSave = consultantSaveFields.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Scope 1 - Direct Emissions"
        subtitle={`Entering data on behalf of ${company.name}.`}
      />

      <form action={boundSave} className="space-y-5">
        <input type="hidden" name="redirect_to" value={`${base}/scope1`} />

        <details className="card" open>
          <summary className="cursor-pointer font-semibold font-display" style={{ color: "var(--text)" }}>
            Fleet Fuel <InfoTip text="Fuel burned in vehicles the company owns or leases." />
          </summary>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <label className="label">Gasoline (gal/yr)</label>
              <input name="fleet_gasoline_gal" type="number" step="any" min={0} className="input" defaultValue={inp.fleet_gasoline_gal ?? ""} />
            </div>
            <div>
              <label className="label">Diesel (gal/yr)</label>
              <input name="fleet_diesel_gal" type="number" step="any" min={0} className="input" defaultValue={inp.fleet_diesel_gal ?? ""} />
            </div>
            <div>
              <label className="label">Propane (gal/yr)</label>
              <input name="fleet_propane_gal" type="number" step="any" min={0} className="input" defaultValue={inp.fleet_propane_gal ?? ""} />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <input type="checkbox" name="fleet_na" value="true" defaultChecked={!!inp.fleet_na} /> Not applicable
          </label>
          <CO2eBox label="Fleet fuel emissions" tons={sub("fleet")} />
        </details>

        <details className="card" open>
          <summary className="cursor-pointer font-semibold font-display" style={{ color: "var(--text)" }}>
            Natural Gas <InfoTip text="Pre-filled from utility connection. Enter a value to override." />
          </summary>
          {utilityTherms > 0 && (
            <p className="mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--primary-tint)", color: "var(--primary)" }}>
              Pre-filled from utility: {utilityTherms.toLocaleString()} therms
            </p>
          )}
          <div className="mt-3">
            <label className="label">Override (therms/yr)</label>
            <input name="natgas_therms_override" type="number" step="any" min={0} className="input w-48" defaultValue={inp.natgas_therms_override ?? ""} />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <input type="checkbox" name="natgas_na" value="true" defaultChecked={!!inp.natgas_na} /> Not applicable
          </label>
          <CO2eBox label="Natural gas emissions" tons={sub("natural gas")} />
        </details>

        <details className="card" open>
          <summary className="cursor-pointer font-semibold font-display" style={{ color: "var(--text)" }}>
            Refrigerants <InfoTip text="Refrigerant gases topped up in HVAC or refrigeration this year." />
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="label">Refrigerant type</label>
              <select name="refrigerant_type" className="input" defaultValue={inp.refrigerant_type ?? ""}>
                <option value="">Select…</option>
                {["R-410A", "R-134a", "R-32", "R-404A", "R-22"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Kg topped up this year</label>
              <input name="refrigerant_kg" type="number" step="any" min={0} className="input" defaultValue={inp.refrigerant_kg ?? ""} />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <input type="checkbox" name="refrigerant_na" value="true" defaultChecked={!!inp.refrigerant_na} /> Not applicable
          </label>
          <CO2eBox label="Refrigerant emissions" tons={sub("refrigerant")} />
        </details>

        <details className="card" open>
          <summary className="cursor-pointer font-semibold font-display" style={{ color: "var(--text)" }}>
            On-Site Equipment <InfoTip text="Generators, forklifts, and other fuel-burning equipment." />
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fuel type</label>
              <select name="equipment_fuel_type" className="input" defaultValue={inp.equipment_fuel_type ?? ""}>
                <option value="">Select…</option>
                {["Diesel", "Gasoline", "Propane"].map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Gallons consumed/yr</label>
              <input name="equipment_gal" type="number" step="any" min={0} className="input" defaultValue={inp.equipment_gal ?? ""} />
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <input type="checkbox" name="equipment_na" value="true" defaultChecked={!!inp.equipment_na} /> Not applicable
          </label>
          <CO2eBox label="Equipment emissions" tons={sub("on-site")} />
        </details>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">Save Scope 1</button>
        </div>
      </form>
    </div>
  );
}
