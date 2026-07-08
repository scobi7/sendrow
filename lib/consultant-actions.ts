"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { consultantClients, userCompanies, intakeSessions, dataRequests, pipelineStatus, vendorMappings, emissionLineItems } from "./db/schema";
import { normalizeVendor, matchVendor, VENDOR_CONFIRM_OPTIONS, getVendorMappingsFromDb } from "./vendor-mappings";
import { rowToLineItem } from "./ingestion/ingest";
import { getFactorsFromDb } from "./factor-engine";
import type { UnmappedLog } from "./ingestion/ingest";
import { loadCompany, loadFactors, persistCompany } from "./store";
import { currentUser } from "./auth";
import { recalcCompany } from "./calc";
import { refreshSectionStatus } from "./progress";
import { logChange } from "./audit";
import { Company, User } from "./types";
import { sendInviteAcceptedEmail, sendDataRequestEmail } from "./email";
import { generatePortalToken, portalExpiry, buildChecklist } from "./portal";
import type { DataType } from "./ingestion/data-type-templates";

// ── Field maps (mirrored from actions.ts) ──────────────────────────────────

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

// ── Access helpers ─────────────────────────────────────────────────────────

async function asConsultantFor(companyId: string): Promise<{ user: User; company: Company }> {
  const user = await currentUser();
  if (!user || user.role !== "consultant") redirect("/login");

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user.id),
      eq(consultantClients.companyId, companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) redirect("/consultant");

  const company = await loadCompany(companyId);
  return { user, company };
}

async function persist(company: Company) {
  const overrides = await loadFactors();
  const vendorMaps = await getVendorMappingsFromDb();
  recalcCompany(company, overrides, vendorMaps);
  refreshSectionStatus(company);
  await persistCompany(company);
  revalidatePath("/", "layout");
}

// ── On-behalf actions ──────────────────────────────────────────────────────

export async function consultantSaveFields(companyId: string, formData: FormData) {
  const { user, company } = await asConsultantFor(companyId);
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

export async function consultantSaveScope3Decision(companyId: string, category: string, decision: "na" | "industry_average") {
  const { user, company } = await asConsultantFor(companyId);
  const map = company.inputs.scope3_other_categories ?? {};
  await logChange({ user, companyId: company.id, section: "scope3", field: `other_category:${category}`, prev: map[category], next: decision === "na" ? "Not applicable" : "Estimated with industry average" });
  map[category] = decision;
  company.inputs.scope3_other_categories = map;
  await persist(company);
}

export async function consultantSavePolicy(companyId: string, policy: string, value: boolean) {
  const { user, company } = await asConsultantFor(companyId);
  const map = company.inputs.gov_policies ?? {};
  await logChange({ user, companyId: company.id, section: "governance", field: `policy:${policy}`, prev: map[policy], next: value });
  map[policy] = value;
  company.inputs.gov_policies = map;
  await persist(company);
}

export async function consultantSaveLeadership(companyId: string, formData: FormData) {
  const { user, company } = await asConsultantFor(companyId);
  const levels = ["C-Suite", "VP/Director", "Manager", "Individual Contributor"];
  const map: Record<string, { womenPct?: number | null; minorityPct?: number | null }> = {};
  for (const lvl of levels) {
    const w = formData.get(`${lvl}_women`);
    const m = formData.get(`${lvl}_minority`);
    if (w !== null || m !== null) {
      map[lvl] = {
        womenPct: w === "" || w === null ? null : Number(w),
        minorityPct: m === "" || m === null ? null : Number(m),
      };
    }
  }
  await logChange({ user, companyId: company.id, section: "governance", field: "leadership_diversity", prev: company.inputs.gov_leadership, next: map });
  company.inputs.gov_leadership = map;
  await persist(company);
}

export async function consultantMarkQBReviewed(companyId: string) {
  const { user, company } = await asConsultantFor(companyId);
  await logChange({ user, companyId: company.id, section: "connections", field: "qb_data_reviewed", prev: false, next: true });
  company.inputs.qb_data_reviewed = true;
  await persist(company);
}

export async function consultantMarkUtilityReviewed(companyId: string) {
  const { user, company } = await asConsultantFor(companyId);
  await logChange({ user, companyId: company.id, section: "connections", field: "scope2_reviewed", prev: false, next: true });
  company.inputs.scope2_reviewed = true;
  await persist(company);
}

export async function consultantGenerateReport(companyId: string) {
  const { user, company } = await asConsultantFor(companyId);
  const s = company.sectionStatus;
  if (!(s.connections === "complete" && s.scope1 === "complete" && s.scope2 === "complete")) return;
  company.reportGeneratedAt = new Date().toISOString();
  await logChange({ user, companyId: company.id, section: "reports", field: "ghg_inventory_report", prev: "—", next: `generated ${company.reportGeneratedAt}` });
  await persist(company);
  redirect(`/consultant/clients/${companyId}/manage/reports`);
}

// ── Intake session review actions ─────────────────────────────────────────

function newId(prefix: string) {
  return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export async function approveSession(sessionId: string, companyId: string) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  await db.update(intakeSessions).set({ status: "approved", reviewedAt: new Date().toISOString() }).where(eq(intakeSessions.id, sessionId));
  await db
    .insert(pipelineStatus)
    .values({ companyId, status: "in_progress", updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: pipelineStatus.companyId,
      set: { status: "in_progress", updatedAt: new Date().toISOString() },
      setWhere: eq(pipelineStatus.status, "not_started"),
    });
  revalidatePath(`/consultant/review/${companyId}`);
}

export async function flagSession(sessionId: string, companyId: string, notes: string) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  await db
    .update(intakeSessions)
    .set({ status: "needs_info", reviewerNotes: notes, reviewedAt: new Date().toISOString() })
    .where(eq(intakeSessions.id, sessionId));
  revalidatePath(`/consultant/review/${companyId}`);
}

export async function rejectSession(sessionId: string, companyId: string) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  await db.update(intakeSessions).set({ status: "rejected", reviewedAt: new Date().toISOString() }).where(eq(intakeSessions.id, sessionId));
  revalidatePath(`/consultant/review/${companyId}`);
}

export async function createDataRequest(
  companyId: string,
  consultantId: string,
  description: string,
  dueDate: string | null,
  checklistTypes: DataType[] = []
) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  if (!description.trim()) return;

  const token = generatePortalToken();
  await db.insert(dataRequests).values({
    id: newId("dr"),
    companyId,
    requestedBy: consultantId,
    description: description.trim(),
    status: "open",
    dueDate: dueDate || null,
    createdAt: new Date().toISOString(),
    token,
    expiresAt: portalExpiry(),
    checklist: buildChecklist(checklistTypes, description.trim()),
    remindersSentAt: {},
  });

  // Notify the client — fire-and-forget so email failures never block the request
  notifyClientOfDataRequest(companyId, description.trim(), dueDate || null, token).catch(() => {});

  revalidatePath(`/consultant/review/${companyId}`);
}

async function notifyClientOfDataRequest(companyId: string, description: string, dueDate: string | null, token: string) {
  const [clientUser, company] = await Promise.all([
    db.query.userCompanies.findFirst({
      where: and(eq(userCompanies.companyId, companyId), eq(userCompanies.role, "company")),
    }),
    loadCompany(companyId),
  ]);
  if (!clientUser?.email) return;
  await sendDataRequestEmail(clientUser.email, clientUser.name ?? "there", company.name, description, dueDate, token);
}

/** Confirms a vendor→category mapping globally (contracts/ §12: human-confirmed
 *  only) and remaps this company's flagged rows that match the vendor. */
export async function confirmVendorMapping(companyId: string, vendorRaw: string, optionKey: string) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user.id),
      eq(consultantClients.companyId, companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) return;

  const option = VENDOR_CONFIRM_OPTIONS.find((o) => o.key === optionKey);
  const pattern = normalizeVendor(vendorRaw);
  if (!option || !pattern) return;

  const mappingId = newId("vm");
  await db
    .insert(vendorMappings)
    .values({
      id: mappingId,
      vendorPattern: pattern,
      scope: option.scope,
      category: option.category,
      factorId: option.factorId,
      confidence: "confirmed",
      confirmedBy: user.id,
      confirmedAt: new Date().toISOString(),
      sourceCompanyId: companyId,
      timesApplied: 0,
    })
    .onConflictDoUpdate({
      target: vendorMappings.vendorPattern,
      set: {
        scope: option.scope,
        category: option.category,
        factorId: option.factorId,
        confirmedBy: user.id,
        confirmedAt: new Date().toISOString(),
      },
    });

  // Remap this company's flagged rows that match the confirmed vendor
  const [factors, flagged] = await Promise.all([
    getFactorsFromDb(),
    db.select().from(emissionLineItems).where(
      and(eq(emissionLineItems.companyId, companyId), eq(emissionLineItems.status, "unmapped"))
    ),
  ]);
  const mapping = [{ id: mappingId, vendorPattern: pattern, scope: option.scope, category: option.category, factorId: option.factorId }];

  for (const item of flagged) {
    const log = item.calcLog as UnmappedLog;
    const row = {
      quantity: log.raw_value ?? undefined,
      unit: log.raw_unit,
      activity_type: log.activity_type,
      source_ref: item.sourceRef,
    };
    if (!matchVendor(row.source_ref, mapping) && !matchVendor(row.activity_type, mapping)) continue;
    const remapped = rowToLineItem(row, factors, companyId, item.mappingProfileId, mapping);
    if (remapped.status !== "mapped") continue; // e.g. quantity still missing — stays flagged
    await db
      .update(emissionLineItems)
      .set({
        scope: remapped.scope,
        category: remapped.category,
        co2eKg: remapped.co2eKg,
        confidence: remapped.confidence,
        status: "mapped",
        factorId: remapped.factorId,
        calcLog: remapped.calcLog,
      })
      .where(eq(emissionLineItems.id, item.id));
  }

  revalidatePath(`/consultant/review/${companyId}`);
}

export async function lockPipeline(companyId: string, notes: string) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  await db
    .insert(pipelineStatus)
    .values({ companyId, status: "locked", lockedAt: new Date().toISOString(), lockedBy: user.id, notes: notes || null, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: pipelineStatus.companyId,
      set: { status: "locked", lockedAt: new Date().toISOString(), lockedBy: user.id, notes: notes || null, updatedAt: new Date().toISOString() },
    });
  revalidatePath(`/consultant/review/${companyId}`);
}

// ── Notify consultant when client accepts invite ───────────────────────────

export async function notifyConsultantOfAcceptedInvite(companyId: string, clientName: string, clientEmail: string) {
  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.companyId, companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) return;

  const consultant = await db.query.userCompanies.findFirst({
    where: eq(userCompanies.clerkId, link.consultantId),
  });
  if (!consultant?.email) return;

  const company = await loadCompany(companyId);
  await sendInviteAcceptedEmail(
    consultant.name ?? "there",
    consultant.email,
    company.name,
    clientName,
    clientEmail
  );
}
