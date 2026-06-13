import { Company, SectionName, SectionStatus } from "./types";
import { SCOPE3_OTHER_CATEGORIES } from "./factors";

const answered = (v: unknown) => v !== undefined && v !== null && v !== "";

export function evaluateSections(company: Company): Record<SectionName, SectionStatus> {
  const inp = company.inputs;
  const conn = company.connections;

  const status = (done: boolean, touched: boolean): SectionStatus =>
    done ? "complete" : touched ? "in_progress" : "not_started";

  const connDone = conn.quickbooks.connected && conn.utility.connected;
  const connTouched = conn.quickbooks.connected || conn.utility.connected;

  const fleetDone = !!inp.fleet_na || [inp.fleet_gasoline_gal, inp.fleet_diesel_gal, inp.fleet_propane_gal].some(answered);
  const gasDone = !!inp.natgas_na || answered(inp.natgas_therms_override) || (conn.utility.connected && company.utilityData.some((m) => m.therms > 0));
  const refDone = !!inp.refrigerant_na || (answered(inp.refrigerant_kg) && answered(inp.refrigerant_type));
  const eqDone = !!inp.equipment_na || (answered(inp.equipment_gal) && answered(inp.equipment_fuel_type));
  const s1Done = fleetDone && gasDone && refDone && eqDone;
  const s1Touched = [fleetDone, gasDone, refDone, eqDone].some(Boolean) ||
    [inp.fleet_gasoline_gal, inp.refrigerant_kg, inp.equipment_gal].some(answered);

  const s2Done = conn.utility.connected && !!inp.scope2_reviewed;
  const s2Touched = conn.utility.connected || !!inp.has_recs;

  const commuteDone = answered(inp.commute_avg_miles) && answered(inp.commute_mode) && answered(inp.commute_days_in_office);
  const wasteDone = [inp.waste_landfill_tons, inp.waste_recycled_tons, inp.waste_composted_tons].some(answered);
  const othersDone = SCOPE3_OTHER_CATEGORIES.every((c) => (inp.scope3_other_categories ?? {})[c]);
  const s3Done = !!inp.qb_data_reviewed && commuteDone && wasteDone && othersDone;
  const s3Touched = !!inp.qb_data_reviewed || commuteDone || wasteDone || Object.keys(inp.scope3_other_categories ?? {}).length > 0;

  const socialDone = [inp.social_total_employees, inp.social_new_hires, inp.social_departures,
    inp.social_lost_time_injuries, inp.social_osha_recordables, inp.social_training_hours].every(answered);
  const socialTouched = [inp.social_total_employees, inp.social_lost_time_injuries, inp.social_training_hours].some(answered);

  const policies = inp.gov_policies ?? {};
  const policiesDone = Object.values(policies).filter((v) => v !== null && v !== undefined).length >= 6;
  const privacyDone = [inp.gov_ccpa_compliant, inp.gov_public_privacy_policy, inp.gov_data_breaches].every((v) => v !== undefined && v !== null);
  const leadershipNeeded = company.headcountRange !== "under_50";
  const leadershipDone = !leadershipNeeded || Object.keys(inp.gov_leadership ?? {}).length > 0;
  const govDone = policiesDone && privacyDone && leadershipDone;
  const govTouched = Object.keys(policies).length > 0 || answered(inp.gov_ccpa_compliant) || Object.keys(inp.gov_leadership ?? {}).length > 0;

  const reportsDone = !!company.reportGeneratedAt;

  return {
    connections: status(connDone, connTouched),
    scope1: status(s1Done, s1Touched),
    scope2: status(s2Done, s2Touched),
    scope3: status(s3Done, s3Touched),
    social: status(socialDone, socialTouched),
    governance: status(govDone, govTouched),
    reports: status(reportsDone, false),
  };
}

export function refreshSectionStatus(company: Company) {
  company.sectionStatus = evaluateSections(company);
}

export function progressPercent(company: Company): number {
  const vals = Object.values(company.sectionStatus);
  return Math.round((vals.filter((v) => v === "complete").length / vals.length) * 100);
}

export function canGenerateReport(company: Company): boolean {
  const s = company.sectionStatus;
  return s.connections === "complete" && s.scope1 === "complete" && s.scope2 === "complete";
}

export interface Gap {
  missing: string;
  why: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export function gapAnalysis(company: Company): Gap[] {
  const inp = company.inputs;
  const gaps: Gap[] = [];
  const s = company.sectionStatus;
  if (s.scope3 !== "complete")
    gaps.push({ missing: "Complete Scope 3 categories", why: "Scope 3 is usually the largest share of footprint; CDP scores completeness", difficulty: "Medium" });
  if (!inp.has_recs)
    gaps.push({ missing: "Renewable energy credits / green tariff documentation", why: "Could significantly reduce market-based Scope 2", difficulty: "Easy" });
  if (!inp.social_demographics_uploaded)
    gaps.push({ missing: "Workforce demographics upload", why: "Required for EcoVadis Labor & Human Rights scoring", difficulty: "Easy" });
  const policies = inp.gov_policies ?? {};
  const missingPolicies = ["Code of conduct", "Whistleblower policy", "Anti-bribery policy", "Data privacy policy", "Environmental policy", "Equal opportunity policy"].filter((p) => !policies[p]);
  for (const p of missingPolicies)
    gaps.push({ missing: `${p}`, why: "Missing policies directly lower your EcoVadis score", difficulty: "Easy" });
  if (Object.values(inp.scope3_other_categories ?? {}).includes("industry_average"))
    gaps.push({ missing: "Replace industry-average estimates with measured data", why: "Low-confidence estimates are flagged in your audit trail and capped in CDP scoring", difficulty: "Hard" });
  if (!inp.social_demographics_uploaded && company.headcountRange !== "under_50")
    gaps.push({ missing: "Leadership diversity detail by role level", why: "Standard governance disclosure for companies over 50 employees", difficulty: "Medium" });
  return gaps;
}
