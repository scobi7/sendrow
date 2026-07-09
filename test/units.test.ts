import { describe, it, expect } from "vitest";
import { normalizeQuantity } from "@/lib/ingestion/units";
import { rowToLineItem } from "@/lib/ingestion/ingest";
import { SEED_FACTORS } from "@/lib/factors";

describe("unit normalization (Plan T2)", () => {
  it("converts MWh to kWh, ccf to therms, litres to gallons, km to miles", () => {
    expect(normalizeQuantity(1.5, "MWh")).toMatchObject({ quantity: 1500, unit: "kWh", converted: true });
    expect(normalizeQuantity(100, "ccf").quantity).toBeCloseTo(103.7, 2);
    expect(normalizeQuantity(10, "litres").quantity).toBeCloseTo(2.64172, 4);
    expect(normalizeQuantity(100, "km").quantity).toBeCloseTo(62.1371, 3);
    expect(normalizeQuantity(2, "tonnes").quantity).toBeCloseTo(2.20462, 4);
  });

  it("canonical units and unknown units pass through untouched", () => {
    expect(normalizeQuantity(500, "kWh")).toMatchObject({ quantity: 500, converted: false });
    expect(normalizeQuantity(3, "widgets")).toMatchObject({ quantity: 3, unit: "widgets", converted: false });
    expect(normalizeQuantity(50, undefined).converted).toBe(false);
  });

  it("a MWh row now maps instead of false-flagging, with the conversion logged", () => {
    const row = { quantity: 2, unit: "MWh", activity_type: "electricity", source_ref: "acct 1" };
    const item = rowToLineItem(row, SEED_FACTORS, "co_t", null, []);
    expect(item.status).toBe("mapped");
    expect(item.rawUnit).toBe("kWh");
    expect(Number(item.rawValue)).toBe(2000);
    expect((item.calcLog as { unit_conversion?: string }).unit_conversion).toContain("MWh");
  });

  it("dollars still never convert to physical units", () => {
    const row = { quantity: 500, unit: "USD", activity_type: "diesel", source_ref: "fuel co" };
    const item = rowToLineItem(row, SEED_FACTORS, "co_t", null, []);
    expect(item.status).toBe("unmapped");
  });
});
