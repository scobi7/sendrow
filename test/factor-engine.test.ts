import { describe, it, expect } from "vitest";
import { lookupFactor, applyFactor } from "@/lib/factor-engine";
import { SEED_FACTORS } from "@/lib/factors";

describe("lookupFactor", () => {
  it("finds a factor by exact factor_id", () => {
    const f = lookupFactor(SEED_FACTORS, { factorId: "fuel.gasoline.2025" });
    expect(f).not.toBeNull();
    expect(f!.factor_id).toBe("fuel.gasoline.2025");
  });

  it("returns null for an unknown factor_id", () => {
    const f = lookupFactor(SEED_FACTORS, { factorId: "nonexistent.factor" });
    expect(f).toBeNull();
  });

  it("finds a factor by category", () => {
    const f = lookupFactor(SEED_FACTORS, { category: "mobile_combustion" });
    expect(f).not.toBeNull();
    expect(f!.category).toBe("mobile_combustion");
  });

  it("returns the most recent vintage when multiple match", () => {
    const factors = [
      { ...SEED_FACTORS[0], factor_id: "fuel.gasoline.2023", year_effective: 2023 },
      { ...SEED_FACTORS[0], factor_id: "fuel.gasoline.2025", year_effective: 2025 },
    ];
    const f = lookupFactor(factors, { category: "mobile_combustion" });
    expect(f!.year_effective).toBe(2025);
  });

  it("excludes retired factors", () => {
    const retired = { ...SEED_FACTORS[0], factor_id: "old.factor", year_retired: 2020 };
    const f = lookupFactor([retired], { factorId: "old.factor" });
    expect(f).not.toBeNull();
    const fByCategory = lookupFactor([retired], { category: "mobile_combustion" });
    expect(fByCategory).toBeNull();
  });
});

describe("applyFactor", () => {
  const gasolineFactor = SEED_FACTORS.find((f) => f.factor_id === "fuel.gasoline.2025")!;

  it("converts tCO2e to kg correctly", () => {
    const { co2e_kg } = applyFactor(1000, "gallon", gasolineFactor);
    // 1000 gal × 0.008887 tCO2e/gal × 1000 kg/t = 8887 kg
    expect(co2e_kg).toBeCloseTo(8887, 0);
  });

  it("calc_log contains all required fields", () => {
    const { calc_log } = applyFactor(500, "gallon", gasolineFactor);
    expect(calc_log.raw_value).toBe(500);
    expect(calc_log.raw_unit).toBe("gallon");
    expect(calc_log.factor_id).toBe("fuel.gasoline.2025");
    expect(calc_log.factor_vintage).toBe(2025);
    expect(calc_log.co2e_kg).toBeGreaterThan(0);
    expect(calc_log.computed_at).toBeTruthy();
    expect(calc_log.formula).toContain("500");
  });

  it("returns zero co2e_kg for a zero-value factor", () => {
    const zeroFactor = SEED_FACTORS.find((f) => f.factor_id === "commute.zero.2025")!;
    const { co2e_kg } = applyFactor(100, "mile", zeroFactor);
    expect(co2e_kg).toBe(0);
  });
});
