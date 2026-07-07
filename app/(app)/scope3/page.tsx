import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { saveFields, saveScope3Decision } from "@/lib/actions";
import { CO2eBox, InfoTip, PageHeader } from "@/components/ui";
import { SCOPE3_OTHER_CATEGORIES } from "@/lib/factors";

export default async function Scope3() {
  const user = await currentUser();
  if (!user?.companyId) redirect("/onboarding");
  const company = await loadCompany(user.companyId);
  const inp = company.inputs;
  const qbConnected = company.connections.quickbooks.connected;
  const calcs = company.calcs.filter((c) => c.scope === 3);
  const find = (name: string) => calcs.find((c) => c.category.toLowerCase().includes(name))?.co2eTons ?? 0;
  const decisions = inp.scope3_other_categories ?? {};

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Scope 3 — Your Value Chain Emissions"
        subtitle="Usually the largest part of your footprint. We have pre-filled what we can from your QuickBooks data."
      />

      {!qbConnected && (
        <Link
          href="/connections"
          className="mb-6 block px-5 py-4 text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--warning-tint)",
            background: "var(--warning-tint)",
            color: "var(--warning)",
          }}
        >
          Connect QuickBooks to pre-fill business travel, purchased goods, and freight automatically →
        </Link>
      )}

      {qbConnected && (
        <div className="card mb-5">
          <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>Pre-filled from QuickBooks</h2>
          <div className="mt-3 space-y-2 text-sm">
            {[
              ["Business travel", "Airlines, hotels, and car rentals from your vendor spend", find("business travel")],
              ["Purchased goods & services", "All other vendor spend, by expense category", find("purchased goods")],
              ["Upstream freight", "Freight and delivery vendor spend", find("upstream freight")],
            ].map(([title, desc, tons]) => (
              <div
                key={title as string}
                className="flex items-center justify-between rounded-lg px-4 py-3"
                style={{ background: "var(--bg)" }}
              >
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
          <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
            Calculated with spend-based USEEIO emission factors. Review category totals on the{" "}
            <Link href="/connections" className="underline" style={{ color: "var(--primary)" }}>Connections page</Link>{" "}
            and correct miscategorized vendors in QuickBooks.
          </p>
          <form action={saveFields}>
            <input type="hidden" name="redirect_to" value="/scope3" />
            <label className="mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text)" }}>
              <input type="checkbox" name="qb_data_reviewed" value="true" defaultChecked={!!inp.qb_data_reviewed} />
              I have reviewed the pre-filled data and corrected any miscategorizations
            </label>
            <button className="btn btn-secondary mt-3 px-3 py-1.5 text-xs">Save review status</button>
          </form>
        </div>
      )}

      <form action={saveFields} className="space-y-5">
        <input type="hidden" name="redirect_to" value="/scope3" />

        <div className="card">
          <h2 className="font-semibold font-display" style={{ color: "var(--text)" }}>
            Employee Commuting <InfoTip text="A rough average is fine — most companies estimate this. We use EPA per-mile factors and 235 working days, adjusted for office days per week." />
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
            Waste Disposal <InfoTip text="Annual tons by disposal method — your waste hauler invoice has this. Estimates are acceptable for first-time reporters." />
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
          First-time reporters typically skip these with documented justification — standard practice accepted by CDP and EcoVadis.
        </p>
        <div className="mt-4 space-y-2">
          {SCOPE3_OTHER_CATEGORIES.map((cat) => {
            const d = decisions[cat];
            return (
              <div
                key={cat}
                className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm"
                style={{ border: "1px solid var(--divider)" }}
              >
                <span className="font-medium" style={{ color: "var(--text)" }}>{cat}</span>
                {d ? (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: d === "na" ? "var(--text-muted)" : "var(--warning)" }}
                  >
                    {d === "na" ? "Marked not applicable" : "Industry average estimate (low confidence)"}
                  </span>
                ) : (
                  <span className="flex gap-2">
                    <form action={saveScope3Decision.bind(null, cat, "na")}>
                      <button className="btn btn-secondary px-2.5 py-1 text-xs">Not applicable</button>
                    </form>
                    <form action={saveScope3Decision.bind(null, cat, "industry_average")}>
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
