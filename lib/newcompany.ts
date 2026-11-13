import { Company } from "./types";
import { uid } from "./store";

/** Fresh company record with empty defaults. */
export function createCompanyRecord(name: string): Company {
  return {
    id: uid("co_"),
    name,
    industry: null,
    headcountRange: null,
    locations: [],
    fiscalYearEndMonth: null,
    reportingFramework: null,
    setupComplete: false,
    createdAt: new Date().toISOString(),
    inputs: {},
    calcs: [],
    sectionStatus: {
      scope1: "not_started",
      scope2: "not_started",
      scope3: "not_started",
      social: "not_started",
      governance: "not_started",
      reports: "not_started",
    },
    reportGeneratedAt: null,
    actionPlan: null,
  };
}
