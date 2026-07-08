import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dataRequests } from "@/lib/db/schema";
import { portalTokenValid } from "@/lib/portal";
import type { ChecklistItem } from "@/lib/portal";
import { processImport } from "@/lib/ingestion/import-core";
import { fuzzyMatchHeaders } from "@/lib/ingestion/fuzzy-match";
import { applyTemplate } from "@/lib/ingestion/data-type-templates";
import type { ColumnMap } from "@/lib/ingestion/ingest";

/** Magic-link submissions: the token is the auth. No Clerk session involved. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const token: string = body.token ?? "";
  const itemId: string = body.itemId ?? "";
  const rows: Record<string, string>[] = body.rows ?? [];
  const filename: string = body.filename ?? "portal upload";
  const source: "upload" | "entry" = body.source === "entry" ? "entry" : "upload";

  if (!token) return NextResponse.json({ error: "Missing link token" }, { status: 401 });
  if (!rows.length) return NextResponse.json({ error: "No rows provided" }, { status: 400 });

  const [dataRequest] = await db.select().from(dataRequests).where(eq(dataRequests.token, token));
  if (!dataRequest || !portalTokenValid({ token: dataRequest.token, expiresAt: dataRequest.expiresAt, status: dataRequest.status })) {
    return NextResponse.json({ error: "This link has expired — ask your consultant for a new one" }, { status: 401 });
  }

  const checklist = (dataRequest.checklist as ChecklistItem[] | null) ?? [];
  const item = checklist.find((i) => i.id === itemId);
  if (!item) return NextResponse.json({ error: "Unknown checklist item" }, { status: 400 });

  // Manual entry sends canonical fields; uploads get the data type's template + fuzzy match.
  // Clients never confirm mappings — low-confidence sessions auto-route to consultant review.
  let columnMap: ColumnMap;
  if (source === "entry") {
    columnMap = { date: "date", activity_type: "activity_type", quantity: "quantity", unit: "unit" };
  } else {
    const headers = Object.keys(rows[0] ?? {});
    const fuzzy = fuzzyMatchHeaders(headers);
    columnMap = applyTemplate(headers, item.dataType, fuzzy) as ColumnMap;
  }

  const outcome = await processImport({
    companyId: dataRequest.companyId,
    uploadedBy: `portal:${dataRequest.id}`,
    rows,
    columnMap,
    profileName: `Portal — ${item.label} (${filename})`,
    dataType: item.dataType,
    fuelPrices: null, // dollar-based fuel from the portal is flagged for the consultant, never guessed
    filename,
    dataRequestId: dataRequest.id,
    checklistItemId: item.id,
  });

  return NextResponse.json(outcome);
}
