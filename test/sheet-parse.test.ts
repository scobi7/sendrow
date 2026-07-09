import { describe, it, expect } from "vitest";
import { parseSheetMatrix } from "@/lib/ingestion/sheet-parse";

describe("header-row detection (the 'headers in row 3' fix)", () => {
  it("skips a title row and blank row to find the real headers", () => {
    const matrix = [
      ["Fleet Fuel Card — Monthly Statement (raw export from card provider)", "", "", "", ""],
      ["", "", "", "", ""],
      ["Month", "Vehicle ID", "Fuel Type", "Total $ Charged", "Notes"],
      ["Jan", "TRK-01", "Diesel", "612.4", ""],
      ["Jan", "TRK-02", "Diesel", "598.1", ""],
    ];
    const { headers, rows, headerRowIndex } = parseSheetMatrix(matrix);
    expect(headerRowIndex).toBe(2);
    expect(headers).toEqual(["Month", "Vehicle ID", "Fuel Type", "Total $ Charged", "Notes"]);
    expect(rows).toHaveLength(2);
    expect(rows[0]["Total $ Charged"]).toBe("612.4");
  });

  it("plain files with headers in row 1 still work", () => {
    const { headers, rows, headerRowIndex } = parseSheetMatrix([
      ["date", "kwh", "cost"],
      ["2026-01", "1200", "310"],
    ]);
    expect(headerRowIndex).toBe(0);
    expect(headers).toEqual(["date", "kwh", "cost"]);
    expect(rows[0].kwh).toBe("1200");
  });

  it("names blank header cells and skips blank spacer rows", () => {
    const { headers, rows } = parseSheetMatrix([
      ["Month", "", "Amount"],
      ["Jan", "x", "10"],
      ["", "", ""],
      ["Feb", "y", "12"],
    ]);
    expect(headers).toEqual(["Month", "Column 2", "Amount"]);
    expect(rows).toHaveLength(2);
    expect(rows[1]["Column 2"]).toBe("y");
  });
});
