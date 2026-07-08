import { describe, it, expect } from "vitest";
import { SEED_FACTORS, egridForState, QB_CATEGORY_TO_USEEIO, REFRIGERANT_FACTOR, COMMUTE_FACTOR, SCOPE3_OTHER_CATEGORIES } from "@/lib/factors";
import { getFactor } from "@/lib/store";

describe("SEED_FACTORS integrity", () => {
  it("all factors have positive values", () => {
    for (const f of SEED_FACTORS) {
      expect(f.value).toBeGreaterThanOrEqual(0);
    }
  });

  it("all factors have required fields", () => {
    for (const f of SEED_FACTORS) {
      expect(f.factor_id).toBeTruthy();
      expect(f.factor_name).toBeTruthy();
      expect(f.category).toBeTruthy();
      expect(f.unit).toBeTruthy();
      expect(f.source).toBeTruthy();
      expect(f.year_effective).toBeGreaterThan(2000);
    }
  });

  it("factor_ids are unique", () => {
    const ids = SEED_FACTORS.map((f) => f.factor_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all calc.ts hard-coded factor IDs resolve without throwing", () => {
    const usedIds = [
      "fuel.gasoline.2025",
      "fuel.diesel.2025",
      "fuel.propane.2025",
      "natgas.therm.2025",
      "equip.diesel.2025",
      "equip.gasoline.2025",
      "equip.propane.2025",
      "egrid.CAMX.2024",
      "egrid.NWPP.2024",
      "egrid.AZNM.2024",
      "egrid.ERCT.2024",
      "egrid.USAVG.2024",
      "residual.WECC.2024",
      "waste.landfill.2025",
      "waste.recycled.2025",
      "waste.composted.2025",
      "commute.car.2025",
      "commute.carpool.2025",
      "commute.transit.2025",
      "commute.rail.2025",
      "commute.zero.2025",
    ];
    for (const id of usedIds) {
      expect(() => getFactor(id)).not.toThrow();
    }
  });
});

describe("egridForState", () => {
  it("maps CA to CAMX", () => expect(egridForState("CA")).toBe("egrid.CAMX.2024"));
  it("maps TX to ERCT", () => expect(egridForState("TX")).toBe("egrid.ERCT.2024"));
  it("maps OR to NWPP", () => expect(egridForState("OR")).toBe("egrid.NWPP.2024"));
  it("maps AZ to AZNM", () => expect(egridForState("AZ")).toBe("egrid.AZNM.2024"));
  it("maps NY to NYCW (largest load center)", () => expect(egridForState("NY")).toBe("egrid.NYCW.2024"));
  it("unknown state codes default to USAVG", () => expect(egridForState("XX")).toBe("egrid.USAVG.2024"));
  it("handles lowercase input", () => expect(egridForState("ca")).toBe("egrid.CAMX.2024"));
});

describe("QB_CATEGORY_TO_USEEIO", () => {
  it("all mapped factor IDs exist in SEED_FACTORS", () => {
    const factorIds = SEED_FACTORS.map((f) => f.factor_id);
    for (const [, map] of Object.entries(QB_CATEGORY_TO_USEEIO)) {
      expect(factorIds).toContain(map.factorId);
    }
  });

  it("all bucket values are valid", () => {
    const valid = new Set(["travel", "purchased", "freight"]);
    for (const [, map] of Object.entries(QB_CATEGORY_TO_USEEIO)) {
      expect(valid.has(map.bucket)).toBe(true);
    }
  });
});

describe("REFRIGERANT_FACTOR", () => {
  it("all refrigerant factor IDs exist in SEED_FACTORS", () => {
    const factorIds = SEED_FACTORS.map((f) => f.factor_id);
    for (const [, fid] of Object.entries(REFRIGERANT_FACTOR)) {
      expect(factorIds).toContain(fid);
    }
  });

  it("all refrigerant factors have GWP > 0", () => {
    for (const [, fid] of Object.entries(REFRIGERANT_FACTOR)) {
      const f = getFactor(fid);
      expect(f.value).toBeGreaterThan(0);
    }
  });
});

describe("COMMUTE_FACTOR", () => {
  it("all commute factor IDs exist in SEED_FACTORS", () => {
    const factorIds = SEED_FACTORS.map((f) => f.factor_id);
    for (const [, fid] of Object.entries(COMMUTE_FACTOR)) {
      expect(factorIds).toContain(fid);
    }
  });

  it("zero-emission commute mode has factor value 0", () => {
    const fid = COMMUTE_FACTOR["Bike / walk / mostly remote"];
    expect(getFactor(fid).value).toBe(0);
  });
});

describe("SCOPE3_OTHER_CATEGORIES", () => {
  it("has exactly 6 categories", () => {
    expect(SCOPE3_OTHER_CATEGORIES.length).toBe(6);
  });

  it("no duplicates", () => {
    expect(new Set(SCOPE3_OTHER_CATEGORIES).size).toBe(SCOPE3_OTHER_CATEGORIES.length);
  });
});
