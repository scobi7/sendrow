import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userCompanies, mappingProfiles, emissionLineItems } from "@/lib/db/schema";
import { applyProfile, rowToLineItem } from "@/lib/ingestion/ingest";
import { getFactorsFromDb } from "@/lib/factor-engine";
import type { ColumnMap } from "@/lib/ingestion/ingest";

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

  if (!rows.length) return NextResponse.json({ error: "No rows provided" }, { status: 400 });

  const profileId = newId("mp");
  await db.insert(mappingProfiles).values({
    id: profileId,
    companyId,
    name: profileName,
    columnMap,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  });

  const factors = await getFactorsFromDb();
  const normalized = applyProfile(rows, columnMap);

  const inserts = normalized
    .map((row) => rowToLineItem(row, factors, companyId, profileId))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (inserts.length > 0) {
    await db.insert(emissionLineItems).values(inserts);
  }

  return NextResponse.json({
    imported: inserts.length,
    skipped: rows.length - inserts.length,
    profileId,
  });
}
