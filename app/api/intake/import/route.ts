import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userCompanies, mappingProfiles, emissionLineItems, intakeSessions, pipelineStatus } from "@/lib/db/schema";
import { applyProfile, rowToLineItem, fleetFuelToLineItems } from "@/lib/ingestion/ingest";
import { getFactorsFromDb } from "@/lib/factor-engine";
import { fuzzyMatchHeaders } from "@/lib/ingestion/fuzzy-match";
import { scoreSession } from "@/lib/ingestion/session-score";
import type { ColumnMap, FuelPrices } from "@/lib/ingestion/ingest";
import type { DataType } from "@/lib/ingestion/data-type-templates";

function newId(prefix: string) {
  return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
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
  const { score, autoApproved, reasons } = pipelineLocked
    ? { score: 1, autoApproved: true, reasons: ["pipeline locked"] }
    : scoreSession(dataType, matchResults);

  const sessionStatus = autoApproved ? "auto_approved" : "pending_review";

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

  let inserts;
  if (dataType === "fleet_fuel_dollar" && fuelPrices) {
    inserts = fleetFuelToLineItems(normalized, factors, fuelPrices, companyId, profileId);
  } else {
    inserts = normalized
      .map((row) => rowToLineItem(row, factors, companyId, profileId))
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

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
    skipped: rows.length - inserts.length,
    profileId,
    sessionId,
    sessionStatus,
    sessionScore: score,
    autoApproved,
    reasons,
    pipelineLocked,
  });
}
