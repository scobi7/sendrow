/** Cross-client vendor-mapping memory (Plan J Phase 3).
 *
 *  Confirm a vendor once ("PG&E = Scope 2 electricity, this factor") and it is
 *  mapped forever, for every client. Mappings are global and human-confirmed
 *  only (contracts/ §12); auto-applications record the mapping id in the calc
 *  log so every figure stays traceable. */

export type VendorMapping = {
  id: string;
  vendorPattern: string; // normalized via normalizeVendor
  scope: number;
  category: string;
  factorId: string | null;
};

const DROPPED_SUFFIXES = new Set(["inc", "incorporated", "llc", "llp", "corp", "corporation", "co", "company", "ltd", "limited", "plc"]);

/** "Pacific Gas & Electric, Inc." → "pacific gas electric" */
export function normalizeVendor(raw: string): string {
  const words = raw
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  while (words.length > 1 && DROPPED_SUFFIXES.has(words[words.length - 1])) words.pop();
  return words.join(" ");
}

/** Exact match on the normalized vendor name. Returns null when unconfirmed —
 *  unknown vendors must keep flagging as unmapped, never guessed. */
export function matchVendor(raw: string | undefined, mappings: VendorMapping[]): VendorMapping | null {
  if (!raw?.trim()) return null;
  const normalized = normalizeVendor(raw);
  if (!normalized) return null;
  return mappings.find((m) => m.vendorPattern === normalized) ?? null;
}

/** Curated choices for the consultant's "confirm vendor" flow. Each option
 *  carries everything a mapping needs; the factor determines the unit the
 *  vendor's quantities are interpreted in. */
export const VENDOR_CONFIRM_OPTIONS: { key: string; label: string; scope: number; category: string; factorId: string }[] = [
  { key: "electricity", label: "Electricity utility (kWh)", scope: 2, category: "electricity", factorId: "egrid.USAVG.2024" },
  { key: "natgas", label: "Natural gas utility (therms)", scope: 1, category: "stationary_combustion", factorId: "natgas.therm.2025" },
  { key: "diesel", label: "Diesel fuel supplier (gallons)", scope: 1, category: "mobile_combustion", factorId: "fuel.diesel.2025" },
  { key: "gasoline", label: "Gasoline supplier (gallons)", scope: 1, category: "mobile_combustion", factorId: "fuel.gasoline.2025" },
  { key: "propane", label: "Propane supplier (gallons)", scope: 1, category: "stationary_combustion", factorId: "fuel.propane.2025" },
  { key: "waste", label: "Waste hauler (tons landfilled)", scope: 3, category: "waste", factorId: "waste.landfill.2025" },
  { key: "freight", label: "Freight / shipping ($ spend)", scope: 3, category: "upstream_freight", factorId: "useeio.freight.v2" },
  { key: "air_travel", label: "Airline / travel agency ($ spend)", scope: 3, category: "business_travel", factorId: "useeio.air_travel.v2" },
  { key: "hotels", label: "Hotels / lodging ($ spend)", scope: 3, category: "business_travel", factorId: "useeio.hotels.v2" },
  { key: "it_services", label: "Software / IT services ($ spend)", scope: 3, category: "purchased_goods_services", factorId: "useeio.it_services.v2" },
  { key: "prof_services", label: "Professional services ($ spend)", scope: 3, category: "purchased_goods_services", factorId: "useeio.prof_services.v2" },
  { key: "materials", label: "Materials / manufactured goods ($ spend)", scope: 3, category: "purchased_goods_services", factorId: "useeio.materials.v2" },
  { key: "chemicals", label: "Chemicals ($ spend)", scope: 3, category: "purchased_goods_services", factorId: "useeio.chemicals.v2" },
  { key: "packaging", label: "Packaging supplies ($ spend)", scope: 3, category: "purchased_goods_services", factorId: "useeio.packaging.v2" },
  { key: "machinery", label: "Machinery / equipment ($ spend)", scope: 3, category: "purchased_goods_services", factorId: "useeio.machinery.v2" },
  { key: "food", label: "Food & beverage supplier ($ spend)", scope: 3, category: "purchased_goods_services", factorId: "useeio.food.v2" },
  { key: "office", label: "Office supplies ($ spend)", scope: 3, category: "purchased_goods_services", factorId: "useeio.office_supplies.v2" },
];

/** DB loader with seed-free fallback; callers pass the result into the pure
 *  ingestion functions so tests never need a database. */
export async function getVendorMappingsFromDb(): Promise<VendorMapping[]> {
  try {
    const { db } = await import("./db");
    const { vendorMappings } = await import("./db/schema");
    const rows = await db.select().from(vendorMappings);
    return rows.map((r) => ({
      id: r.id,
      vendorPattern: r.vendorPattern,
      scope: r.scope,
      category: r.category,
      factorId: r.factorId ?? null,
    }));
  } catch {
    return [];
  }
}
