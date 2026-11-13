import { describe, it, expect } from "vitest";
import { recAdjustedKwhTons, applyScope2MarketOverride, type RecContext } from "@/lib/calc";
import { factorFromRow } from "@/lib/factor-engine";

const rec: RecContext = { hasRecs: true, recCoveragePct: 50, residualFactorValue: 0.000428 };

describe("recAdjustedKwhTons (market-based REC rule)", () => {
  const elec = { category: "electricity", rawUnit: "kWh", rawValue: 10000 };

  it("applies residual-mix factor less REC coverage to kWh electricity", () => {
    expect(recAdjustedKwhTons(elec, rec)).toBeCloseTo(2.14, 10);
  });

  it("ignores coverage when the company has no RECs", () => {
    expect(recAdjustedKwhTons(elec, { ...rec, hasRecs: false })).toBeCloseTo(4.28, 10);
  });

  it("accepts string raw values, as the DB returns numeric columns", () => {
    expect(recAdjustedKwhTons({ ...elec, rawValue: "10000" }, rec)).toBeCloseTo(2.14, 10);
  });

  it("returns null (keep location-based) when there is no rec context", () => {
    expect(recAdjustedKwhTons(elec, undefined)).toBeNull();
  });

  it("returns null for non-electricity, non-kWh, or valueless rows", () => {
    expect(recAdjustedKwhTons({ ...elec, category: "natural_gas" }, rec)).toBeNull();
    expect(recAdjustedKwhTons({ ...elec, rawUnit: "MWh" }, rec)).toBeNull();
    expect(recAdjustedKwhTons({ ...elec, rawValue: null }, rec)).toBeNull();
  });
});

describe("applyScope2MarketOverride (consultant override rule)", () => {
  it("returns the derived figure when there is no override", () => {
    expect(applyScope2MarketOverride(5.5, undefined)).toBe(5.5);
    expect(applyScope2MarketOverride(5.5, null)).toBe(5.5);
  });

  it("an override wins and is rounded to 2dp", () => {
    expect(applyScope2MarketOverride(5.5, 3.14159)).toBe(3.14);
  });

  it("a zero override is an override, not an absent one", () => {
    expect(applyScope2MarketOverride(5.5, 0)).toBe(0);
  });
});

describe("factorFromRow (shared DB-row mapper)", () => {
  it("maps a numeric string value and nullable retirement year", () => {
    const f = factorFromRow({
      factorId: "egrid.USAVG.2024",
      factorName: "US national average grid",
      category: "electricity_location",
      value: "0.00036900",
      unit: "tCO2e/kWh",
      source: "EPA eGRID",
      sourceUrl: "https://www.epa.gov/egrid",
      yearEffective: 2024,
      yearRetired: null,
    });
    expect(f).toEqual({
      factor_id: "egrid.USAVG.2024",
      factor_name: "US national average grid",
      category: "electricity_location",
      value: 0.000369,
      unit: "tCO2e/kWh",
      source: "EPA eGRID",
      source_url: "https://www.epa.gov/egrid",
      year_effective: 2024,
      year_retired: null,
    });
  });
});
