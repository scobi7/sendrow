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
import { createAuthorization, getMeters, getBills } from "./utilityapi";
import { fetchPurchases, getValidTokens } from "./quickbooks";
import { egridForState } from "./factors";
import { generateQBTransactions, generateUtilityData } from "./mockdata";
import { recalcCompany } from "./calc";
import { refreshSectionStatus } from "./progress";
import { logChange } from "./audit";
import { createCompanyRecord } from "./newcompany";
import { sendWelcomeEmail } from "./email";

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

  if (uname && uemail) sendWelcomeEmail(uname, uemail);

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

  if (email) sendWelcomeEmail(name, email);
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
  const authUid = await createAuthorization(email);
  company.connections.utility = {
    ...company.connections.utility,
    authUid,
    authEmail: email,
  };
  await persist(company);
  revalidatePath("/connections");
}

export async function syncUtilityNow() {
  const { user, company } = await requireUser();
  const authUid = company.connections.utility.authUid;
  if (!authUid) return;

  const meters = await getMeters(authUid);
  if (meters.length === 0) return; // user hasn't authorized yet

  const bills = await getBills(meters.map((m) => m.uid));
  const defaultLocationId = company.locations[0]?.id ?? "default";

  const monthly: Record<string, { kwh: number; therms: number }> = {};
  for (const bill of bills) {
    const month = bill.base.bill_start_date.substring(0, 7);
    if (!monthly[month]) monthly[month] = { kwh: 0, therms: 0 };
    monthly[month].kwh += bill.base.kwh ?? 0;
    monthly[month].therms += bill.base.therms ?? 0;
  }

  company.utilityData = Object.entries(monthly).map(([month, v]) => ({
    locationId: defaultLocationId,
    month,
    kwh: v.kwh,
    therms: v.therms,
  }));
  company.connections.utility = {
    ...company.connections.utility,
    connected: true,
    lastSynced: new Date().toISOString(),
  };

  await logChange({ user, companyId: company.id, section: "connections", field: "utility", prev: "pending", next: `connected — ${company.utilityData.length} meter-months pulled via UtilityAPI` });
  await saveUtilityData(company.id, company.utilityData);
  await persist(company);
  revalidatePath("/connections");
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
  } else {
    const authUid = company.connections.utility.authUid;
    if (authUid) {
      const meters = await getMeters(authUid);
      const bills = await getBills(meters.map((m) => m.uid));
      const defaultLocationId = company.locations[0]?.id ?? "default";
      const monthly: Record<string, { kwh: number; therms: number }> = {};
      for (const bill of bills) {
        const month = bill.base.bill_start_date.substring(0, 7);
        if (!monthly[month]) monthly[month] = { kwh: 0, therms: 0 };
        monthly[month].kwh += bill.base.kwh ?? 0;
        monthly[month].therms += bill.base.therms ?? 0;
      }
      company.utilityData = Object.entries(monthly).map(([month, v]) => ({
        locationId: defaultLocationId,
        month,
        kwh: v.kwh,
        therms: v.therms,
      }));
    } else {
      company.utilityData = generateUtilityData(company);
    }
    company.connections.utility.lastSynced = new Date().toISOString();
    await saveUtilityData(company.id, company.utilityData);
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
  redirect("/setup");
}
