import { describe, it, expect } from "vitest";
import { fuzzyMatchHeaders } from "@/lib/ingestion/fuzzy-match";
import { applyProfile, rowToLineItem, fleetFuelToLineItems } from "@/lib/ingestion/ingest";
import type { ColumnMap, NormalizedRow, UnmappedLog } from "@/lib/ingestion/ingest";
import type { CalcLog } from "@/lib/factor-engine";
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
  const columnMap: ColumnMap = { "Bill Date": "date", "kWh Used": "quantity", "Source": "source_ref" };
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

  it("flags a row with missing quantity as unmapped — never drops it", () => {
    const row = { unit: "gallon", activity_type: "diesel" };
    const item = rowToLineItem(row, SEED_FACTORS, "co_test");
    expect(item.status).toBe("unmapped");
    expect(item.co2eKg).toBe("0.0000");
    expect(item.factorId).toBeNull();
    expect((item.calcLog as UnmappedLog).reason).toContain("quantity");
  });

  it("flags a row with no matching factor as unmapped — never drops it", () => {
    const row = { quantity: 42, unit: "widgets", activity_type: "mystery process" };
    const item = rowToLineItem(row, SEED_FACTORS, "co_test");
    expect(item.status).toBe("unmapped");
    expect(item.co2eKg).toBe("0.0000");
    expect((item.calcLog as UnmappedLog).reason).toContain("mystery process");
  });

  it("calc_log is self-contained with all required fields, including vintage", () => {
    const row = { quantity: 500, unit: "gallon", activity_type: "gasoline" };
    const item = rowToLineItem(row, SEED_FACTORS, "co_test");
    expect(item.status).toBe("mapped");
    const log = item.calcLog as CalcLog;
    expect(log.raw_value).toBe(500);
    expect(log.factor_id).toBeTruthy();
    expect(log.factor_vintage).toBeGreaterThan(2020);
    expect(log.formula).toContain("500");
    expect(log.computed_at).toBeTruthy();
  });
});

describe("no silent drops (contracts/ invariant)", () => {
  it("a deliberately messy file produces exactly one line item per row", () => {
    const rows: NormalizedRow[] = [
      { quantity: 100, unit: "gallon", activity_type: "diesel" },        // mappable
      { unit: "gallon", activity_type: "diesel" },                       // missing quantity
      { quantity: 7, unit: "flopnards", activity_type: "quantum foam" }, // unknown everything
      { quantity: 300, unit: "kWh", activity_type: "electricity" },      // mappable
      { quantity: 12, unit: "", activity_type: "" },                     // no unit or activity
    ];
    const items = rows.map((r) => rowToLineItem(r, SEED_FACTORS, "co_test"));
    expect(items.length).toBe(rows.length);
    const mapped = items.filter((i) => i.status === "mapped");
    const unmapped = items.filter((i) => i.status === "unmapped");
    expect(mapped.length).toBe(2);
    expect(unmapped.length).toBe(3);
    for (const item of unmapped) {
      expect(Number(item.co2eKg)).toBe(0);
      expect((item.calcLog as UnmappedLog).reason).toBeTruthy();
    }
  });

  it("fleet fuel $ rows that cannot be processed are flagged, not skipped", () => {
    const rows: NormalizedRow[] = [
      { quantity: 400, activity_type: "diesel" },       // mappable
      { activity_type: "diesel" },                      // missing dollar amount
      { quantity: 250, activity_type: "jet fuel" },     // unrecognized fuel type
      { quantity: 90, activity_type: "propane" },       // no propane price → falls back to gasoline price
    ];
    const items = fleetFuelToLineItems(rows, SEED_FACTORS, { diesel: 4.0, gasoline: 3.5 }, "co_test");
    expect(items.length).toBe(rows.length);
    expect(items.filter((i) => i.status === "unmapped").length).toBe(2);
    expect(items.filter((i) => i.status === "mapped").length).toBe(2);
  });

  it("spreadsheet electricity rows use the national average factor (no location context)", () => {
    const row = { quantity: 1000, unit: "kWh", activity_type: "electricity" };
    const item = rowToLineItem(row, SEED_FACTORS, "co_test");
    expect(item.factorId).toBe("egrid.USAVG.2024");
  });
});
