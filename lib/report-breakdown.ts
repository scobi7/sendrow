import type { Company } from "./types";
import { recAdjustedKwhTons, type RecContext } from "./calc";
import { isSupplierCalculated } from "./ingestion/supplier-calculated";

/**
 * Per-scope breakdown for the consultant PDF report. Covers the same rows
 * combinedTotals() sums: manual calcs (company.calcs) plus mapped line items.
 * Excluded and unmapped line items are left out, exactly as the totals leave them out.
 * Tons are not rounded here so the group sums match combinedTotals within rounding.
 */

type BreakdownBasis = "measured" | "spend_based" | "estimated";

export interface BreakdownRow {
  scope: 1 | 2 | 3;
  /** Category, plus the site when the row belongs to one. */
  source: string;
  /** Location-based tCO2e. */
  tons: number;
  /** Market-based tCO2e (Scope 2 only; null elsewhere). */
  marketTons: number | null;
  basis: BreakdownBasis;
  supplierCalculated: boolean;
  origin: "manual" | "line_item";
  /** Number of line items grouped into this row (1 for manual rows). */
  count: number;
}

export interface BreakdownLineItem {
  scope: number;
  category: string;
  co2eKg: string | number;
  rawValue?: string | number | null;
  rawUnit?: string | null;
  status: string;
  confidence: string;
  factorId: string | null;
  locationId: string | null;
  calcLog: unknown;
}

export interface BuildBreakdownOptions {
  /** REC/residual-mix context (recContextFor in lib/calc.ts). */
  rec?: RecContext;
  /** Factor ids whose factor category is "spend_based". */
  spendFactorIds?: ReadonlySet<string>;
}

function siteLabel(company: Pick<Company, "locations">, locationId: string | null): string | null {
  if (!locationId) return null;
  const loc = company.locations.find((l) => l.id === locationId);
  if (!loc) return null;
  const label = [loc.address, loc.city].map((p) => p?.trim() ?? "").filter(Boolean).join(", ");
  return label || null;
}

function categoryLabel(category: string): string {
  const s = category.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Builds the per-scope breakdown rows. Manual calcs stay one row each; mapped line
 *  items group by scope, source (category + site), basis and supplier-calculated flag. */
export function buildReportBreakdown(
  company: Pick<Company, "calcs" | "locations">,
  items: BreakdownLineItem[],
  opts: BuildBreakdownOptions = {}
): BreakdownRow[] {
  const rows: BreakdownRow[] = [];

  for (const c of company.calcs) {
    rows.push({
      scope: c.scope,
      source: c.category,
      tons: c.co2eTons,
      marketTons: c.scope === 2 ? (c.marketBasedTons ?? c.co2eTons) : null,
      basis: c.basis,
      supplierCalculated: false,
      origin: "manual",
      count: 1,
    });
  }

  const groups = new Map<string, BreakdownRow>();
  for (const i of items) {
    if (i.status !== "mapped") continue;
    const scope = i.scope as 1 | 2 | 3;
    const supplierCalculated = i.confidence === "supplier_calculated" || isSupplierCalculated(i.calcLog);
    const spend = !supplierCalculated && !!i.factorId && !!opts.spendFactorIds?.has(i.factorId);
    const basis: BreakdownBasis = spend ? "spend_based" : i.confidence === "estimated" ? "estimated" : "measured";
    const site = siteLabel(company, i.locationId);
    const source = site ? `${categoryLabel(i.category)} (${site})` : categoryLabel(i.category);
    const tons = Number(i.co2eKg) / 1000;
    const market = scope === 2 ? (recAdjustedKwhTons(i, opts.rec) ?? tons) : null;

    const key = [scope, supplierCalculated, basis, source].join("|");
    const row = groups.get(key);
    if (row) {
      row.tons += tons;
      if (row.marketTons !== null && market !== null) row.marketTons += market;
      row.count += 1;
    } else {
      const created: BreakdownRow = { scope, source, tons, marketTons: market, basis, supplierCalculated, origin: "line_item", count: 1 };
      groups.set(key, created);
      rows.push(created);
    }
  }

  return rows;
}
