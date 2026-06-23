"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, currentUser as getClerkUser } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { companies, userCompanies, consultantClients, inviteTokens } from "./db/schema";
import {
  loadCompany,
  loadFactors,
  persistCompany,
  saveLocations,
  saveQBTransactions,
  saveUtilityData,
  uid,
} from "./store";
import { currentUser } from "./auth";
import { Company, HeadcountRange, Industry, User } from "./types";
import { findAuthorizationByEmail, getMeters, getBills } from "./utilityapi";
import { fetchPurchases, getValidTokens } from "./quickbooks";
import { egridForState } from "./factors";
import { generateQBTransactions, generateUtilityData } from "./mockdata";
import { recalcCompany } from "./calc";
import { refreshSectionStatus } from "./progress";
import { logChange } from "./audit";
import { createCompanyRecord } from "./newcompany";
import { sendWelcomeEmail, sendInviteAcceptedEmail, sendSectionCompleteEmail } from "./email";
import type { UtilityMeter, UtilityBill } from "./utilityapi";
import type { Location } from "./types";

// Match a meter's service_address to the closest location by city or zip.
function locationForMeter(meter: UtilityMeter, locations: Location[]): string {
  const addr = (meter.service_address ?? "").toLowerCase();
  for (const loc of locations) {
    if (loc.zip && addr.includes(loc.zip)) return loc.id;
    if (loc.city && addr.includes(loc.city.toLowerCase())) return loc.id;
  }
  return locations[0]?.id ?? "default";
}

// Aggregate bills into monthly kWh/therms keyed by locationId+month.
function aggregateBills(
  bills: UtilityBill[],
  meters: UtilityMeter[],
  locations: Location[]
): { locationId: string; month: string; kwh: number; therms: number }[] {
  const meterLoc: Record<string, string> = {};
  for (const m of meters) meterLoc[m.uid] = locationForMeter(m, locations);

  const monthly: Record<string, { kwh: number; therms: number }> = {};
  for (const bill of bills) {
    const locId = meterLoc[bill.meter_uid] ?? locations[0]?.id ?? "default";
    const month = bill.base.bill_start_date.substring(0, 7);
    const key = `${locId}|${month}`;
    if (!monthly[key]) monthly[key] = { kwh: 0, therms: 0 };
    monthly[key].kwh += bill.base.bill_total_kWh ?? bill.base.kwh ?? 0;
    monthly[key].therms += bill.base.bill_total_therms ?? bill.base.bill_total_ccf ?? bill.base.therms ?? 0;
  }
  return Object.entries(monthly).map(([key, v]) => {
    const [locationId, month] = key.split("|");
    return { locationId, month, kwh: v.kwh, therms: v.therms };
  });
}

async function requireUser(): Promise<{ user: User; company: Company }> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.companyId) redirect("/onboarding");
  const company = await loadCompany(user.companyId);
  return { user, company };
}

async function requireConsultant(): Promise<User> {
  const user = await currentUser();
  if (!user || user.role !== "consultant") redirect("/login");
  return user;
}

async function persist(company: Company) {
  const overrides = await loadFactors();
  recalcCompany(company, overrides);
  refreshSectionStatus(company);
  await persistCompany(company);
  revalidatePath("/", "layout");
}

// ─────────── Onboarding (after Clerk signup) ───────────

export async function onboardAsCompany(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const clerkUser = await getClerkUser();
  const companyName = String(formData.get("company") ?? "").trim();
  if (!companyName) {
    redirect("/onboarding?error=" + encodeURIComponent("Company name is required."));
  }

  const company = createCompanyRecord(companyName);

  await db.insert(companies).values({
    id: company.id,
    name: company.name,
    createdAt: company.createdAt,
    setupComplete: false,
    sectionStatus: company.sectionStatus,
  });

  const uname = clerkUser?.fullName ?? clerkUser?.firstName ?? "User";
  const uemail = clerkUser?.emailAddresses[0]?.emailAddress ?? "";

  await db
    .insert(userCompanies)
    .values({
      clerkId: userId,
      companyId: company.id,
      name: uname,
      email: uemail,
      role: "company",
      createdAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: userCompanies.clerkId,
      set: { companyId: company.id, name: uname, email: uemail, role: "company" },
    });

  if (uname && uemail) sendWelcomeEmail(uname, uemail).catch(() => {});

  redirect("/setup");
}

export async function onboardAsConsultant() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const clerkUser = await getClerkUser();
  const name = clerkUser?.fullName ?? clerkUser?.firstName ?? "User";
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";

  await db
    .insert(userCompanies)
    .values({
      clerkId: userId,
      companyId: null,
      name,
      email,
      role: "consultant",
      createdAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: userCompanies.clerkId,
      set: { companyId: null, name, email, role: "consultant" },
    });

  if (email) sendWelcomeEmail(name, email).catch(() => {});
  redirect("/consultant");
}

// ─────────── Setup wizard ───────────

export async function saveSetup(formData: FormData) {
  const { user, company } = await requireUser();
  const industry = String(formData.get("industry") ?? "") as Industry;
  const headcount = String(formData.get("headcount") ?? "") as HeadcountRange;
  const fyEnd = Number(formData.get("fiscal_year_end"));
  const locCount = Number(formData.get("location_count"));

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
  await saveLocations(company.id, company.locations);
  await persist(company);
  redirect("/setup/complete");
}

// ─────────── Connections (simulated OAuth) ───────────

export async function connectQuickBooks() {
  const { user, company } = await requireUser();
  company.connections.quickbooks = { connected: true, lastSynced: new Date().toISOString() };
  company.qbTransactions = generateQBTransactions(company);
  await logChange({ user, companyId: company.id, section: "connections", field: "quickbooks", prev: "disconnected", next: `connected — ${company.qbTransactions.length} transactions pulled (demo data)` });
  await saveQBTransactions(company.id, company.qbTransactions);
  await persist(company);
}

export async function connectUtility() {
  // Demo mode fallback (no UTILITYAPI_KEY)
  const { user, company } = await requireUser();
  company.connections.utility = { connected: true, lastSynced: new Date().toISOString() };
  company.utilityData = generateUtilityData(company);
  await logChange({ user, companyId: company.id, section: "connections", field: "utility", prev: "disconnected", next: `connected — ${company.utilityData.length} meter-months pulled (demo data)` });
  await saveUtilityData(company.id, company.utilityData);
  await persist(company);
}

export async function startUtilityConnect(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  const { company } = await requireUser();
  company.connections.utility = {
    ...company.connections.utility,
    authEmail: email,
    authUid: null,
  };
  await persist(company);
  // Return to connections page — the page will show the "open UtilityAPI" link in a new tab
  redirect("/connections");
}

export async function startUtilityConnectForClient(companyId: string, formData: FormData) {
  const consultant = await requireConsultant();
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, consultant.id),
      eq(consultantClients.companyId, companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) return;

  const company = await loadCompany(companyId);
  company.connections.utility = {
    ...company.connections.utility,
    authEmail: email,
    authUid: null,
  };
  const overrides = await loadFactors();
  recalcCompany(company, overrides);
  refreshSectionStatus(company);
  await persistCompany(company);
  revalidatePath("/consultant");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const formUrl = process.env.UTILITYAPI_FORM_URL!;
  const dest = appUrl ? `${formUrl}?redirect_url=${encodeURIComponent(`${appUrl}/connections`)}` : formUrl;
  redirect(dest);
}

export async function syncUtilityByUid(formData: FormData) {
  const { user, company } = await requireUser();
  const uid = String(formData.get("auth_uid") ?? "").trim();
  if (!uid) redirect("/connections?util_error=not_found");

  company.connections.utility.authUid = uid;
  await persistCompany(company);

  // Reuse the main sync path now that we have the UID
  let meters;
  try {
    meters = await getMeters(uid);
  } catch {
    redirect("/connections?util_error=api_error");
  }
  if (!meters || meters.length === 0) redirect("/connections?util_error=pending");

  let bills;
  try {
    bills = await getBills(meters.map((m) => m.uid));
  } catch {
    redirect("/connections?util_error=api_error");
  }

  company.utilityData = aggregateBills(bills, meters, company.locations);
  company.connections.utility = {
    ...company.connections.utility,
    connected: true,
    lastSynced: new Date().toISOString(),
  };

  await logChange({ user, companyId: company.id, section: "connections", field: "utility", prev: "pending", next: `connected via UID ${uid} — ${company.utilityData.length} meter-months pulled` });
  await saveUtilityData(company.id, company.utilityData);
  await persist(company);
  redirect("/connections");
}

export async function syncUtilityNow() {
  const { user, company } = await requireUser();

  // No API key — fall back to demo data
  if (!process.env.UTILITYAPI_KEY) {
    company.connections.utility = { connected: true, lastSynced: new Date().toISOString(), authEmail: null, authUid: null };
    company.utilityData = generateUtilityData(company);
    await logChange({ user, companyId: company.id, section: "connections", field: "utility", prev: "pending", next: `connected — demo data loaded` });
    await saveUtilityData(company.id, company.utilityData);
    await persist(company);
    redirect("/connections");
  }

  let authUid = company.connections.utility.authUid;

  // Look up authorization by email if uid not cached yet
  if (!authUid && company.connections.utility.authEmail) {
    try {
      authUid = await findAuthorizationByEmail(company.connections.utility.authEmail);
    } catch {
      redirect("/connections?util_error=api_error");
    }
    if (authUid) {
      company.connections.utility.authUid = authUid;
      await persistCompany(company);
    }
  }

  if (!authUid) {
    redirect("/connections?util_error=not_found");
  }

  let meters;
  try {
    meters = await getMeters(authUid);
  } catch {
    redirect("/connections?util_error=api_error");
  }

  if (meters.length === 0) {
    redirect("/connections?util_error=pending");
  }

  let bills;
  try {
    bills = await getBills(meters.map((m) => m.uid));
  } catch {
    redirect("/connections?util_error=api_error");
  }

  company.utilityData = aggregateBills(bills, meters, company.locations);
  company.connections.utility = {
    ...company.connections.utility,
    connected: true,
    lastSynced: new Date().toISOString(),
  };

  await logChange({ user, companyId: company.id, section: "connections", field: "utility", prev: "pending", next: `connected — ${company.utilityData.length} meter-months pulled via UtilityAPI` });
  await saveUtilityData(company.id, company.utilityData);
  await persist(company);
  redirect("/connections");
}

export async function resync(which: "quickbooks" | "utility") {
  const { user, company } = await requireUser();
  if (which === "quickbooks") {
    const qb = company.connections.quickbooks;
    if (qb.accessToken && qb.refreshToken && qb.tokenExpiresAt && qb.realmId) {
      const tokens = await getValidTokens(qb.accessToken, qb.refreshToken, qb.tokenExpiresAt, qb.realmId);
      const purchases = await fetchPurchases(tokens.accessToken, tokens.realmId);
      company.connections.quickbooks = { ...qb, ...tokens, connected: true, lastSynced: new Date().toISOString() };
      company.qbTransactions = purchases.map((p, i) => ({
        id: `qb-${Date.now()}-${i}`,
        vendor: p.vendor,
        category: p.category,
        amount: p.amount,
        date: p.date,
      }));
    } else {
      company.qbTransactions = generateQBTransactions(company);
      company.connections.quickbooks.lastSynced = new Date().toISOString();
    }
    await saveQBTransactions(company.id, company.qbTransactions);
    company.inputs.qb_data_reviewed = false;
  } else {
    const authUid = company.connections.utility.authUid;
    if (authUid) {
      const meters = await getMeters(authUid);
      const bills = await getBills(meters.map((m) => m.uid));
      company.utilityData = aggregateBills(bills, meters, company.locations);
    } else {
      company.utilityData = generateUtilityData(company);
    }
    company.connections.utility.lastSynced = new Date().toISOString();
    company.inputs.scope2_reviewed = false;
    await saveUtilityData(company.id, company.utilityData);
  }
  await logChange({ user, companyId: company.id, section: "connections", field: which, prev: "synced", next: `resynced ${new Date().toISOString()}` });
  await persist(company);
  redirect("/connections");
}

export async function disconnectQuickBooks() {
  const { user, company } = await requireUser();
  company.connections.quickbooks = { connected: false, lastSynced: null };
  company.qbTransactions = [];
  await logChange({ user, companyId: company.id, section: "connections", field: "quickbooks", prev: "connected", next: "disconnected" });
  await saveQBTransactions(company.id, []);
  await persist(company);
}

export async function disconnectUtility() {
  const { user, company } = await requireUser();
  company.connections.utility = { connected: false, lastSynced: null, authUid: null, authEmail: null };
  company.utilityData = [];
  await logChange({ user, companyId: company.id, section: "connections", field: "utility", prev: "connected", next: "disconnected" });
  await saveUtilityData(company.id, []);
  await persist(company);
}

export async function markQBReviewed() {
  const { user, company } = await requireUser();
  await logChange({ user, companyId: company.id, section: "scope3", field: "qb_data_reviewed", prev: false, next: true });
  company.inputs.qb_data_reviewed = true;
  await persist(company);
}

export async function markUtilityReviewed() {
  const { user, company } = await requireUser();
  await logChange({ user, companyId: company.id, section: "scope2", field: "scope2_reviewed", prev: false, next: true });
  company.inputs.scope2_reviewed = true;
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
  const prevStatus = { ...company.sectionStatus };
  for (const [key, raw] of Array.from(formData.entries())) {
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

  // Notify consultant if a section just completed
  try {
    const SECTION_LABELS: Record<string, string> = {
      scope1: "Scope 1", scope2: "Scope 2", scope3: "Scope 3",
      social: "Social", governance: "Governance", connections: "Connections",
    };
    for (const [sec, label] of Object.entries(SECTION_LABELS)) {
      if (prevStatus[sec as keyof typeof prevStatus] !== "complete" && company.sectionStatus[sec as keyof typeof company.sectionStatus] === "complete") {
        const link = await db.query.consultantClients.findFirst({
          where: and(eq(consultantClients.companyId, company.id), isNull(consultantClients.archivedAt)),
        });
        if (link) {
          const consultant = await db.query.userCompanies.findFirst({
            where: eq(userCompanies.clerkId, link.consultantId),
          });
          if (consultant?.email) {
            await sendSectionCompleteEmail(consultant.email, consultant.name ?? "there", company.name, label);
          }
        }
        break;
      }
    }
  } catch {}

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

export async function addLocation(formData: FormData) {
  const { user, company } = await requireUser();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "CA").trim().toUpperCase();
  const zip = String(formData.get("zip") ?? "").trim();
  if (!city || !state) redirect("/settings?error=location");
  const newLoc = { id: uid("loc_"), address, city, state, zip, egridSubregion: egridForState(state) };
  company.locations.push(newLoc);
  await logChange({ user, companyId: company.id, section: "settings", field: "location_added", prev: null, next: `${city}, ${state}` });
  await saveLocations(company.id, company.locations);
  await persist(company);
  redirect("/settings?saved=1");
}

export async function removeLocation(formData: FormData) {
  const { user, company } = await requireUser();
  const locId = String(formData.get("loc_id") ?? "").trim();
  if (!locId) return;
  const removed = company.locations.find((l) => l.id === locId);
  company.locations = company.locations.filter((l) => l.id !== locId);
  await logChange({ user, companyId: company.id, section: "settings", field: "location_removed", prev: removed ? `${removed.city}, ${removed.state}` : locId, next: null });
  await saveLocations(company.id, company.locations);
  await persist(company);
  redirect("/settings?saved=1");
}

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

export async function deleteAccount() {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  await db.delete(userCompanies).where(eq(userCompanies.clerkId, userId));
  redirect("/");
}

// ─────────── Consultant platform ───────────

export async function consultantAddClient(formData: FormData) {
  const consultant = await requireConsultant();
  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "") as Industry;
  const headcount = String(formData.get("headcount") ?? "") as HeadcountRange;

  if (!name) redirect("/consultant/clients/new?error=" + encodeURIComponent("Client name is required."));

  const company = createCompanyRecord(name);
  if (industry) company.industry = industry;
  if (headcount) company.headcountRange = headcount;

  await db.insert(companies).values({
    id: company.id,
    name: company.name,
    industry: company.industry ?? null,
    headcountRange: company.headcountRange ?? null,
    createdAt: company.createdAt,
    setupComplete: false,
    sectionStatus: company.sectionStatus,
  });

  await db.insert(consultantClients).values({
    id: uid("cc_"),
    consultantId: consultant.id,
    companyId: company.id,
    addedAt: new Date().toISOString(),
    archivedAt: null,
  });

  redirect(`/consultant/clients/${company.id}`);
}

export async function generateInviteToken(companyId: string) {
  const consultant = await requireConsultant();

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, consultant.id),
      eq(consultantClients.companyId, companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) redirect("/consultant");

  const token = crypto.randomBytes(24).toString("hex");
  await db.insert(inviteTokens).values({
    token,
    consultantId: consultant.id,
    companyId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    usedAt: null,
  });

  redirect(`/consultant/clients/${companyId}?invite=${token}`);
}

export async function archiveClient(companyId: string) {
  const consultant = await requireConsultant();
  await db
    .update(consultantClients)
    .set({ archivedAt: new Date().toISOString() })
    .where(
      and(
        eq(consultantClients.consultantId, consultant.id),
        eq(consultantClients.companyId, companyId)
      )
    );
  redirect("/consultant");
}

export async function deleteClient(companyId: string) {
  const consultant = await requireConsultant();
  await db
    .delete(consultantClients)
    .where(
      and(
        eq(consultantClients.consultantId, consultant.id),
        eq(consultantClients.companyId, companyId)
      )
    );
  redirect("/consultant");
}

export async function acceptInvite(token: string) {
  const { userId } = await auth();
  if (!userId) redirect(`/login?redirect_url=/connect/${token}`);

  const existing = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.clerkId, userId),
  });
  if (existing?.companyId) redirect("/dashboard");

  const invite = await db.query.inviteTokens.findFirst({
    where: eq(inviteTokens.token, token),
  });

  if (!invite || invite.usedAt || new Date(invite.expiresAt) < new Date()) {
    redirect(`/connect/${token}?error=` + encodeURIComponent("This invite link has expired or is invalid."));
  }

  const clerkUser = await getClerkUser();
  const name = clerkUser?.fullName ?? clerkUser?.firstName ?? "User";
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "";

  if (existing) {
    await db.update(userCompanies).set({ companyId: invite.companyId }).where(eq(userCompanies.clerkId, userId));
  } else {
    await db.insert(userCompanies).values({
      clerkId: userId,
      companyId: invite.companyId,
      name,
      email,
      role: "company",
      createdAt: new Date().toISOString(),
    });
  }

  await db.update(inviteTokens).set({ usedAt: new Date().toISOString() }).where(eq(inviteTokens.token, token));

  // Notify the consultant
  try {
    const link = await db.query.consultantClients.findFirst({
      where: and(eq(consultantClients.companyId, invite.companyId), isNull(consultantClients.archivedAt)),
    });
    if (link) {
      const consultant = await db.query.userCompanies.findFirst({
        where: eq(userCompanies.clerkId, link.consultantId),
      });
      const company = await loadCompany(invite.companyId);
      if (consultant?.email) {
        await sendInviteAcceptedEmail(consultant.name ?? "there", consultant.email, company.name, name, email);
      }
    }
  } catch {}

  redirect("/setup");
}
