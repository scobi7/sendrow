"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createCompanyRecord } from "./newcompany";
import { getUserCompany, getCompany, saveCompany, uid } from "./store";
import { Company, HeadcountRange, Industry, User } from "./types";
import { egridForState } from "./factors";
import { generateQBTransactions, generateUtilityData } from "./mockdata";
import { recalcCompany } from "./calc";
import { refreshSectionStatus } from "./progress";
import { logChange } from "./audit";
import { checkRateLimit } from "./ratelimit";

async function requireUser(): Promise<{ user: User; company: Company }> {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const user = await getUserCompany(userId!);
  if (!user) redirect("/setup"); // new Clerk user, no company yet
  const company = await getCompany(user.companyId);
  return { user, company };
}

async function persist(company: Company) {
  recalcCompany(company);
  refreshSectionStatus(company);
  await saveCompany(company);
  revalidatePath("/", "layout");
}

// ─────────── Setup wizard ───────────

export async function saveSetup(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const user = await getUserCompany(userId!);
  if (!user) redirect("/setup");
  const company = await getCompany(user.companyId);

  const companyName = String(formData.get("company_name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "") as Industry;
  const headcount = String(formData.get("headcount") ?? "") as HeadcountRange;
  const fyEnd = Number(formData.get("fiscal_year_end"));
  const locCount = Number(formData.get("location_count"));

  if (companyName) {
    await logChange({ user, companyId: company.id, section: "setup", field: "company_name", prev: company.name, next: companyName });
    company.name = companyName;
  }
  await logChange({ user, companyId: company.id, section: "setup", field: "industry", prev: company.industry, next: industry });
  await logChange({ user, companyId: company.id, section: "setup", field: "headcount_range", prev: company.headcountRange, next: headcount });
  await logChange({ user, companyId: company.id, section: "setup", field: "fiscal_year_end", prev: company.fiscalYearEndMonth, next: fyEnd });

  company.industry = industry;
  company.headcountRange = headcount;
  company.fiscalYearEndMonth = fyEnd;
  company.locations = [];
  for (let i = 0; i < locCount; i++) {
    const address = String(formData.get(`loc_${i}_address`) ?? "").trim();
    const city = String(formData.get(`loc_${i}_city`) ?? "").trim();
    const state = String(formData.get(`loc_${i}_state`) ?? "CA").trim();
    const zip = String(formData.get(`loc_${i}_zip`) ?? "").trim();
    company.locations.push({ id: uid("loc_"), address, city, state, zip, egridSubregion: egridForState(state) });
    await logChange({ user, companyId: company.id, section: "setup", field: `location_${i + 1}`, prev: null, next: `${address}, ${city}, ${state} ${zip}` });
  }
  company.setupComplete = true;
  await persist(company);
}

// ─────────── Connections (simulated OAuth) ───────────

export async function connectQuickBooks() {
  const { user, company } = await requireUser();
  company.connections.quickbooks = { connected: true, lastSynced: new Date().toISOString() };
  company.qbTransactions = generateQBTransactions(company);
  await logChange({ user, companyId: company.id, section: "connections", field: "quickbooks", prev: "disconnected", next: `connected — ${company.qbTransactions.length} transactions pulled (demo data)` });
  await persist(company);
}

export async function connectUtility() {
  const { user, company } = await requireUser();
  company.connections.utility = { connected: true, lastSynced: new Date().toISOString() };
  company.utilityData = generateUtilityData(company);
  await logChange({ user, companyId: company.id, section: "connections", field: "utility", prev: "disconnected", next: `connected — ${company.utilityData.length} meter-months pulled (demo data)` });
  await persist(company);
}

export async function resync(which: "quickbooks" | "utility") {
  const { user, company } = await requireUser();
  if (which === "quickbooks") {
    company.qbTransactions = generateQBTransactions(company);
    company.connections.quickbooks.lastSynced = new Date().toISOString();
  } else {
    company.utilityData = generateUtilityData(company);
    company.connections.utility.lastSynced = new Date().toISOString();
  }
  await logChange({ user, companyId: company.id, section: "connections", field: which, prev: "synced", next: `resynced ${new Date().toISOString()}` });
  await persist(company);
}

// ─────────── Generic field saver ───────────

const FIELD_SECTIONS: Record<string, string> = {
  fleet_gasoline_gal: "scope1", fleet_diesel_gal: "scope1", fleet_propane_gal: "scope1", fleet_na: "scope1",
  natgas_therms_override: "scope1", natgas_na: "scope1",
  refrigerant_type: "scope1", refrigerant_kg: "scope1", refrigerant_na: "scope1",
  equipment_fuel_type: "scope1", equipment_gal: "scope1", equipment_na: "scope1",
  scope2_reviewed: "scope2", has_recs: "scope2", rec_coverage_pct: "scope2", rec_certificate_name: "scope2",
  qb_data_reviewed: "scope3", commute_avg_miles: "scope3", commute_mode: "scope3", commute_days_in_office: "scope3",
  waste_landfill_tons: "scope3", waste_recycled_tons: "scope3", waste_composted_tons: "scope3",
  social_total_employees: "social", social_new_hires: "social", social_departures: "social",
  social_lost_time_injuries: "social", social_osha_recordables: "social", social_near_misses: "social",
  social_days_lost: "social", social_training_hours: "social", social_demographics_uploaded: "social",
  gov_ccpa_compliant: "governance", gov_public_privacy_policy: "governance", gov_data_breaches: "governance",
};

const NUMBER_FIELDS = new Set([
  "fleet_gasoline_gal", "fleet_diesel_gal", "fleet_propane_gal", "natgas_therms_override",
  "refrigerant_kg", "equipment_gal", "rec_coverage_pct", "commute_avg_miles", "commute_days_in_office",
  "waste_landfill_tons", "waste_recycled_tons", "waste_composted_tons",
  "social_total_employees", "social_new_hires", "social_departures", "social_lost_time_injuries",
  "social_osha_recordables", "social_near_misses", "social_days_lost", "social_training_hours",
]);

const BOOL_FIELDS = new Set([
  "fleet_na", "natgas_na", "refrigerant_na", "equipment_na", "scope2_reviewed", "has_recs",
  "qb_data_reviewed", "social_demographics_uploaded",
  "gov_ccpa_compliant", "gov_public_privacy_policy", "gov_data_breaches",
]);

export async function saveFields(formData: FormData) {
  const { user, company } = await requireUser();
  const inputs = company.inputs as Record<string, unknown>;
  for (const [key, raw] of formData.entries()) {
    if (key.startsWith("$") || key === "redirect_to") continue;
    if (!(key in FIELD_SECTIONS)) continue;
    const section = FIELD_SECTIONS[key];
    let value: unknown = String(raw);
    if (NUMBER_FIELDS.has(key)) value = raw === "" ? null : Number(raw);
    if (BOOL_FIELDS.has(key)) value = raw === "true" || raw === "on" || raw === "yes" ? true : raw === "false" || raw === "no" ? false : null;
    await logChange({ user, companyId: company.id, section, field: key, prev: inputs[key], next: value });
    inputs[key] = value;
  }
  await persist(company);
  const dest = String(formData.get("redirect_to") ?? "");
  if (dest) redirect(dest);
}

export async function saveScope3Decision(category: string, decision: "na" | "industry_average") {
  const { user, company } = await requireUser();
  const map = company.inputs.scope3_other_categories ?? {};
  await logChange({ user, companyId: company.id, section: "scope3", field: `other_category:${category}`, prev: map[category], next: decision === "na" ? "Not applicable" : "Estimated with industry average (low confidence)" });
  map[category] = decision;
  company.inputs.scope3_other_categories = map;
  await persist(company);
}

export async function savePolicy(policy: string, value: boolean) {
  const { user, company } = await requireUser();
  const map = company.inputs.gov_policies ?? {};
  await logChange({ user, companyId: company.id, section: "governance", field: `policy:${policy}`, prev: map[policy], next: value });
  map[policy] = value;
  company.inputs.gov_policies = map;
  await persist(company);
}

export async function saveLeadership(formData: FormData) {
  const { user, company } = await requireUser();
  const levels = ["C-Suite", "VP/Director", "Manager", "Individual Contributor"];
  const map: Record<string, { womenPct?: number | null; minorityPct?: number | null }> = {};
  for (const lvl of levels) {
    const w = formData.get(`${lvl}_women`);
    const m = formData.get(`${lvl}_minority`);
    if (w !== null || m !== null) {
      map[lvl] = { womenPct: w === "" || w === null ? null : Number(w), minorityPct: m === "" || m === null ? null : Number(m) };
    }
  }
  await logChange({ user, companyId: company.id, section: "governance", field: "leadership_diversity", prev: company.inputs.gov_leadership, next: map });
  company.inputs.gov_leadership = map;
  await persist(company);
}

// ─────────── Reports ───────────

export async function generateReport() {
  const { user, company } = await requireUser();
  const s = company.sectionStatus;
  if (!(s.connections === "complete" && s.scope1 === "complete" && s.scope2 === "complete")) return;
  company.reportGeneratedAt = new Date().toISOString();
  await logChange({ user, companyId: company.id, section: "reports", field: "ghg_inventory_report", prev: "—", next: `generated ${company.reportGeneratedAt}` });
  await persist(company);
  redirect("/report/ghg");
}

export async function saveActionPlan(gaps: string[]) {
  const { user, company } = await requireUser();
  company.actionPlan = gaps;
  await logChange({ user, companyId: company.id, section: "reports", field: "action_plan", prev: "—", next: `${gaps.length} items saved for next reporting cycle` });
  await persist(company);
}

// ─────────── Settings ───────────

export async function updateProfile(formData: FormData) {
  const { user, company } = await requireUser();
  const name = String(formData.get("company_name") ?? "").trim();
  if (name) {
    await logChange({ user, companyId: company.id, section: "settings", field: "company_name", prev: company.name, next: name });
    company.name = name;
  }
  const fy = Number(formData.get("fiscal_year_end"));
  if (fy >= 1 && fy <= 12 && fy !== company.fiscalYearEndMonth) {
    await logChange({ user, companyId: company.id, section: "settings", field: "fiscal_year_end", prev: company.fiscalYearEndMonth, next: fy });
    company.fiscalYearEndMonth = fy;
  }
  await persist(company);
  redirect("/settings?saved=1");
}
