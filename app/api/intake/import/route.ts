import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { userCompanies, mappingProfiles, emissionLineItems, intakeSessions, pipelineStatus, consultantClients, companies } from "@/lib/db/schema";
import { sendUploadNeedsReviewEmail } from "@/lib/email";
import { applyProfile, rowToLineItem, fleetFuelToLineItems } from "@/lib/ingestion/ingest";
import { getFactorsFromDb } from "@/lib/factor-engine";
import { fuzzyMatchHeaders } from "@/lib/ingestion/fuzzy-match";
import { scoreSession } from "@/lib/ingestion/session-score";
import type { ColumnMap, FuelPrices } from "@/lib/ingestion/ingest";
import type { DataType } from "@/lib/ingestion/data-type-templates";

function newId(prefix: string) {
  return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

async function notifyConsultantOfReview(companyId: string, filename: string, unmappedCount: number) {
  const link = await db.query.consultantClients.findFirst({
    where: and(eq(consultantClients.companyId, companyId), isNull(consultantClients.archivedAt)),
  });
  if (!link) return;
  const [consultant, [company]] = await Promise.all([
    db.query.userCompanies.findFirst({ where: eq(userCompanies.clerkId, link.consultantId) }),
    db.select({ name: companies.name }).from(companies).where(eq(companies.id, companyId)),
  ]);
  if (!consultant?.email || !company) return;
  await sendUploadNeedsReviewEmail(consultant.email, consultant.name ?? "there", company.name, filename, unmappedCount);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [userRecord] = await db
    .select({ companyId: userCompanies.companyId })
    .from(userCompanies)
    .where(eq(userCompanies.clerkId, userId));

  if (!userRecord?.companyId) {
    return NextResponse.json({ error: "No company found" }, { status: 400 });
  }
  const companyId = userRecord.companyId;

  const body = await request.json();
  const rows: Record<string, string>[] = body.rows ?? [];
  const columnMap: ColumnMap = body.columnMap ?? {};
  const profileName: string = body.profileName ?? "Untitled profile";
  const dataType: DataType = body.dataType ?? "custom";
  const fuelPrices: FuelPrices | null = body.fuelPrices ?? null;
  const filename: string = body.filename ?? "upload";

  if (!rows.length) return NextResponse.json({ error: "No rows provided" }, { status: 400 });

  // Check if pipeline is locked — skip mapping step, auto-approve
  const [pipeline] = await db
    .select()
    .from(pipelineStatus)
    .where(eq(pipelineStatus.companyId, companyId));
  const pipelineLocked = pipeline?.status === "locked";

  // Score the session
  const headers = Object.keys(rows[0] ?? {});
  const matchResults = fuzzyMatchHeaders(headers);
  const scored = pipelineLocked
    ? { score: 1, autoApproved: true, reasons: ["pipeline locked"] }
    : scoreSession(dataType, matchResults);
  const { score } = scored;
  let { autoApproved, reasons } = scored;

  // Save mapping profile
  const profileId = newId("mp");
  await db.insert(mappingProfiles).values({
    id: profileId,
    companyId,
    name: profileName,
    columnMap: { ...columnMap, _dataType: dataType },
    effectiveFrom: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  });

  // Process line items
  const factors = await getFactorsFromDb();
  const normalized = applyProfile(rows, columnMap);

  // Every row becomes a line item — unmappable rows are flagged, never dropped
  let inserts;
  if (dataType === "fleet_fuel_dollar" && fuelPrices) {
    inserts = fleetFuelToLineItems(normalized, factors, fuelPrices, companyId, profileId);
  } else {
    inserts = normalized.map((row) => rowToLineItem(row, factors, companyId, profileId));
  }
  const unmappedCount = inserts.filter((i) => i.status === "unmapped").length;

  // Flagged rows always get human review — even on a locked pipeline
  if (unmappedCount > 0 && autoApproved) {
    autoApproved = false;
    reasons = [...reasons, `${unmappedCount} row(s) could not be mapped — routed to review`];
  }
  const sessionStatus = autoApproved ? "auto_approved" : "pending_review";

  if (inserts.length > 0) {
    await db.insert(emissionLineItems).values(inserts);
  }

  // Create intake session record
  const sessionId = newId("is");
  await db.insert(intakeSessions).values({
    id: sessionId,
    companyId,
    uploadedBy: userId,
    filename,
    dataType,
    sessionScore: String(score),
    status: sessionStatus,
    rowCount: inserts.length,
    mappingProfileId: profileId,
    createdAt: new Date().toISOString(),
  });

  // Notify the reviewing consultant — fire-and-forget, never blocks the upload
  if (sessionStatus === "pending_review") {
    notifyConsultantOfReview(companyId, filename, unmappedCount).catch(() => {});
  }

  // Advance pipeline status if auto-approved and not already locked
  if (autoApproved && !pipelineLocked) {
    await db
      .insert(pipelineStatus)
      .values({
        companyId,
        status: "in_progress",
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: pipelineStatus.companyId,
        set: { status: "in_progress", updatedAt: new Date().toISOString() },
        setWhere: eq(pipelineStatus.status, "not_started"),
      });
  }

  return NextResponse.json({
    imported: inserts.length,
    unmapped: unmappedCount,
    skipped: 0, // invariant: no rows are ever dropped
    profileId,
    sessionId,
    sessionStatus,
    sessionScore: score,
    autoApproved,
    reasons,
    pipelineLocked,
  });
}
