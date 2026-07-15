import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dataRequests } from "@/lib/db/schema";
import { portalTokenValid } from "@/lib/portal";
import type { ChecklistItem } from "@/lib/portal";
import { processImport } from "@/lib/ingestion/import-core";
import { storeEvidence } from "@/lib/evidence";
import { headerFingerprint } from "@/lib/ingestion/fingerprint";
import { sendSubmissionEmail } from "@/lib/email";
import { and, isNull } from "drizzle-orm";
import { companies, consultantClients, userCompanies } from "@/lib/db/schema";
import { fuzzyMatchHeaders } from "@/lib/ingestion/fuzzy-match";
import { applyTemplate } from "@/lib/ingestion/data-type-templates";
import type { ColumnMap } from "@/lib/ingestion/ingest";

/** Magic-link submissions: the token is the auth. No Clerk session involved.
 *  Uploads arrive as multipart (original file kept for the evidence locker);
 *  manual entry arrives as JSON. */
export async function POST(request: NextRequest) {
  try {
    return await handleImport(request);
  } catch (e) {
    // Whatever happens, the portal gets JSON back - never an empty 500 that
    // surfaces as "Unexpected end of JSON input" for the supplier.
    console.error("portal/import failed:", e);
    return NextResponse.json(
      { error: "We couldn't process that submission. Please try again - if it keeps failing, type the numbers in instead." },
      { status: 500 }
    );
  }
}

async function handleImport(request: NextRequest) {
  let token = "";
  let itemId = "";
  let rows: Record<string, string>[] = [];
  let filename = "portal upload";
  let source: "upload" | "entry" = "upload";
  let fileBytes: Buffer | null = null;
  let confirmedMap: Record<string, string | null> | null = null;

  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await request.formData();
    token = String(form.get("token") ?? "");
    itemId = String(form.get("itemId") ?? "");
    source = form.get("source") === "entry" ? "entry" : "upload";
    try {
      rows = JSON.parse(String(form.get("rows") ?? "[]"));
    } catch {
      rows = [];
    }
    const file = form.get("file");
    if (file instanceof File) {
      filename = file.name || filename;
      fileBytes = Buffer.from(await file.arrayBuffer());
    }
    const rawMap = form.get("columnMap");
    if (typeof rawMap === "string" && rawMap) {
      try {
        confirmedMap = JSON.parse(rawMap);
      } catch {
        confirmedMap = null;
      }
    }
  } else {
    const body = await request.json();
    token = body.token ?? "";
    itemId = body.itemId ?? "";
    rows = body.rows ?? [];
    filename = body.filename ?? "portal upload";
    source = body.source === "entry" ? "entry" : "upload";
  }

  if (!token) return NextResponse.json({ error: "Missing link token" }, { status: 401 });
  if (!rows.length) return NextResponse.json({ error: "No rows provided" }, { status: 400 });

  const [dataRequest] = await db.select().from(dataRequests).where(eq(dataRequests.token, token));
  if (!dataRequest || !portalTokenValid({ token: dataRequest.token, expiresAt: dataRequest.expiresAt, status: dataRequest.status })) {
    return NextResponse.json({ error: "This link has expired - ask your consultant for a new one" }, { status: 401 });
  }

  const checklist = (dataRequest.checklist as ChecklistItem[] | null) ?? [];
  const item = checklist.find((i) => i.id === itemId);
  if (!item) return NextResponse.json({ error: "Unknown checklist item" }, { status: 400 });

  // Manual entry sends canonical fields; uploads get the data type's template + fuzzy match.
  // Clients never confirm mappings - low-confidence sessions auto-route to consultant review.
  let columnMap: ColumnMap;
  let mappingConfirmed = false;
  if (source === "entry") {
    columnMap = { date: "date", activity_type: "activity_type", quantity: "quantity", unit: "unit" };
  } else if (confirmedMap) {
    // The supplier confirmed this mapping on the preview screen (Plan T2)
    columnMap = Object.fromEntries(Object.entries(confirmedMap).filter(([, v]) => v)) as ColumnMap;
    mappingConfirmed = true;
  } else {
    const headers = Object.keys(rows[0] ?? {});
    const fuzzy = fuzzyMatchHeaders(headers);
    columnMap = applyTemplate(headers, item.dataType, fuzzy) as ColumnMap;
  }
  const fingerprint = source === "upload" ? headerFingerprint(Object.keys(rows[0] ?? {})) : null;

  let evidenceId: string | null = null;
  if (fileBytes) {
    evidenceId = await storeEvidence({
      bytes: fileBytes,
      filename,
      companyId: dataRequest.companyId,
      dataRequestId: dataRequest.id,
      checklistItemId: item.id,
      uploadedVia: "portal_upload",
    });
  }

  const outcome = await processImport({
    companyId: dataRequest.companyId,
    uploadedBy: `portal:${dataRequest.id}`,
    rows,
    columnMap,
    profileName: `Portal - ${item.label} (${filename})`,
    dataType: item.dataType,
    fuelPrices: null, // dollar-based fuel from the portal is flagged for the consultant, never guessed
    filename,
    dataRequestId: dataRequest.id,
    checklistItemId: item.id,
    evidenceId,
    headerFingerprint: fingerprint,
    mappingConfirmed,
  });

  // Response notification (U2.7): the consultant hears the moment data lands
  (async () => {
    const [company, link] = await Promise.all([
      db.query.companies.findFirst({ where: eq(companies.id, dataRequest.companyId) }),
      db.query.consultantClients.findFirst({
        where: and(eq(consultantClients.companyId, dataRequest.companyId), isNull(consultantClients.archivedAt)),
      }),
    ]);
    if (!link) return;
    const consultant = await db.query.userCompanies.findFirst({ where: eq(userCompanies.clerkId, link.consultantId) });
    if (!consultant?.email) return;
    await sendSubmissionEmail(
      consultant.email,
      consultant.name ?? "there",
      company?.name ?? "A client",
      filename,
      outcome.imported,
      outcome.unmapped,
      dataRequest.companyId,
      outcome.autoApproved
    );
  })().catch(() => {});

  return NextResponse.json(outcome);
}
