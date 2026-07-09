import { describe, it, expect } from "vitest";
import { recomputeLineItem, excludeLineItem } from "@/lib/ledger";
import { SEED_FACTORS } from "@/lib/factors";
import { lookupFactor } from "@/lib/factor-engine";

const base = {
  rawValue: "1200",
  rawUnit: "kWh",
  scope: 3,
  category: "purchased_goods_services",
  status: "unmapped",
  factorId: null,
  co2eKg: "0",
  calcLog: { reason: "no factor" },
};

describe("ledger corrections (Plan T1)", () => {
  it("recategorize recomputes emissions and logs the correction", () => {
    const factor = lookupFactor(SEED_FACTORS, { factorId: "egrid.USAVG.2024" })!;
    const patch = recomputeLineItem(base, factor, {
      scope: 2,
      category: "electricity",
      editedBy: "user_c1",
      reason: "Recategorized",
    });
    expect(patch.status).toBe("mapped");
    expect(patch.scope).toBe(2);
    expect(Number(patch.co2eKg)).toBeCloseTo(1200 * factor.value * 1000, 2);
    const corr = patch.calcLog.correction as Record<string, unknown>;
    expect(corr.previous_status).toBe("unmapped");
    expect(corr.edited_by).toBe("user_c1");
  });

  it("quantity edit keeps the factor, recomputes, preserves history", () => {
    const factor = lookupFactor(SEED_FACTORS, { factorId: "egrid.USAVG.2024" })!;
    const mapped = { ...base, status: "mapped", factorId: factor.factor_id, co2eKg: "463.2" };
    const patch = recomputeLineItem(mapped, factor, { quantity: 600, editedBy: "user_c1", reason: "typo" });
    expect(Number(patch.co2eKg)).toBeCloseTo(600 * factor.value * 1000, 2);
    expect((patch.calcLog.correction as Record<string, unknown>).previous_co2e_kg).toBeCloseTo(463.2);
  });

  it("exclude keeps the data and the reason — nothing is deleted", () => {
    const patch = excludeLineItem({ ...base, status: "mapped", co2eKg: "500" }, "user_c1", "duplicate row");
    expect(patch.status).toBe("excluded");
    const ex = patch.calcLog.exclusion as Record<string, unknown>;
    expect(ex.reason).toBe("duplicate row");
    expect(ex.previous_status).toBe("mapped");
    expect(ex.previous_co2e_kg).toBe(500);
    // original log content preserved
    expect(patch.calcLog.reason).toBe("no factor");
  });
});
