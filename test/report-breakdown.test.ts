import { describe, it, expect } from "vitest";
import { combinedTotals, recContextFor } from "@/lib/calc";
import { buildReportBreakdown, type BreakdownLineItem } from "@/lib/report-breakdown";
import type { Company } from "@/lib/types";

function fakeCompany(): Company {
  return {
    id: "test-company",
    name: "Test Supplier Co",
    industry: null,
    headcountRange: null,
    locations: [{ id: "loc_1", address: "123 Main St", city: "Los Angeles", state: "CA", zip: "90001", egridSubregion: "egrid.CAMX.2024" }],
    fiscalYearEndMonth: 12,
    reportingFramework: null,
    setupComplete: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    inputs: { has_recs: true, rec_coverage_pct: 50 } as unknown as Company["inputs"],
    calcs: [
      { id: "calc-1", scope: 1, category: "Fleet fuel - gasoline", co2eTons: 1.5, factorId: "fuel.gasoline.2025", formula: "test", basis: "measured" },
    ],
    sectionStatus: {} as Company["sectionStatus"],
    reportGeneratedAt: null,
    actionPlan: null,
  };
}

const item = (over: Partial<BreakdownLineItem> & { scope: number; co2eKg: number }): BreakdownLineItem => ({
  category: "diesel",
  rawValue: 0,
  rawUnit: "gal",
  status: "mapped",
  confidence: "measured",
  factorId: null,
  locationId: null,
  calcLog: {},
  ...over,
});

const items: BreakdownLineItem[] = [
  item({ scope: 1, category: "diesel", co2eKg: 2000, rawValue: 200, rawUnit: "gal", factorId: "fuel.diesel.2025" }),
  item({ scope: 2, category: "electricity", co2eKg: 3000, rawValue: 10000, rawUnit: "kWh", locationId: "loc_1", factorId: "egrid.CAMX.2024" }),
  item({ scope: 2, category: "electricity", co2eKg: 1000, rawValue: 3000, rawUnit: "kWh", locationId: null, factorId: "egrid.CAMX.2024" }),
  item({ scope: 3, category: "purchased_goods", co2eKg: 1500, rawValue: 30000, rawUnit: "USD", factorId: "useeio.prof_services.v2", confidence: "estimated" }),
  item({ scope: 3, category: "business_travel", co2eKg: 500, rawValue: 500, rawUnit: "kg", confidence: "supplier_calculated", calcLog: { origin: "supplier_calculated" } }),
  // Excluded and unmapped rows must stay out of the totals and out of the breakdown.
  item({ scope: 1, category: "diesel", co2eKg: 9999, status: "excluded" }),
  item({ scope: 2, category: "electricity", co2eKg: 7777, status: "unmapped", locationId: "loc_1" }),
];

const spendFactorIds = new Set(["useeio.prof_services.v2"]);

describe("buildReportBreakdown", () => {
  const company = fakeCompany();
  const rows = buildReportBreakdown(company, items, { rec: recContextFor(company), spendFactorIds });
  const totals = combinedTotals(company, items);
  const sum = (scope: number, key: "tons" | "marketTons") =>
    rows.filter((r) => r.scope === scope).reduce((a, r) => a + (r[key] ?? 0), 0);

  it("per-scope location-based rows add up to the combinedTotals scope totals (within 0.01 t)", () => {
    expect(Math.abs(sum(1, "tons") - totals.scope1)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(sum(2, "tons") - totals.scope2Location)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(sum(3, "tons") - totals.scope3)).toBeLessThanOrEqual(0.01);
  });

  it("per-scope market-based Scope 2 rows add up to the combinedTotals Scope 2 market total", () => {
    expect(Math.abs(sum(2, "marketTons") - totals.scope2Market)).toBeLessThanOrEqual(0.01);
  });

  it("keeps manual calcs and line items together, with the excluded and unmapped rows left out", () => {
    // Scope 1: one manual calc + one mapped line item (the 9999 kg excluded row is not here)
    expect(rows.filter((r) => r.scope === 1)).toHaveLength(2);
    expect(sum(1, "tons")).toBeCloseTo(3.5, 6);
    // Scope 2: two line-item rows, one per site (the 7777 kg unmapped row is not here)
    const s2 = rows.filter((r) => r.scope === 2);
    expect(s2).toHaveLength(2);
    expect(s2.some((r) => r.source.includes("123 Main St"))).toBe(true);
    expect(sum(2, "tons")).toBeCloseTo(4, 6);
  });

  it("labels supplier-calculated rows and spend-based rows", () => {
    const supplier = rows.find((r) => r.scope === 3 && r.supplierCalculated);
    expect(supplier?.source).toBe("Business travel");
    const spend = rows.find((r) => r.scope === 3 && r.basis === "spend_based");
    expect(spend?.source).toBe("Purchased goods");
    expect(rows.some((r) => r.basis === "spend_based")).toBe(true);
  });

  it("returns no spend-based rows when no factor is spend-based", () => {
    const none = buildReportBreakdown(company, items, { rec: recContextFor(company) });
    expect(none.some((r) => r.basis === "spend_based")).toBe(false);
  });
});
