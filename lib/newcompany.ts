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
    setupComplete: false,
    createdAt: new Date().toISOString(),
    connections: {
      quickbooks: { connected: false, lastSynced: null },
      utility: { connected: false, lastSynced: null },
    },
    qbTransactions: [],
    utilityData: [],
    inputs: {},
    calcs: [],
    sectionStatus: {
      connections: "not_started",
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
