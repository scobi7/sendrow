import { describe, it, expect } from "vitest";
import { evaluateSections, progressPercent, canGenerateReport } from "@/lib/progress";
import { createCompanyRecord } from "@/lib/newcompany";

const SECTION_COUNT = 6; // scope1, scope2, scope3, social, governance, reports

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
    expect(Object.keys(s).sort()).toEqual(["governance", "reports", "scope1", "scope2", "scope3", "social"]);
    for (const status of Object.values(s)) {
      expect(status).toBe("not_started");
    }
  });

  it("scope1 is complete when all subsections answered or NA", () => {
    const c = baseCompany();
    c.inputs = { fleet_na: true, natgas_na: true, refrigerant_na: true, equipment_na: true };
    const s = evaluateSections(c);
    expect(s.scope1).toBe("complete");
  });

  it("scope1 natural gas is answered by a manual therms override", () => {
    const c = baseCompany();
    c.inputs = { fleet_na: true, natgas_therms_override: 800, refrigerant_na: true, equipment_na: true };
    expect(evaluateSections(c).scope1).toBe("complete");
  });

  it("scope2 is in_progress with RECs noted but not reviewed, complete once reviewed", () => {
    const c = baseCompany();
    c.inputs.has_recs = true;
    let s = evaluateSections(c);
    expect(s.scope2).toBe("in_progress");

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

  it("returns 100 when all sections are complete", () => {
    const c = baseCompany();
    const sections = ["scope1", "scope2", "scope3", "social", "governance", "reports"] as const;
    for (const s of sections) c.sectionStatus[s] = "complete";
    expect(progressPercent(c)).toBe(100);
    expect(sections).toHaveLength(SECTION_COUNT);
  });

  it("scales linearly with complete count", () => {
    const c = baseCompany();
    c.sectionStatus = evaluateSections(c);
    c.sectionStatus.scope1 = "complete";
    c.sectionStatus.scope2 = "complete";
    expect(progressPercent(c)).toBe(Math.round(2 / SECTION_COUNT * 100));
  });
});

describe("canGenerateReport", () => {
  it("returns false when nothing is complete", () => {
    const c = baseCompany();
    c.sectionStatus = evaluateSections(c);
    expect(canGenerateReport(c)).toBe(false);
  });

  it("returns true when scope1 + scope2 are complete", () => {
    const c = baseCompany();
    c.sectionStatus.scope1 = "complete";
    c.sectionStatus.scope2 = "complete";
    expect(canGenerateReport(c)).toBe(true);
  });

  it("returns false when only scope1 is complete (scope2 missing)", () => {
    const c = baseCompany();
    c.sectionStatus.scope1 = "complete";
    expect(canGenerateReport(c)).toBe(false);
  });
});
