"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { companies, consultantClients, consultantProfiles, shareLinks, snapshots, userCompanies, intakeSessions, dataRequests, pipelineStatus, vendorMappings, emissionLineItems } from "./db/schema";
import { normalizeVendor, matchVendor, VENDOR_CONFIRM_OPTIONS, getVendorMappingsFromDb } from "./vendor-mappings";
import { rowToLineItem } from "./ingestion/ingest";
import { recomputeLineItem, excludeLineItem, convertDollarFuelItem, isDollarFuelRow } from "./ledger";
import { lookupFactor } from "./factor-engine";
import { getFactorsFromDb } from "./factor-engine";
import type { UnmappedLog } from "./ingestion/ingest";
import { loadCompany, loadFactors, persistCompany } from "./store";
import { currentUser } from "./auth";
import { recalcCompany } from "./calc";
import { refreshSectionStatus } from "./progress";
import { logChange } from "./audit";
import { Company, User } from "./types";
import { sendDataRequestEmail } from "./email";
import { getBrandForCompany } from "./branding";
import { snapshotHash, restatementDiff } from "./snapshots";
import type { SnapshotTotals } from "./snapshots";
import { sendRestatementEmail } from "./email";
import { combinedTotals as computeTotals } from "./calc";
import { desc } from "drizzle-orm";
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
  const vendorMaps = await getVendorMappingsFromDb(company.id);
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
  revalidatePath(`/consultant/clients/${companyId}`);
}

export async function flagSession(sessionId: string, companyId: string, notes: string) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  await db
    .update(intakeSessions)
    .set({ status: "needs_info", reviewerNotes: notes, reviewedAt: new Date().toISOString() })
    .where(eq(intakeSessions.id, sessionId));
  revalidatePath(`/consultant/clients/${companyId}`);
}

export async function rejectSession(sessionId: string, companyId: string) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  const session = await db.query.intakeSessions.findFirst({ where: eq(intakeSessions.id, sessionId) });
  if (!session || session.companyId !== companyId) return;

  await db.update(intakeSessions).set({ status: "rejected", reviewedAt: new Date().toISOString() }).where(eq(intakeSessions.id, sessionId));

  // A rejected upload's rows leave all totals — excluded, never deleted (no silent drops)
  if (session.mappingProfileId) {
    const items = await db
      .select()
      .from(emissionLineItems)
      .where(and(eq(emissionLineItems.companyId, companyId), eq(emissionLineItems.mappingProfileId, session.mappingProfileId)));
    for (const item of items) {
      if (item.status === "excluded") continue;
      const patch = excludeLineItem(
        { ...item, calcLog: (item.calcLog as Record<string, unknown>) ?? {} },
        user.id,
        `Upload "${session.filename}" rejected by consultant`
      );
      await db.update(emissionLineItems).set(patch).where(eq(emissionLineItems.id, item.id));
    }
  }
  revalidatePath(`/consultant/clients/${companyId}`);
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

  revalidatePath(`/consultant/clients/${companyId}`);
}

async function notifyClientOfDataRequest(companyId: string, description: string, dueDate: string | null, token: string) {
  const [company, brand] = await Promise.all([
    db.query.companies.findFirst({ where: eq(companies.id, companyId) }),
    getBrandForCompany(companyId),
  ]);
  if (!company?.clientContactEmail) return; // no contact on file — consultant shares the link manually
  await sendDataRequestEmail(
    company.clientContactEmail,
    company.clientContactName ?? "there",
    company.name,
    description,
    dueDate,
    token,
    brand
  );
}

/** Re-sends the portal link email for an open request (e.g. after adding a contact email). */
export async function resendPortalEmail(requestId: string, companyId: string) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  const req = await db.query.dataRequests.findFirst({ where: eq(dataRequests.id, requestId) });
  if (!req?.token || req.status !== "open" || req.companyId !== companyId) return;
  await notifyClientOfDataRequest(companyId, req.description, req.dueDate, req.token);
  revalidatePath(`/consultant/clients/${companyId}`);
}

/** Confirms a vendor→category mapping globally (contracts/ §12: human-confirmed
 *  only) and remaps this company's flagged rows that match the vendor. */
export async function confirmVendorMapping(companyId: string, vendorRaw: string, optionKey: string, scopeChoice: "client" | "global" = "client") {
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

  // Scope decides who this mapping applies to: "global" = every client (real
  // vendors like PG&E); "client" = only this company (truck IDs, account
  // numbers — anything that must never enter the shared moat).
  const scopeCompanyId = scopeChoice === "global" ? null : companyId;
  const existing = (await db.select().from(vendorMappings).where(eq(vendorMappings.vendorPattern, pattern)))
    .find((m) => (m.companyId ?? null) === scopeCompanyId);

  let mappingId: string;
  if (existing) {
    mappingId = existing.id;
    await db
      .update(vendorMappings)
      .set({
        scope: option.scope,
        category: option.category,
        factorId: option.factorId,
        confirmedBy: user.id,
        confirmedAt: new Date().toISOString(),
      })
      .where(eq(vendorMappings.id, existing.id));
  } else {
    mappingId = newId("vm");
    await db.insert(vendorMappings).values({
      id: mappingId,
      vendorPattern: pattern,
      companyId: scopeCompanyId,
      scope: option.scope,
      category: option.category,
      factorId: option.factorId,
      confidence: "confirmed",
      confirmedBy: user.id,
      confirmedAt: new Date().toISOString(),
      sourceCompanyId: companyId,
      timesApplied: 0,
    });
  }

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

  revalidatePath(`/consultant/clients/${companyId}`);
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
  revalidatePath(`/consultant/clients/${companyId}`);
}

// ── Notify consultant when client accepts invite ───────────────────────────


// ─────────── White-label brand + shared results (Plan N5) ───────────

export async function saveBrandProfile(formData: FormData) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;

  const brandName = String(formData.get("brand_name") ?? "").trim();
  const accentRaw = String(formData.get("accent_color") ?? "").trim();
  const accentColor = /^#[0-9a-fA-F]{6}$/.test(accentRaw) ? accentRaw : null;
  const replyTo = String(formData.get("reply_to") ?? "").trim();

  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0 && process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`branding/${user.id}/${logo.name}`, Buffer.from(await logo.arrayBuffer()), {
      access: "public",
      addRandomSuffix: true,
    });
    logoUrl = blob.url;
  }

  await db
    .insert(consultantProfiles)
    .values({
      consultantId: user.id,
      brandName: brandName || null,
      accentColor,
      replyTo: replyTo || null,
      ...(logoUrl ? { logoUrl } : {}),
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: consultantProfiles.consultantId,
      set: {
        brandName: brandName || null,
        accentColor,
        replyTo: replyTo || null,
        ...(logoUrl ? { logoUrl } : {}),
        updatedAt: new Date().toISOString(),
      },
    });

  revalidatePath("/consultant/settings");
}

export async function createShareLink(companyId: string) {
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

  const { generatePortalToken } = await import("./portal");
  await db.insert(shareLinks).values({
    token: generatePortalToken(),
    companyId,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  });
  revalidatePath(`/consultant/clients/${companyId}`);
}

export async function revokeShareLink(token: string, companyId: string) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  await db
    .update(shareLinks)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(shareLinks.token, token), eq(shareLinks.companyId, companyId)));
  revalidatePath(`/consultant/clients/${companyId}`);
}

// ─────────── Data Ledger row corrections (Plan T1) ───────────

async function ledgerGuard(companyId: string, itemId: string) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return null;
  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user.id),
      eq(consultantClients.companyId, companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) return null;
  const item = await db.query.emissionLineItems.findFirst({ where: eq(emissionLineItems.id, itemId) });
  if (!item || item.companyId !== companyId) return null;
  return { user, item };
}

/** Recategorize a row to one of the confirmed factor options (same list vendor
 *  memory uses) and recompute its emissions with a fresh calc log. */
export async function recategorizeLineItem(companyId: string, itemId: string, optionKey: string) {
  const ctx = await ledgerGuard(companyId, itemId);
  if (!ctx) return;
  const option = VENDOR_CONFIRM_OPTIONS.find((o) => o.key === optionKey);
  if (!option) return;

  const factors = await getFactorsFromDb();
  const factor = lookupFactor(factors, { factorId: option.factorId });
  if (!factor) return;

  const patch = recomputeLineItem(
    { ...ctx.item, calcLog: (ctx.item.calcLog as Record<string, unknown>) ?? {} },
    factor,
    { scope: option.scope, category: option.category, editedBy: ctx.user.id, reason: `Recategorized to "${option.label}"` }
  );
  await db.update(emissionLineItems).set(patch).where(eq(emissionLineItems.id, itemId));
  revalidatePath(`/consultant/clients/${companyId}`);
}

/** Corrects a row's quantity and recomputes with its existing factor. */
export async function editLineItemQuantity(companyId: string, itemId: string, formData: FormData) {
  const ctx = await ledgerGuard(companyId, itemId);
  if (!ctx) return;
  const quantity = parseFloat(String(formData.get("quantity") ?? ""));
  if (isNaN(quantity) || quantity < 0) return;
  if (!ctx.item.factorId) return; // unmapped rows get a category first, not a quantity edit

  const factors = await getFactorsFromDb();
  const factor = lookupFactor(factors, { factorId: ctx.item.factorId });
  if (!factor) return;

  const patch = recomputeLineItem(
    { ...ctx.item, calcLog: (ctx.item.calcLog as Record<string, unknown>) ?? {} },
    factor,
    { quantity, editedBy: ctx.user.id, reason: `Quantity corrected ${ctx.item.rawValue} → ${quantity}` }
  );
  await db
    .update(emissionLineItems)
    .set({ ...patch, rawValue: quantity.toFixed(4) })
    .where(eq(emissionLineItems.id, itemId));
  revalidatePath(`/consultant/clients/${companyId}`);
}

/** Excludes a row from all totals (kept for audit, never deleted). */
export async function excludeLineItemAction(companyId: string, itemId: string) {
  const ctx = await ledgerGuard(companyId, itemId);
  if (!ctx) return;
  const patch = excludeLineItem(
    { ...ctx.item, calcLog: (ctx.item.calcLog as Record<string, unknown>) ?? {} },
    ctx.user.id,
    "Excluded by consultant in ledger"
  );
  await db.update(emissionLineItems).set(patch).where(eq(emissionLineItems.id, itemId));
  revalidatePath(`/consultant/clients/${companyId}`);
}

/** Restores an excluded row to its pre-exclusion status. */
export async function restoreLineItem(companyId: string, itemId: string) {
  const ctx = await ledgerGuard(companyId, itemId);
  if (!ctx || ctx.item.status !== "excluded") return;
  const log = (ctx.item.calcLog as { exclusion?: { previous_status?: string } }) ?? {};
  const previous = log.exclusion?.previous_status === "mapped" ? "mapped" : "unmapped";
  await db.update(emissionLineItems).set({ status: previous }).where(eq(emissionLineItems.id, itemId));
  revalidatePath(`/consultant/clients/${companyId}`);
}

// ─────────── Snapshots — the trust core (Plan T3, invariant §13) ───────────

function snapId() {
  return "snap_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Freezes the current approved state into an immutable, dated snapshot.
 *  If earlier snapshots were shared with named recipients, they get a
 *  restatement alert spelling out exactly what changed. */
export async function createSnapshot(companyId: string, formData: FormData) {
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

  const label = String(formData.get("label") ?? "").trim() || `Snapshot ${new Date().toISOString().slice(0, 10)}`;

  const [company, items] = await Promise.all([
    loadCompany(companyId),
    db
      .select()
      .from(emissionLineItems)
      .where(and(eq(emissionLineItems.companyId, companyId), eq(emissionLineItems.status, "mapped"))),
  ]);

  const t = computeTotals(company, items.map((i) => ({ scope: i.scope, co2eKg: Number(i.co2eKg), status: i.status })));
  const frozenTotals: SnapshotTotals = {
    scope1: t.scope1,
    scope2Location: t.scope2Location,
    scope2Market: t.scope2Market,
    scope3: t.scope3,
    total: t.total,
  };
  const frozenItems = items.map((i) => ({
    sourceRef: i.sourceRef,
    scope: i.scope,
    category: i.category,
    rawValue: i.rawValue,
    rawUnit: i.rawUnit,
    co2eKg: i.co2eKg,
    period: i.period,
    factorId: i.factorId,
    calcLog: i.calcLog,
  }));

  const id = snapId();
  await db.insert(snapshots).values({
    id,
    companyId,
    label,
    period: null,
    totals: frozenTotals,
    lineItems: frozenItems,
    itemCount: frozenItems.length,
    sha256: snapshotHash(frozenTotals, frozenItems),
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  });

  // Restatement alerts: anyone who received an earlier snapshot learns what changed
  const previous = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.companyId, companyId))
    .orderBy(desc(snapshots.createdAt))
    .limit(2);
  const prior = previous.find((p) => p.id !== id);
  if (prior) {
    const changes = restatementDiff(prior.totals as SnapshotTotals, frozenTotals);
    if (changes.length > 0) {
      const shares = await db
        .select()
        .from(shareLinks)
        .where(and(eq(shareLinks.companyId, companyId), isNull(shareLinks.revokedAt)));
      const brand = await getBrandForCompany(companyId);
      const company_ = await db.query.companies.findFirst({ where: eq(companies.id, companyId) });
      for (const share of shares) {
        if (!share.recipientEmail || !share.snapshotId) continue;
        sendRestatementEmail(
          share.recipientEmail,
          company_?.name ?? "your supplier",
          prior.label,
          changes,
          null,
          brand
        ).catch(() => {});
      }
    }
  }

  revalidatePath(`/consultant/clients/${companyId}`);
}

/** Shares a specific frozen snapshot — THIS snapshot, to THIS recipient. */
export async function shareSnapshot(companyId: string, snapshotId: string, formData: FormData) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") return;
  const snap = await db.query.snapshots.findFirst({ where: eq(snapshots.id, snapshotId) });
  if (!snap || snap.companyId !== companyId) return;

  const recipientEmail = String(formData.get("recipient_email") ?? "").trim();
  const recipientLabel = String(formData.get("recipient_label") ?? "").trim();

  const { generatePortalToken } = await import("./portal");
  await db.insert(shareLinks).values({
    token: generatePortalToken(),
    companyId,
    snapshotId,
    recipientEmail: recipientEmail || null,
    recipientLabel: recipientLabel || null,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  });
  revalidatePath(`/consultant/clients/${companyId}`);
}

/** Converts all flagged $-fuel rows using consultant-set prices (the judgment
 *  is the price; the math and the audit trail are ours). */
export async function convertDollarFuel(companyId: string, formData: FormData) {
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

  const parse = (k: string) => {
    const n = parseFloat(String(formData.get(k) ?? ""));
    return isNaN(n) || n <= 0 ? undefined : n;
  };
  const prices = { diesel: parse("diesel_price"), gasoline: parse("gasoline_price"), propane: parse("propane_price") };
  if (!prices.diesel && !prices.gasoline && !prices.propane) return;

  const [factors, flagged] = await Promise.all([
    getFactorsFromDb(),
    db
      .select()
      .from(emissionLineItems)
      .where(and(eq(emissionLineItems.companyId, companyId), eq(emissionLineItems.status, "unmapped"))),
  ]);

  for (const item of flagged) {
    const withLog = { ...item, calcLog: (item.calcLog as Record<string, unknown>) ?? {} };
    if (!isDollarFuelRow(withLog)) continue;
    const patch = convertDollarFuelItem(withLog, prices, factors, user.id);
    if (!patch) continue;
    await db.update(emissionLineItems).set(patch).where(eq(emissionLineItems.id, item.id));
  }
  revalidatePath(`/consultant/clients/${companyId}`);
  revalidatePath(`/consultant/clients/${companyId}/ledger`);
}
