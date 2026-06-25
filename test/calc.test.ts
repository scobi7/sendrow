import { describe, it, expect } from "vitest";
import { recalcCompany, totals, reportingPeriod } from "@/lib/calc";
import { createCompanyRecord } from "@/lib/newcompany";
import { generateQBTransactions, generateUtilityData } from "@/lib/mockdata";

// Minimal company fixture with one location and both integrations connected
function makeCompany() {
  const c = createCompanyRecord("Test Co");
  c.industry = "Professional Services";
  c.headcountRange = "50_150";
  c.fiscalYearEndMonth = 12;
  c.locations = [{ id: "loc_1", address: "123 Main", city: "Los Angeles", state: "CA", zip: "90001", egridSubregion: "egrid.CAMX.2024" }];
  c.connections.quickbooks = { connected: true, lastSynced: new Date().toISOString() };
  c.connections.utility = { connected: true, lastSynced: new Date().toISOString() };
  c.qbTransactions = generateQBTransactions(c);
  c.utilityData = generateUtilityData(c);
  c.inputs = {
    fleet_gasoline_gal: 500,
    fleet_diesel_gal: 200,
    natgas_na: true,
    refrigerant_na: true,
    equipment_na: true,
    scope2_reviewed: true,
  };
  return c;
}

describe("recalcCompany", () => {
  it("produces non-negative tCO2e for all scope 1 results", () => {
    const c = makeCompany();
    recalcCompany(c);
    for (const r of c.calcs.filter((r) => r.scope === 1)) {
      expect(r.co2eTons).toBeGreaterThanOrEqual(0);
    }
  });

  it("scope 1 fleet gasoline calc matches EPA factor", () => {
    const c = makeCompany();
    c.inputs.fleet_na = false;
    c.inputs.fleet_diesel_gal = null;
    c.inputs.fleet_gasoline_gal = 1000;
    recalcCompany(c);
    const gasoline = c.calcs.find((r) => r.category.includes("gasoline"));
    expect(gasoline).toBeDefined();
    // EPA factor: 0.008887 tCO2e/gal → 1000 gal = 8.887 tCO2e (rounded to 2dp = 8.89)
    expect(gasoline!.co2eTons).toBeCloseTo(8.89, 1);
  });

  it("scope 2 electricity result exists when utility is connected", () => {
    const c = makeCompany();
    recalcCompany(c);
    const s2 = c.calcs.filter((r) => r.scope === 2);
    expect(s2.length).toBeGreaterThan(0);
    expect(s2[0].co2eTons).toBeGreaterThan(0);
  });

  it("scope 2 market-based tons are populated", () => {
    const c = makeCompany();
    recalcCompany(c);
    const s2 = c.calcs.filter((r) => r.scope === 2);
    for (const r of s2) {
      expect(r.marketBasedTons).toBeDefined();
      expect(r.marketBasedTons).toBeGreaterThanOrEqual(0);
    }
  });

  it("scope 3 spend-based results exist when QB connected", () => {
    const c = makeCompany();
    recalcCompany(c);
    const s3 = c.calcs.filter((r) => r.scope === 3);
    expect(s3.length).toBeGreaterThan(0);
  });

  it("produces zero calcs when all NA flags set", () => {
    const c = makeCompany();
    c.inputs = { fleet_na: true, natgas_na: true, refrigerant_na: true, equipment_na: true };
    c.connections.quickbooks = { connected: false, lastSynced: null };
    c.connections.utility = { connected: false, lastSynced: null };
    recalcCompany(c);
    expect(c.calcs.length).toBe(0);
  });

  it("calcs have valid basis values", () => {
    const c = makeCompany();
    recalcCompany(c);
    const valid = new Set(["measured", "spend_based", "estimated"]);
    for (const r of c.calcs) {
      expect(valid.has(r.basis)).toBe(true);
    }
  });
});

describe("totals", () => {
  it("total equals scope1 + scope2Location + scope3 (not market-based)", () => {
    const c = makeCompany();
    recalcCompany(c);
    const t = totals(c);
    expect(t.total).toBeCloseTo(t.scope1 + t.scope2Location + t.scope3, 1);
  });

  it("all totals are non-negative", () => {
    const c = makeCompany();
    recalcCompany(c);
    const t = totals(c);
    expect(t.scope1).toBeGreaterThanOrEqual(0);
    expect(t.scope2Location).toBeGreaterThanOrEqual(0);
    expect(t.scope2Market).toBeGreaterThanOrEqual(0);
    expect(t.scope3).toBeGreaterThanOrEqual(0);
    expect(t.total).toBeGreaterThan(0);
  });
});

describe("reportingPeriod", () => {
  it("returns 12 months (start to end)", () => {
    const p = reportingPeriod(12);
    const start = new Date(p.start + "-01");
    const end = new Date(p.end + "-01");
    const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    expect(monthDiff).toBe(11); // start to end inclusive = 12 months
  });

  it("end month matches fiscal year end", () => {
    for (const month of [3, 6, 9, 12]) {
      const p = reportingPeriod(month);
      const endMonth = parseInt(p.end.split("-")[1]);
      expect(endMonth).toBe(month);
    }
  });

  it("start is always one month after end (wrapping correctly)", () => {
    const p = reportingPeriod(12);
    expect(p.start.endsWith("-01")).toBe(true); // Jan follows Dec
    const p2 = reportingPeriod(6);
    expect(p2.start.endsWith("-07")).toBe(true); // Jul follows Jun
  });
});
