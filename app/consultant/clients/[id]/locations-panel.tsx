import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { dataRequests, emissionLineItems, locations } from "@/lib/db/schema";
import { addLocation, removeLocation, sendSiteLinkAction } from "@/lib/consultant-actions";
import { EGRID_SUBREGION_OPTIONS, SITE_STATUS_LABEL, siteRollups } from "@/lib/locations";
import { siteLabel } from "@/lib/site-requests";
import { egridLabel } from "@/lib/factors";
import { PortalLinkButton } from "./portal-link-button";

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  no_link: { bg: "var(--divider)", fg: "var(--text-muted)" },
  link_sent: { bg: "var(--warning-tint)", fg: "var(--warning-strong)" },
  responding: { bg: "var(--primary-tint)", fg: "var(--primary)" },
  complete: { bg: "var(--primary-tint)", fg: "var(--primary)" },
};

/** Locations panel (Plan MO1/MO5): the client's sites, each with its own grid
 *  factor, delegation link, and status - plus the aggregated total. The same
 *  rollup the CFO sees on their portal. */
export async function LocationsPanel({ companyId }: { companyId: string }) {
  const [sites, siteRequests, taggedItems] = await Promise.all([
    db.select().from(locations).where(eq(locations.companyId, companyId)),
    db.select().from(dataRequests).where(and(eq(dataRequests.companyId, companyId), isNotNull(dataRequests.locationId))),
    db
      .select({ locationId: emissionLineItems.locationId, co2eKg: emissionLineItems.co2eKg, status: emissionLineItems.status })
      .from(emissionLineItems)
      .where(eq(emissionLineItems.companyId, companyId)),
  ]);

  const rollups = siteRollups(sites.map((s) => s.id), siteRequests, taggedItems);
  const byId = new Map(rollups.map((r) => [r.locationId, r]));
  const totalT = rollups.reduce((s, r) => s + r.co2eKg, 0) / 1000;
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

  return (
    <div className="glass-panel">
      <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Locations ({sites.length})
        </p>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          each site calculates with its own grid factor, then sums
        </span>
      </div>

      {sites.length === 0 ? (
        <p className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
          No sites yet - add offices or plants below so each one gets its own upload link and grid factor.
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
          {sites.map((site) => {
            const r = byId.get(site.id)!;
            const style = STATUS_STYLE[r.status];
            const referenced = r.requestId !== null || r.co2eKg > 0;
            return (
              <div key={site.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>
                      {siteLabel(site)}
                      <span className="ml-2 font-data text-xs" style={{ color: "var(--text-muted)" }}>
                        {[site.city, site.state].filter(Boolean).join(", ")} · {egridLabel(site.egridSubregion)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {site.contactEmail ? `${site.contactName ? `${site.contactName} · ` : ""}${site.contactEmail}` : "No site contact yet"}
                      {r.itemsTotal > 0 && ` · ${r.itemsReceived}/${r.itemsTotal} items in`}
                      {r.co2eKg > 0 && ` · ${fmt(r.co2eKg / 1000)} tCO2e`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-1 font-data text-[11px] font-semibold" style={{ background: style.bg, color: style.fg }}>
                    {SITE_STATUS_LABEL[r.status]}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <form action={sendSiteLinkAction.bind(null, companyId, site.id)} className="flex flex-wrap items-center gap-1.5">
                    {!site.contactEmail && (
                      <input name="contact_email" type="email" required placeholder="site-contact@company.com" className="input px-2 py-1 text-xs" style={{ width: "13rem" }} />
                    )}
                    <button className="rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-70" style={{ background: "var(--primary-tint)", color: "var(--primary)" }}>
                      {r.status === "no_link" ? "Send site link" : "Resend site link"}
                    </button>
                  </form>
                  {r.token && <PortalLinkButton token={r.token} />}
                  {!referenced && (
                    <form action={removeLocation.bind(null, companyId, site.id)}>
                      <button className="text-xs underline" style={{ color: "var(--text-muted)" }}>Remove</button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>All sites combined</p>
            <p className="font-data text-sm font-bold" style={{ color: "var(--text)" }}>{fmt(totalT)} tCO2e</p>
          </div>
        </div>
      )}

      <form action={addLocation.bind(null, companyId)} className="flex flex-wrap items-center gap-2 px-5 py-3" style={{ borderTop: "1px solid var(--divider)" }}>
        <input name="name" required placeholder="Site name (e.g. Fresno plant)" className="input flex-1 text-xs" style={{ minWidth: "10rem" }} />
        <input name="city" placeholder="City" className="input text-xs" style={{ width: "7rem" }} />
        <input name="state" placeholder="State" maxLength={2} className="input text-xs" style={{ width: "4rem" }} />
        <input name="zip" placeholder="Zip" className="input text-xs" style={{ width: "5rem" }} />
        <select name="egrid_subregion" required defaultValue="" className="input text-xs" style={{ width: "13rem" }}>
          <option value="" disabled>Grid subregion (eGRID)</option>
          {EGRID_SUBREGION_OPTIONS.map((o) => (
            <option key={o.factorId} value={o.factorId}>{o.label}</option>
          ))}
        </select>
        <input name="contact_email" type="email" placeholder="Site contact email (optional)" className="input text-xs" style={{ width: "13rem" }} />
        <button className="btn btn-secondary shrink-0 px-3 py-1.5 text-xs">Add site</button>
      </form>
    </div>
  );
}
