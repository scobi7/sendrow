import { describe, it, expect } from "vitest";
import { SEED_FACTORS, egridForState } from "@/lib/factors";
import { lookupFactor, applyFactor } from "@/lib/factor-engine";

const ALL_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO",
  "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
  "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

describe("egridForState — full coverage (Plan I)", () => {
  it("covers all 50 states + DC", () => {
    expect(ALL_STATES.length).toBe(51);
  });

  for (const state of ALL_STATES) {
    it(`${state} resolves to a real eGRID subregion, not the national average`, () => {
      const factorId = egridForState(state);
      expect(factorId).not.toBe("egrid.USAVG.2024");
      const factor = lookupFactor(SEED_FACTORS, { factorId });
      expect(factor, `factor ${factorId} missing from SEED_FACTORS`).not.toBeNull();
      expect(factor!.category).toBe("electricity_location");
      expect(factor!.value).toBeGreaterThan(0);
    });
  }

  it("preserves legacy mappings (historical calcs keep their subregion)", () => {
    expect(egridForState("CA")).toBe("egrid.CAMX.2024");
    expect(egridForState("TX")).toBe("egrid.ERCT.2024");
    expect(egridForState("WY")).toBe("egrid.NWPP.2024");
    expect(egridForState("NM")).toBe("egrid.AZNM.2024");
  });
});

describe("factor vintage (Plan I — no factor application without a recorded vintage)", () => {
  it("applyFactor records the factor vintage in every calc log", () => {
    for (const factor of SEED_FACTORS) {
      const { calc_log } = applyFactor(1, factor.unit, factor);
      expect(calc_log.factor_vintage, `${factor.factor_id} has no vintage`).toBe(factor.year_effective);
      expect(calc_log.factor_vintage).toBeGreaterThan(2000);
    }
  });

  it("every seed factor carries a vintage year", () => {
    for (const factor of SEED_FACTORS) {
      expect(factor.year_effective, `${factor.factor_id}`).toBeGreaterThan(2000);
    }
  });
});
