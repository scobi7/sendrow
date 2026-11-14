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

describe("dollar-fuel conversion (consultant sets the price, we do the math)", () => {
  const dollarRow = {
    rawValue: "612.40",
    rawUnit: "",
    scope: 1,
    category: "mobile_combustion",
    status: "unmapped",
    factorId: null,
    co2eKg: "0",
    calcLog: { reason: "no factor", activity_type: "Diesel", raw_unit: "" },
  };

  it("converts $ → gallons → CO2e with the full derivation logged", async () => {
    const { convertDollarFuelItem, isDollarFuelRow } = await import("@/lib/ledger");
    expect(isDollarFuelRow(dollarRow)).toBe(true);
    const patch = convertDollarFuelItem(dollarRow, { diesel: 4.1 }, SEED_FACTORS, "user_c1")!;
    const gallons = 612.4 / 4.1;
    expect(patch.status).toBe("mapped");
    expect(Number(patch.co2eKg)).toBeCloseTo(gallons * 0.01021 * 1000, 1);
    expect(patch.calcLog.price_per_gal).toBe(4.1);
    expect(patch.calcLog.derived_gallons).toBeCloseTo(gallons);
  });

  it("no price for that fuel → no conversion (never guesses)", async () => {
    const { convertDollarFuelItem } = await import("@/lib/ledger");
    expect(convertDollarFuelItem(dollarRow, { gasoline: 3.6 }, SEED_FACTORS, "u")).toBeNull();
  });

  it("natural gas rows are never mistaken for vehicle fuel", async () => {
    const { isDollarFuelRow } = await import("@/lib/ledger");
    expect(isDollarFuelRow({ ...dollarRow, calcLog: { activity_type: "natural gas", reason: "" } })).toBe(false);
  });
});

describe("line items feed the headline totals (the 'approve changed nothing' bug)", () => {
  it("combinedTotals = inputs-based calcs + mapped line items", async () => {
    const { combinedTotals, lineItemTotals } = await import("@/lib/calc");
    const items = [
      { scope: 2, co2eKg: 2000, status: "mapped" },   // 2 t
      { scope: 1, co2eKg: 500, status: "mapped" },    // 0.5 t
      { scope: 1, co2eKg: 999, status: "unmapped" },  // flagged: zero
      { scope: 3, co2eKg: 999, status: "excluded" },  // excluded: zero
    ];
    const li = lineItemTotals(items);
    expect(li.scope1).toBe(0.5);
    expect(li.scope2Location).toBe(2);
    expect(li.total).toBe(2.5);

    const emptyCompany = { calcs: [] } as unknown as import("@/lib/types").Company;
    const t = combinedTotals(emptyCompany, items);
    expect(t.total).toBe(2.5);
  });

  it("market-based scope 2 applies the REC/residual-mix adjustment to imported electricity line items, not just manual entry", async () => {
    const { combinedTotals } = await import("@/lib/calc");
    // 10,000 kWh, location-based already computed at 2.09 t (e.g. via CAMX).
    const items = [
      { scope: 2, category: "electricity", co2eKg: 2090, rawValue: 10000, rawUnit: "kWh", status: "mapped" },
    ];
    const company = {
      calcs: [],
      inputs: { has_recs: true, rec_coverage_pct: 50 },
    } as unknown as import("@/lib/types").Company;
    const t = combinedTotals(company, items);
    expect(t.scope2Location).toBe(2.09);
    // residual.WECC.2024 = 0.000428 tCO2e/kWh; 10,000 kWh x 0.000428 x (1 - 50% REC) = 2.14 t.
    // Before the fix, line items always set market-based = location-based (2.09), ignoring RECs entirely.
    expect(t.scope2Market).toBe(2.14);
    expect(t.scope2Market).not.toBe(t.scope2Location);
  });

  it("a market-based override replaces the whole market figure, line items included", async () => {
    const { combinedTotals } = await import("@/lib/calc");
    const items = [
      { scope: 2, category: "electricity", co2eKg: 2090, rawValue: 10000, rawUnit: "kWh", status: "mapped" },
    ];
    const company = {
      calcs: [],
      inputs: { scope2_market_override_tons: 0.5 },
    } as unknown as import("@/lib/types").Company;
    const t = combinedTotals(company, items);
    // Before the fix the override was added to the line items' market figure (0.5 + 2.09).
    expect(t.scope2Market).toBe(0.5);
    expect(t.scope2Location).toBe(2.09);
    expect(t.total).toBe(2.09);
  });
});
