import { describe, it, expect } from "vitest";
import { recalcCompany, totals, reportingPeriod } from "@/lib/calc";
import { createCompanyRecord } from "@/lib/newcompany";

// Minimal manual-entry company fixture with one location
function makeCompany() {
  const c = createCompanyRecord("Test Co");
  c.industry = "Professional Services";
  c.headcountRange = "50_150";
  c.fiscalYearEndMonth = 12;
  c.locations = [{ id: "loc_1", address: "123 Main", city: "Los Angeles", state: "CA", zip: "90001", egridSubregion: "egrid.CAMX.2024" }];
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

  it("natural gas manual therms override produces a scope 1 calc", () => {
    const c = makeCompany();
    c.inputs.natgas_na = false;
    c.inputs.natgas_therms_override = 1000;
    recalcCompany(c);
    const gas = c.calcs.find((r) => r.category === "Natural gas");
    expect(gas).toBeDefined();
    expect(gas!.co2eTons).toBeGreaterThan(0);
    expect(gas!.formula).toContain("manual entry");
  });

  it("natural gas with no override and no entry produces no calc", () => {
    const c = makeCompany();
    c.inputs.natgas_na = false;
    recalcCompany(c);
    expect(c.calcs.find((r) => r.category === "Natural gas")).toBeUndefined();
  });

  it("scope 3 commuting calc is produced from manual survey inputs", () => {
    const c = makeCompany();
    c.inputs.commute_avg_miles = 20;
    c.inputs.commute_mode = "Drive alone";
    c.inputs.commute_days_in_office = 5;
    recalcCompany(c);
    const commute = c.calcs.find((r) => r.category === "Employee commuting");
    expect(commute).toBeDefined();
    expect(commute!.scope).toBe(3);
    expect(commute!.co2eTons).toBeGreaterThan(0);
  });

  it("produces zero calcs when all NA flags set", () => {
    const c = makeCompany();
    c.inputs = { fleet_na: true, natgas_na: true, refrigerant_na: true, equipment_na: true };
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

  it("consultant scope 2 market override wins over the derived figure", () => {
    const c = makeCompany();
    c.inputs.scope2_market_override_tons = 12.345;
    recalcCompany(c);
    expect(totals(c).scope2Market).toBe(12.35);
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
