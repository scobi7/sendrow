import { applyFactor, lookupFactor } from "./factor-engine";
import type { EmissionFactor } from "./types";

/** Pure line-item corrections for the Data Ledger (Plan T1). Every correction
 *  produces a full new calc log that records what changed and why — the audit
 *  trail survives the edit. Excluded items keep their data but leave totals. */

export type LedgerItem = {
  rawValue: string;
  rawUnit: string;
  scope: number;
  category: string;
  status: string;
  factorId: string | null;
  co2eKg: string;
  calcLog: Record<string, unknown>;
};

export type LedgerPatch = {
  scope: number;
  category: string;
  co2eKg: string;
  status: "mapped";
  factorId: string;
  calcLog: Record<string, unknown>;
};

/** Recomputes a line item against a (possibly different) factor and/or quantity. */
export function recomputeLineItem(
  item: LedgerItem,
  factor: EmissionFactor,
  opts: { quantity?: number; scope?: number; category?: string; editedBy: string; reason: string }
): LedgerPatch {
  const quantity = opts.quantity ?? Number(item.rawValue);
  const { co2e_kg, calc_log } = applyFactor(quantity, item.rawUnit, factor);
  return {
    scope: opts.scope ?? item.scope,
    category: opts.category ?? item.category,
    co2eKg: co2e_kg.toFixed(4),
    status: "mapped",
    factorId: factor.factor_id,
    calcLog: {
      ...calc_log,
      correction: {
        reason: opts.reason,
        edited_by: opts.editedBy,
        previous_factor_id: item.factorId,
        previous_co2e_kg: Number(item.co2eKg),
        previous_status: item.status,
      },
    },
  };
}

/** Marks an item excluded — data kept, removed from all totals (no silent drops). */
export function excludeLineItem(
  item: LedgerItem,
  editedBy: string,
  reason: string
): { status: "excluded"; calcLog: Record<string, unknown> } {
  return {
    status: "excluded",
    calcLog: {
      ...item.calcLog,
      exclusion: {
        reason,
        excluded_by: editedBy,
        previous_status: item.status,
        previous_co2e_kg: Number(item.co2eKg),
        excluded_at: new Date().toISOString(),
      },
    },
  };
}

/** Which fuel a flagged row is, judged from its recorded activity text. */
export function fuelKindOf(item: { calcLog: Record<string, unknown> }): "diesel" | "gasoline" | "propane" | null {
  const t = String((item.calcLog as { activity_type?: string }).activity_type ?? "").toLowerCase();
  if (t.includes("diesel")) return "diesel";
  if (t.includes("propane")) return "propane";
  if (t.includes("gasoline") || t.includes("petrol") || (t.includes("gas") && !t.includes("natural"))) return "gasoline";
  return null;
}

/** True when a flagged row is a dollar-amount fuel row awaiting price conversion. */
export function isDollarFuelRow(item: { status: string; rawUnit: string; calcLog: Record<string, unknown> }): boolean {
  if (item.status !== "unmapped") return false;
  if (!fuelKindOf(item)) return false;
  const u = item.rawUnit.toLowerCase();
  return u === "" || u.includes("usd") || u.includes("$") || u.includes("dollar");
}

export type FuelPriceInputs = { diesel?: number; gasoline?: number; propane?: number };

/** Converts a $-fuel row using the consultant's price: $ ÷ $/gal → gallons ×
 *  EPA factor. The full derivation lands in the calc log — the dollar amount,
 *  the price used, who set it. */
export function convertDollarFuelItem(
  item: LedgerItem,
  prices: FuelPriceInputs,
  factors: import("./types").EmissionFactor[],
  editedBy: string
): (LedgerPatch & { rawUnit: string }) | null {
  const kind = fuelKindOf(item);
  if (!kind) return null;
  const price = prices[kind];
  if (!price || price <= 0) return null;

  const factorId = kind === "diesel" ? "fuel.diesel.2025" : kind === "propane" ? "fuel.propane.2025" : "fuel.gasoline.2025";
  const factor = lookupFactor(factors, { factorId });
  if (!factor) return null;

  const dollars = Number(item.rawValue);
  const gallons = dollars / price;
  const { co2e_kg, calc_log } = applyFactor(gallons, "gallon", factor);
  return {
    scope: 1,
    category: "mobile_combustion",
    co2eKg: co2e_kg.toFixed(4),
    status: "mapped",
    factorId: factor.factor_id,
    rawUnit: "USD",
    calcLog: {
      ...calc_log,
      dollar_amount: dollars,
      price_per_gal: price,
      derived_gallons: gallons,
      formula: `$${dollars} ÷ $${price}/gal = ${gallons.toFixed(2)} gal × ${factor.value} ${factor.unit} × 1000 kg/t`,
      correction: {
        reason: `Dollar fuel converted at consultant-set $${price}/gal (${kind})`,
        edited_by: editedBy,
        previous_status: item.status,
      },
    },
  };
}
