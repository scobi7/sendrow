"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, currentUser as getClerkUser } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { companies, userCompanies, consultantClients, inviteTokens, scope3Screening, referralLeads } from "./db/schema";
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
import { getVendorMappingsFromDb } from "./vendor-mappings";
import { generateQBTransactions, generateUtilityData } from "./mockdata";
import { recalcCompany } from "./calc";
import { refreshSectionStatus } from "./progress";
import { logChange } from "./audit";
import { createCompanyRecord } from "./newcompany";
import { clientIp, checkRateLimit } from "./ratelimit";
import { sendWelcomeEmail, sendReferralLeadEmail } from "./email";
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
  const vendorMaps = await getVendorMappingsFromDb(company.id);
  recalcCompany(company, overrides, vendorMaps);
  refreshSectionStatus(company);
  await persistCompany(company);
  revalidatePath("/", "layout");
}

// ─────────── Onboarding (after Clerk signup) ───────────

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


// ─────────── Connections (simulated OAuth) ───────────

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
  const vendorMaps = await getVendorMappingsFromDb(company.id);
  recalcCompany(company, overrides, vendorMaps);
  refreshSectionStatus(company);
  await persistCompany(company);
  revalidatePath("/consultant");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const formUrl = process.env.UTILITYAPI_FORM_URL!;
  const dest = appUrl ? `${formUrl}?redirect_url=${encodeURIComponent(`${appUrl}/connections`)}` : formUrl;
  redirect(dest);
}


// ─────────── Reports ───────────


// ─────────── Settings ───────────


// ─────────── Consultant platform ───────────

export async function consultantAddClient(formData: FormData) {
  const consultant = await requireConsultant();
  const name = String(formData.get("name") ?? "").trim();
  const industry = String(formData.get("industry") ?? "") as Industry;
  const headcount = String(formData.get("headcount") ?? "") as HeadcountRange;
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const naicsCode = String(formData.get("naics") ?? "").trim();

  if (!name) redirect("/consultant/clients/new?error=" + encodeURIComponent("Client name is required."));

  const company = createCompanyRecord(name);
  if (industry) company.industry = industry;
  if (headcount) company.headcountRange = headcount;

  await db.insert(companies).values({
    id: company.id,
    name: company.name,
    industry: company.industry ?? null,
    headcountRange: company.headcountRange ?? null,
    clientContactName: contactName || null,
    clientContactEmail: contactEmail || null,
    naicsCode: naicsCode || null,
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

export async function updateClientContact(companyId: string, formData: FormData) {
  const consultant = await requireConsultant();
  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, consultant.id),
      eq(consultantClients.companyId, companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) return;

  const contactName = String(formData.get("contact_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  await db
    .update(companies)
    .set({ clientContactName: contactName || null, clientContactEmail: contactEmail || null })
    .where(eq(companies.id, companyId));

  revalidatePath(`/consultant/clients/${companyId}`);
  revalidatePath(`/consultant/clients/${companyId}`);
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


// ─────────── Referral routing (Plan J: inbound companies → partner consultants) ───────────

export async function submitReferralLead(formData: FormData) {
  const ip = await clientIp();
  if (!checkRateLimit(`referral:${ip}`)) {
    redirect("/get-matched?error=" + encodeURIComponent("Too many requests — please try again later."));
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const trigger = String(formData.get("trigger") ?? "").trim();

  if (!name || !email || !company) {
    redirect("/get-matched?error=" + encodeURIComponent("Name, email, and company are required."));
  }

  await db.insert(referralLeads).values({
    id: uid("rl_"),
    name,
    email,
    company,
    trigger: trigger || null,
    status: "new",
    createdAt: new Date().toISOString(),
  });

  sendReferralLeadEmail({ name, email, company, trigger }).catch(() => {});
  redirect("/get-matched?submitted=1");
}

// ─────────── Scope 3 Materiality Screening ───────────

