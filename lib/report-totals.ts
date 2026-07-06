import { eq } from "drizzle-orm";
import { db } from "./db";
import { emissionLineItems, scope3Screening } from "./db/schema";

export type ReportTotals = {
  scope1: number;
  scope2Location: number;
  scope3: number;
  total: number;
  byCategory: { scope: number; category: string; co2eTons: number }[];
  lineItemCount: number;
  source: "line_items" | "calcs";
};

/** Returns emission totals from imported line items.
 *  Returns null if no line items have been imported yet (caller falls back to gt_calcs). */
export async function getLineItemTotals(companyId: string): Promise<ReportTotals | null> {
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

  return {
    scope1,
    scope2Location,
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
