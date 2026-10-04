import { eq } from "drizzle-orm";
import { db } from "./db";
import { emissionLineItems, scope3Screening } from "./db/schema";
import type { RecContext } from "./calc";

export type ReportTotals = {
  scope1: number;
  scope2Location: number;
  scope2Market: number;
  scope3: number;
  total: number;
  byCategory: { scope: number; category: string; co2eTons: number }[];
  lineItemCount: number;
  source: "line_items" | "calcs";
};

/** Returns emission totals from imported line items.
 *  Returns null if no line items have been imported yet (caller falls back to gt_calcs).
 *  Pass `rec` (see `recContextFor` in `lib/calc.ts`) so market-based scope 2
 *  gets the same REC/residual-mix adjustment the manual-entry path applies -
 *  without it, electricity line items fall back to location-based for both. */
export async function getLineItemTotals(companyId: string, rec?: RecContext): Promise<ReportTotals | null> {
  const items = await db
    .select()
    .from(emissionLineItems)
    .where(eq(emissionLineItems.companyId, companyId));

  if (items.length === 0) return null;

  const grouped: Record<string, { scope: number; category: string; co2eKg: number }> = {};
  for (const item of items) {
    const key = `${item.scope}:${item.category}`;
    if (!grouped[key]) grouped[key] = { scope: item.scope, category: item.category, co2eKg: 0 };
    grouped[key].co2eKg += Number(item.co2eKg);
  }

  const byCategory = Object.values(grouped).map((g) => ({
    scope: g.scope,
    category: g.category,
    co2eTons: g.co2eKg / 1000,
  }));

  const scope1 = byCategory.filter((r) => r.scope === 1).reduce((s, r) => s + r.co2eTons, 0);
  const scope2Location = byCategory.filter((r) => r.scope === 2).reduce((s, r) => s + r.co2eTons, 0);
  const scope3 = byCategory.filter((r) => r.scope === 3).reduce((s, r) => s + r.co2eTons, 0);

  let scope2Market = scope2Location;
  if (rec) {
    let marketKg = 0;
    for (const item of items) {
      if (item.scope !== 2) continue;
      if (item.category === "electricity" && item.rawUnit === "kWh") {
        const kwh = Number(item.rawValue);
        marketKg += kwh * rec.residualFactorValue * (1 - (rec.hasRecs ? rec.recCoveragePct : 0) / 100) * 1000;
      } else {
        marketKg += Number(item.co2eKg);
      }
    }
    scope2Market = marketKg / 1000;
  }

  return {
    scope1,
    scope2Location,
    scope2Market,
    scope3,
    total: scope1 + scope2Location + scope3,
    byCategory,
    lineItemCount: items.length,
    source: "line_items",
  };
}

export type ScreeningDecision = {
  categoryNumber: number;
  categoryName: string;
  status: string;
  reason: string | null;
};

export async function getScreeningDecisions(companyId: string): Promise<ScreeningDecision[]> {
  const rows = await db
    .select()
    .from(scope3Screening)
    .where(eq(scope3Screening.companyId, companyId));
  return rows.map((r) => ({
    categoryNumber: r.categoryNumber,
    categoryName: r.categoryName,
    status: r.status,
    reason: r.reason,
  }));
}
