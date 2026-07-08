import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { userCompanies, consultantClients, companies } from "@/lib/db/schema";
import { processImport } from "@/lib/ingestion/import-core";
import { sendUploadNeedsReviewEmail } from "@/lib/email";
import type { ColumnMap, FuelPrices } from "@/lib/ingestion/ingest";
import type { DataType } from "@/lib/ingestion/data-type-templates";

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

  const outcome = await processImport({
    companyId,
    uploadedBy: userId,
    rows,
    columnMap,
    profileName,
    dataType,
    fuelPrices,
    filename,
  });

  // Notify the reviewing consultant — fire-and-forget, never blocks the upload
  if (outcome.sessionStatus === "pending_review") {
    notifyConsultantOfReview(companyId, filename, outcome.unmapped).catch(() => {});
  }

  return NextResponse.json(outcome);
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
