import { Company } from "./types";
import { totals } from "./calc";
import { headcountMidpoint } from "./calc";

/**
 * Questionnaire Helper - display mapping only (no CDP/EcoVadis API in v1).
 * Maps each questionnaire's question IDs to internal data fields.
 */

export interface MappingRow {
  questionId: string;
  question: string;
  yourValue: string;
  note?: string;
}

const t = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} tCO2e`;

export function questionnaireMapping(company: Company, format: string): MappingRow[] {
  const tot = totals(company);
  const inp = company.inputs;
  const employees = headcountMidpoint(company);
  const turnover =
    inp.social_departures != null && inp.social_total_employees
      ? `${Math.round((inp.social_departures / inp.social_total_employees) * 1000) / 10}%`
      : " - ";
  const policies = inp.gov_policies ?? {};
  const policyYes = Object.entries(policies).filter(([, v]) => v).map(([k]) => k);

  if (format === "CDP Supply Chain") {
    return [
      { questionId: "C6.1", question: "Gross global Scope 1 emissions (metric tons CO2e)", yourValue: t(tot.scope1) },
      { questionId: "C6.3", question: "Gross global Scope 2 emissions - location-based", yourValue: t(tot.scope2Location) },
      { questionId: "C6.3", question: "Gross global Scope 2 emissions - market-based", yourValue: t(tot.scope2Market) },
      { questionId: "C6.5", question: "Scope 3 emissions by category", yourValue: t(tot.scope3), note: "Per-category breakdown in your GHG Inventory Report" },
      { questionId: "C0.2", question: "Reporting period", yourValue: fiscalPeriodLabel(company) },
      { questionId: "C5.2", question: "Methodology / standard used", yourValue: "GHG Protocol Corporate Standard; spend-based Scope 3 (USEEIO)" },
      { questionId: "C8.2", question: "Renewable electricity purchased (RECs)", yourValue: inp.has_recs ? `Yes - covers ${inp.rec_coverage_pct ?? 0}% of consumption` : "No" },
    ];
  }
  if (format === "EcoVadis") {
    return [
      { questionId: "ENV-1", question: "Total GHG emissions (Scopes 1+2)", yourValue: t(tot.scope1 + tot.scope2Location) },
      { questionId: "ENV-2", question: "Scope 3 emissions reported?", yourValue: tot.scope3 > 0 ? `Yes - ${t(tot.scope3)}` : "No" },
      { questionId: "ENV-5", question: "Environmental policy in place?", yourValue: policies["Environmental policy"] ? "Yes - upload your policy document" : "No" },
      { questionId: "LAB-1", question: "Total employees", yourValue: String(inp.social_total_employees ?? employees) },
      { questionId: "LAB-3", question: "Annual turnover rate", yourValue: turnover },
      { questionId: "LAB-7", question: "Lost time injury count", yourValue: String(inp.social_lost_time_injuries ?? " - ") },
      { questionId: "LAB-9", question: "Training hours per year", yourValue: String(inp.social_training_hours ?? " - ") },
      { questionId: "ETH-1", question: "Ethics policies in place", yourValue: policyYes.length ? policyYes.join(", ") : "None recorded" },
      { questionId: "ETH-4", question: "Data breaches in past year?", yourValue: inp.gov_data_breaches == null ? " - " : inp.gov_data_breaches ? "Yes" : "No" },
    ];
  }
  if (format === "Walmart Supplier Sustainability") {
    return [
      { questionId: "W-1", question: "Do you measure your GHG footprint?", yourValue: "Yes - full Scope 1, 2, 3 inventory" },
      { questionId: "W-2", question: "Total annual emissions (all scopes)", yourValue: t(tot.total) },
      { questionId: "W-3", question: "Scope 1 + 2 emissions", yourValue: t(tot.scope1 + tot.scope2Location) },
      { questionId: "W-4", question: "Have you set an emissions reduction target?", yourValue: "Baseline established this year - target setting is the recommended next step" },
      { questionId: "W-5", question: "Renewable energy share", yourValue: inp.has_recs ? `${inp.rec_coverage_pct ?? 0}% via RECs` : "0%" },
    ];
  }
  // Generic
  return [
    { questionId: "G-1", question: "Scope 1 emissions", yourValue: t(tot.scope1) },
    { questionId: "G-2", question: "Scope 2 emissions (location-based)", yourValue: t(tot.scope2Location) },
    { questionId: "G-3", question: "Scope 2 emissions (market-based)", yourValue: t(tot.scope2Market) },
    { questionId: "G-4", question: "Scope 3 emissions", yourValue: t(tot.scope3) },
    { questionId: "G-5", question: "Total emissions", yourValue: t(tot.total) },
    { questionId: "G-6", question: "Reporting period", yourValue: fiscalPeriodLabel(company) },
    { questionId: "G-7", question: "Employees", yourValue: String(inp.social_total_employees ?? employees) },
  ];
}

export function fiscalPeriodLabel(company: Company): string {
  const end = company.fiscalYearEndMonth ?? 12;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const now = new Date();
  let endYear = now.getFullYear();
  if (end >= now.getMonth() + 1) endYear -= 1;
  const startMonth = end === 12 ? 1 : end + 1;
  const startYear = end === 12 ? endYear : endYear - 1;
  return `${months[startMonth - 1]} ${startYear} – ${months[end - 1]} ${endYear}`;
}

export const QUESTIONNAIRE_FORMATS = [
  "CDP Supply Chain",
  "EcoVadis",
  "Walmart Supplier Sustainability",
  "Generic",
];
