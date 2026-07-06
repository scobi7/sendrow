import { describe, it, expect } from "vitest";
import { fuzzyMatchHeaders } from "@/lib/ingestion/fuzzy-match";
import { applyProfile, rowToLineItem } from "@/lib/ingestion/ingest";
import { SEED_FACTORS } from "@/lib/factors";

describe("fuzzyMatchHeaders", () => {
  it("matches 'kWh' to quantity with high confidence", () => {
    const [result] = fuzzyMatchHeaders(["kWh"]);
    expect(result.field).toBe("quantity");
    expect(result.confidence).toBe("high");
  });

  it("is case-insensitive ('DATE' → date)", () => {
    const [result] = fuzzyMatchHeaders(["DATE"]);
    expect(result.field).toBe("date");
    expect(result.confidence).toBe("high");
  });

  it("matches 'Fuel Type' to activity_type", () => {
    const [result] = fuzzyMatchHeaders(["Fuel Type"]);
    expect(result.field).toBe("activity_type");
  });

  it("matches 'Invoice #' to source_ref", () => {
    const [result] = fuzzyMatchHeaders(["Invoice #"]);
    expect(result.field).toBe("source_ref");
  });

  it("returns null field for unrecognized header", () => {
    const [result] = fuzzyMatchHeaders(["junk_col_xyz_abc"]);
    expect(result.field).toBeNull();
  });

  it("handles multiple headers independently", () => {
    const results = fuzzyMatchHeaders(["Date", "kWh", "Notes"]);
    expect(results[0].field).toBe("date");
    expect(results[1].field).toBe("quantity");
    expect(results[2].field).toBe("notes");
  });
});

describe("applyProfile", () => {
  const columnMap = { "Bill Date": "date", "kWh Used": "quantity", "Source": "source_ref" };
  const rows = [{ "Bill Date": "2024-01", "kWh Used": "1500", "Source": "INV-001", "Ignored Col": "x" }];

  it("maps columns to standard fields", () => {
    const [norm] = applyProfile(rows, columnMap);
    expect(norm.date).toBe("2024-01");
    expect(norm.quantity).toBe(1500);
    expect(norm.source_ref).toBe("INV-001");
  });

  it("ignores columns not in the column map", () => {
    const [norm] = applyProfile(rows, columnMap);
    expect((norm as Record<string, unknown>)["Ignored Col"]).toBeUndefined();
  });

  it("skips quantity when value is not a number", () => {
    const badRows = [{ "kWh Used": "n/a" }];
    const [norm] = applyProfile(badRows, { "kWh Used": "quantity" });
    expect(norm.quantity).toBeUndefined();
  });
});

describe("rowToLineItem", () => {
  it("produces a valid line item for a gasoline row", () => {
    const row = { quantity: 1000, unit: "gallon", activity_type: "gasoline" };
    const item = rowToLineItem(row, SEED_FACTORS, "co_test");
    expect(item).not.toBeNull();
    expect(item!.scope).toBe(1);
    expect(Number(item!.co2eKg)).toBeCloseTo(8887, 0);
    expect(item!.factorId).toBe("fuel.gasoline.2025");
  });

  it("produces a valid line item for an electricity row", () => {
    const row = { quantity: 2000, unit: "kWh", activity_type: "electricity" };
    const item = rowToLineItem(row, SEED_FACTORS, "co_test");
    expect(item).not.toBeNull();
    expect(item!.scope).toBe(2);
    expect(Number(item!.co2eKg)).toBeGreaterThan(0);
  });

  it("returns null when quantity is missing", () => {
    const row = { unit: "gallon", activity_type: "diesel" };
    const item = rowToLineItem(row, SEED_FACTORS, "co_test");
    expect(item).toBeNull();
  });

  it("calc_log is self-contained with all required fields", () => {
    const row = { quantity: 500, unit: "gallon", activity_type: "gasoline" };
    const item = rowToLineItem(row, SEED_FACTORS, "co_test");
    const log = item!.calcLog;
    expect(log.raw_value).toBe(500);
    expect(log.factor_id).toBeTruthy();
    expect(log.factor_vintage).toBeGreaterThan(2020);
    expect(log.formula).toContain("500");
    expect(log.computed_at).toBeTruthy();
  });
});
