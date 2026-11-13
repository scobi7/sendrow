import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { toSB253, toQuestionnaire, toPACT, toExcel, FORMATS } from "@/lib/formats";
import type { SnapshotForExport } from "@/lib/formats";

const SNAP: SnapshotForExport = {
  id: "snap_x",
  label: "FY2025 footprint",
  createdAt: "2026-07-08T00:00:00Z",
  sha256: "abc123def456",
  itemCount: 2,
  totals: { scope1: 10, scope2Location: 20, scope2Market: 18, scope3: 70, total: 100 },
  lineItems: [
    { sourceRef: "PG&E", scope: 2, category: "electricity", rawValue: "1200", rawUnit: "kWh", co2eKg: "463", period: "2025", factorId: "egrid.USAVG.2024", calcLog: {} },
    { sourceRef: "Speedy Shipping", scope: 3, category: "upstream_freight", rawValue: "5000", rawUnit: "USD", co2eKg: "900", period: "2025", factorId: "useeio.freight.v2", calcLog: {} },
  ],
};
const CO = { name: "Acme Bottling", industry: "Food and Beverage", headcountRange: "50_150" };

describe("reshaping engine (Plan T4): one snapshot, many formats", () => {
  it("SB 253 draft carries totals, factor vintages, and the integrity hash", () => {
    const f = toSB253(SNAP, CO);
    const text = f.content.toString("utf8");
    expect(text).toContain("Acme Bottling");
    expect(text).toContain("100");
    expect(text).toContain("egrid.USAVG.2024, useeio.freight.v2");
    expect(text).toContain("abc123def456");
  });

  it("questionnaire CSV answers the standard buyer questions from the snapshot", () => {
    const csv = toQuestionnaire(SNAP, CO).content.toString("utf8");
    expect(csv).toContain('"Scope 3 emissions (tCO2e)","70"');
    expect(csv).toContain("GHG Protocol");
    expect(csv.split("\n")[0]).toBe("Question,Answer");
  });

  it("PACT JSON is valid and carries the scope breakdown", () => {
    const doc = JSON.parse(toPACT(SNAP, CO).content.toString("utf8"));
    expect(doc.companyName).toBe("Acme Bottling");
    expect(doc.pcf.breakdown.scope2_marketBased_tCO2e).toBe(18);
    expect(doc.pcf.emissionFactorSets).toContain("useeio.freight.v2");
    expect(doc.integrity.sha256).toBe("abc123def456");
  });

  it("Excel export produces a real workbook with both sheets", () => {
    const f = toExcel(SNAP, CO);
    expect(f.content.length).toBeGreaterThan(500);
    expect(f.filename).toBe("acme-bottling-fy2025-footprint.xlsx");
  });

  it("registry exposes all four v1 formats", () => {
    expect(Object.keys(FORMATS).sort()).toEqual(["excel", "pact", "questionnaire", "sb253"]);
  });

  it("Excel Line items sheet shows origin, factor provenance and a summary that ties to the total", () => {
    const snap: SnapshotForExport = {
      ...SNAP,
      itemCount: 2,
      totals: { scope1: 2.5, scope2Location: 0.463, scope2Market: 0.463, scope3: 0.9, total: 3.863 },
      lineItems: [
        {
          origin: "line_item",
          sourceRef: "PG&E",
          scope: 2,
          category: "electricity",
          rawValue: "1200",
          rawUnit: "kWh",
          co2eKg: "463",
          period: "2025",
          factorId: "egrid.USAVG.2024",
          locationId: "loc_1",
          locationName: "Fresno plant",
          factorSource: "EPA eGRID",
          factorSourceUrl: "https://www.epa.gov/egrid",
          evidenceFilename: "pge-2025.csv",
          calcLog: {
            raw_value: 1200,
            raw_unit: "kWh",
            factor_id: "egrid.USAVG.2024",
            factor_name: "eGRID US average",
            factor_value: 0.3858,
            factor_unit: "kg/kWh",
            factor_vintage: 2024,
            formula: "1200 kWh x 0.3858 kg/kWh x 1000 kg/t",
            co2e_kg: 463,
            computed_at: "2026-07-08T00:00:00Z",
          },
        },
        {
          origin: "manual",
          sourceRef: "Manual entry",
          scope: 1,
          category: "Fleet fuel - diesel",
          rawValue: "",
          rawUnit: "",
          co2eKg: "2500",
          period: null,
          factorId: "epa.diesel",
          locationId: null,
          locationName: null,
          factorSource: "EPA",
          factorSourceUrl: "",
          evidenceFilename: null,
          calcLog: { formula: "100 gal x 0.0100 t/gal", basis: "measured", marketBasedTons: null },
        },
      ],
    };
    const wb = XLSX.read(toExcel(snap, CO).content, { type: "buffer" });
    const lines = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["Line items"], { header: 1 });
    const headers = lines[0] as string[];
    expect(headers.slice(0, 3)).toEqual(["Origin", "Source / vendor", "Scope"]);
    expect(headers).toEqual(expect.arrayContaining(["Factor name", "Factor value", "Factor year", "Factor source", "Method / formula", "Evidence file"]));
    const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets["Line items"]);
    expect(records[0]["Origin"]).toBe("Imported");
    expect(records[0]["Factor name"]).toBe("eGRID US average");
    expect(records[0]["Evidence file"]).toBe("pge-2025.csv");
    expect(records[1]["Origin"]).toBe("Manual entry");
    expect(records[1]["Method / formula"]).toBe("measured: 100 gal x 0.0100 t/gal");
    expect(records[1]["Quantity"]).toBe("");

    const summary = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets["Summary"]);
    const kgSum = 463 + 2500;
    const row = summary.find((r) => r["Figure"] === "Line items sum (location-based)");
    expect(row?.["t CO2e"]).toBe(Math.round((kgSum / 1000) * 100) / 100);
  });
});
