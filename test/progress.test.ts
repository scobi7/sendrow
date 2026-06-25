import { describe, it, expect } from "vitest";
import { evaluateSections, progressPercent, canGenerateReport } from "@/lib/progress";
import { createCompanyRecord } from "@/lib/newcompany";
import { generateQBTransactions, generateUtilityData } from "@/lib/mockdata";
import { recalcCompany } from "@/lib/calc";

function baseCompany() {
  const c = createCompanyRecord("Test Co");
  c.fiscalYearEndMonth = 12;
  c.headcountRange = "50_150";
  c.locations = [{ id: "loc_1", address: "", city: "LA", state: "CA", zip: "90001", egridSubregion: "egrid.CAMX.2024" }];
  return c;
}

describe("evaluateSections", () => {
  it("all sections start as not_started", () => {
    const c = baseCompany();
    const s = evaluateSections(c);
    for (const status of Object.values(s)) {
      expect(status).toBe("not_started");
    }
  });

  it("connections becomes complete when both QB and utility connected", () => {
    const c = baseCompany();
    c.connections.quickbooks = { connected: true, lastSynced: new Date().toISOString() };
    c.connections.utility = { connected: true, lastSynced: new Date().toISOString() };
    const s = evaluateSections(c);
    expect(s.connections).toBe("complete");
  });

  it("connections is in_progress when only one is connected", () => {
    const c = baseCompany();
    c.connections.quickbooks = { connected: true, lastSynced: new Date().toISOString() };
    const s = evaluateSections(c);
    expect(s.connections).toBe("in_progress");
  });

  it("scope1 is complete when all subsections answered or NA", () => {
    const c = baseCompany();
    c.inputs = { fleet_na: true, natgas_na: true, refrigerant_na: true, equipment_na: true };
    const s = evaluateSections(c);
    expect(s.scope1).toBe("complete");
  });

  it("scope2 requires utility connected AND reviewed", () => {
    const c = baseCompany();
    c.connections.utility = { connected: true, lastSynced: new Date().toISOString() };
    c.utilityData = generateUtilityData(c);
    recalcCompany(c);
    let s = evaluateSections(c);
    expect(s.scope2).toBe("in_progress"); // connected but not reviewed

    c.inputs.scope2_reviewed = true;
    s = evaluateSections(c);
    expect(s.scope2).toBe("complete");
  });

  it("reports is complete only after reportGeneratedAt is set", () => {
    const c = baseCompany();
    expect(evaluateSections(c).reports).toBe("not_started");
    c.reportGeneratedAt = new Date().toISOString();
    expect(evaluateSections(c).reports).toBe("complete");
  });
});

describe("progressPercent", () => {
  it("returns 0 when nothing is complete", () => {
    const c = baseCompany();
    c.sectionStatus = evaluateSections(c);
    expect(progressPercent(c)).toBe(0);
  });

  it("returns 100 when all 7 sections are complete", () => {
    const c = baseCompany();
    const sections = ["connections", "scope1", "scope2", "scope3", "social", "governance", "reports"] as const;
    for (const s of sections) c.sectionStatus[s] = "complete";
    expect(progressPercent(c)).toBe(100);
  });

  it("scales linearly with complete count", () => {
    const c = baseCompany();
    c.sectionStatus = evaluateSections(c);
    c.sectionStatus.connections = "complete";
    c.sectionStatus.scope1 = "complete";
    // 2 of 7 complete ≈ 28%
    expect(progressPercent(c)).toBe(Math.round(2 / 7 * 100));
  });
});

describe("canGenerateReport", () => {
  it("returns false when connections not complete", () => {
    const c = baseCompany();
    c.sectionStatus = evaluateSections(c);
    expect(canGenerateReport(c)).toBe(false);
  });

  it("returns true when connections + scope1 + scope2 all complete", () => {
    const c = baseCompany();
    c.sectionStatus.connections = "complete";
    c.sectionStatus.scope1 = "complete";
    c.sectionStatus.scope2 = "complete";
    expect(canGenerateReport(c)).toBe(true);
  });

  it("returns false when only connections and scope1 complete (scope2 missing)", () => {
    const c = baseCompany();
    c.sectionStatus.connections = "complete";
    c.sectionStatus.scope1 = "complete";
    expect(canGenerateReport(c)).toBe(false);
  });
});
