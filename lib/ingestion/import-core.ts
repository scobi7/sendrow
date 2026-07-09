import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mappingProfiles, emissionLineItems, intakeSessions, pipelineStatus, dataRequests } from "@/lib/db/schema";
import { sql, inArray } from "drizzle-orm";
import { vendorMappings as vendorMappingsTable } from "@/lib/db/schema";
import { applyProfile, rowToLineItem, fleetFuelToLineItems } from "./ingest";
import { getVendorMappingsFromDb } from "@/lib/vendor-mappings";
import { getFactorsFromDb } from "@/lib/factor-engine";
import { fuzzyMatchHeaders } from "./fuzzy-match";
import { scoreSession } from "./session-score";
import { checklistComplete } from "@/lib/portal";
import { periodForDate } from "@/lib/period";
import { companies } from "@/lib/db/schema";
import type { ChecklistItem } from "@/lib/portal";
import type { ColumnMap, FuelPrices } from "./ingest";
import type { DataType } from "./data-type-templates";

function newId(prefix: string) {
  return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export type ImportInput = {
  companyId: string;
  uploadedBy: string; // clerk id, or "portal:<requestId>" for magic-link submissions
  rows: Record<string, string>[];
  columnMap: ColumnMap;
  profileName: string;
  dataType: DataType;
  fuelPrices: FuelPrices | null;
  filename: string;
  dataRequestId?: string | null;
  checklistItemId?: string | null;
  evidenceId?: string | null;
  headerFingerprint?: string | null;
  /** The uploader explicitly confirmed the column mapping (Plan T2). */
  mappingConfirmed?: boolean;
};

export type ImportOutcome = {
  imported: number;
  unmapped: number;
  skipped: 0;
  profileId: string;
  sessionId: string;
  sessionStatus: string;
  sessionScore: number;
  autoApproved: boolean;
  reasons: string[];
  pipelineLocked: boolean;
};

/** Shared import pipeline: scoring, mapping profile, line items (never dropping
 *  rows), intake session, pipeline advancement, and data-request checklist
 *  updates. Callers handle auth (Clerk or portal token) before invoking. */
export async function processImport(input: ImportInput): Promise<ImportOutcome> {
  const { companyId, uploadedBy, rows, columnMap, profileName, dataType, fuelPrices, filename } = input;

  const [pipeline] = await db
    .select()
    .from(pipelineStatus)
    .where(eq(pipelineStatus.companyId, companyId));
  const pipelineLocked = pipeline?.status === "locked";

  const headers = Object.keys(rows[0] ?? {});
  const matchResults = fuzzyMatchHeaders(headers);
  // A human-confirmed mapping outranks any guessing score (doctrine: AI
  // suggests, human confirms) — flagged rows below still force review.
  const scored = pipelineLocked
    ? { score: 1, autoApproved: true, reasons: ["pipeline locked"] }
    : input.mappingConfirmed
      ? { score: 1, autoApproved: true, reasons: ["column mapping confirmed by uploader"] }
      : scoreSession(dataType, matchResults);
  const { score } = scored;
  let { autoApproved, reasons } = scored;

  const profileId = newId("mp");
  await db.insert(mappingProfiles).values({
    id: profileId,
    companyId,
    name: profileName,
    columnMap: { ...columnMap, _dataType: dataType },
    headerFingerprint: input.headerFingerprint ?? null,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  });

  const [factors, vendorMaps, companyRow] = await Promise.all([
    getFactorsFromDb(),
    getVendorMappingsFromDb(),
    db.query.companies.findFirst({ where: eq(companies.id, companyId) }),
  ]);
  const normalized = applyProfile(rows, columnMap);

  // Every row becomes a line item — unmappable rows are flagged, never dropped
  let inserts;
  if (dataType === "fleet_fuel_dollar" && fuelPrices) {
    inserts = fleetFuelToLineItems(normalized, factors, fuelPrices, companyId, profileId);
  } else {
    // 1:1 with normalized rows, so each item can be period-tagged from its row date
    inserts = normalized.map((row) => ({
      ...rowToLineItem(row, factors, companyId, profileId, vendorMaps),
      period: periodForDate(row.date, companyRow?.fiscalYearEndMonth ?? null),
    }));
  }
  // Provenance: every line item's calc log records how it arrived and, for
  // uploads, which stored source document it came from (evidence locker)
  inserts = inserts.map((i) => ({
    ...i,
    calcLog: {
      ...(i.calcLog as Record<string, unknown>),
      submitted_via: uploadedBy,
      ...(input.evidenceId ? { evidence_id: input.evidenceId } : {}),
    },
  }));
  const unmappedCount = inserts.filter((i) => i.status === "unmapped").length;

  // Count vendor-memory applications (the moat compounding, measurably)
  const usedMappingIds = [...new Set(
    inserts
      .map((i) => (i.calcLog as { vendor_mapping_id?: string }).vendor_mapping_id)
      .filter((id): id is string => Boolean(id))
  )];
  if (usedMappingIds.length > 0) {
    await db
      .update(vendorMappingsTable)
      .set({ timesApplied: sql`${vendorMappingsTable.timesApplied} + 1` })
      .where(inArray(vendorMappingsTable.id, usedMappingIds));
  }

  // Flagged rows always get human review — even on a locked pipeline
  if (unmappedCount > 0 && autoApproved) {
    autoApproved = false;
    reasons = [...reasons, `${unmappedCount} row(s) could not be mapped — routed to review`];
  }
  const sessionStatus = autoApproved ? "auto_approved" : "pending_review";

  if (inserts.length > 0) {
    await db.insert(emissionLineItems).values(inserts);
  }

  const sessionId = newId("is");
  await db.insert(intakeSessions).values({
    id: sessionId,
    companyId,
    uploadedBy,
    filename,
    dataType,
    sessionScore: String(score),
    status: sessionStatus,
    rowCount: inserts.length,
    mappingProfileId: profileId,
    evidenceId: input.evidenceId ?? null,
    createdAt: new Date().toISOString(),
  });

  if (autoApproved && !pipelineLocked) {
    await db
      .insert(pipelineStatus)
      .values({ companyId, status: "in_progress", updatedAt: new Date().toISOString() })
      .onConflictDoUpdate({
        target: pipelineStatus.companyId,
        set: { status: "in_progress", updatedAt: new Date().toISOString() },
        setWhere: eq(pipelineStatus.status, "not_started"),
      });
  }

  if (input.dataRequestId) {
    await markChecklistItemReceived(input.dataRequestId, input.checklistItemId ?? null);
  }

  return {
    imported: inserts.length,
    unmapped: unmappedCount,
    skipped: 0,
    profileId,
    sessionId,
    sessionStatus,
    sessionScore: score,
    autoApproved,
    reasons,
    pipelineLocked,
  };
}

async function markChecklistItemReceived(dataRequestId: string, checklistItemId: string | null) {
  const [request] = await db.select().from(dataRequests).where(eq(dataRequests.id, dataRequestId));
  if (!request) return;

  const checklist = (request.checklist as ChecklistItem[] | null) ?? [];
  const updated = checklist.map((item) =>
    checklistItemId === null || item.id === checklistItemId ? { ...item, status: "received" as const } : item
  );
  const fulfilled = checklistComplete(updated);

  await db
    .update(dataRequests)
    .set({
      checklist: updated,
      ...(fulfilled ? { status: "fulfilled", fulfilledAt: new Date().toISOString() } : {}),
    })
    .where(eq(dataRequests.id, dataRequestId));
}
