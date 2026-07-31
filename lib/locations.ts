import { SEED_FACTORS } from "./factors";

/** Multi-office collection helpers (Plan MO). Pure functions - both the
 *  consultant client page and the CFO portal render the same rollup. */

/** eGRID subregion dropdown for the add-site form (MO1). Auto zip→subregion
 *  lookup is deferred (MO6); for now the consultant/CFO picks the subregion. */
export const EGRID_SUBREGION_OPTIONS: { factorId: string; label: string }[] = SEED_FACTORS
  .filter((f) => f.category === "electricity_location")
  .map((f) => ({ factorId: f.factor_id, label: f.factor_name }));

export type SiteStatus = "no_link" | "link_sent" | "responding" | "complete";

export const SITE_STATUS_LABEL: Record<SiteStatus, string> = {
  no_link: "No link sent",
  link_sent: "Link sent",
  responding: "Responding",
  complete: "Complete",
};

export type SiteRollup = {
  locationId: string;
  status: SiteStatus;
  /** The site's open (or latest) child request, if any. */
  requestId: string | null;
  token: string | null;
  itemsReceived: number;
  itemsTotal: number;
  co2eKg: number;
};

type ChildRequest = {
  id: string;
  locationId: string | null;
  status: string;
  token: string | null;
  checklist: unknown;
};

type TaggedItem = { locationId: string | null; co2eKg: string | number; status: string };

/** Per-site status + completeness + emissions subtotal (MO5): the coordination
 *  surface that unblocks the CFO. Company total = sum of sites + untagged rows. */
export function siteRollups(
  locationIds: string[],
  requests: ChildRequest[],
  items: TaggedItem[]
): SiteRollup[] {
  return locationIds.map((locationId) => {
    const reqs = requests.filter((r) => r.locationId === locationId);
    const req = reqs.find((r) => r.status === "open") ?? reqs[0] ?? null;
    const checklist = (req?.checklist as { status: string }[] | null) ?? [];
    const itemsReceived = checklist.filter((c) => c.status === "received").length;
    const siteItems = items.filter((i) => i.locationId === locationId && i.status === "mapped");
    const co2eKg = siteItems.reduce((s, i) => s + Number(i.co2eKg), 0);

    const status: SiteStatus = !req
      ? "no_link"
      : req.status === "fulfilled"
        ? "complete"
        : itemsReceived > 0 || siteItems.length > 0
          ? "responding"
          : "link_sent";

    return { locationId, status, requestId: req?.id ?? null, token: req?.token ?? null, itemsReceived, itemsTotal: checklist.length, co2eKg };
  });
}
