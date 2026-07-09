import { applyFactor } from "./factor-engine";
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
