import { describe, it, expect } from "vitest";
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
});
