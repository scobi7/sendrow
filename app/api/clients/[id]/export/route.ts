import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import JSZip from "jszip";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import {
  auditLog,
  calcs,
  comments,
  companies,
  companyInputs,
  consultantClients,
  dataRequests,
  emissionLineItems,
  evidence,
  events,
  intakeSessions,
  locations,
  mappingProfiles,
  qbTransactions,
  scope3Screening,
  shareLinks,
  snapshots,
  utilityData,
  vendorMappings,
} from "@/lib/db/schema";

/** Full data export for one client (Plan EX1): "your data is yours" made
 *  real. Everything scoped to this companyId - inputs, calcs, the ledger,
 *  snapshots, the audit trail, comments, evidence metadata - as JSON, plus
 *  the original evidence files pulled from blob storage, all zipped.
 *  Consultant-of-this-client only (same guard pattern as every other
 *  client-scoped route). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;

  const user = await currentUser();
  if (!user || user.role !== "consultant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user.id),
      eq(consultantClients.companyId, companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [
    companyRows,
    inputsRows,
    locationRows,
    calcRows,
    qbTxnRows,
    utilityRows,
    eventRows,
    commentRows,
    auditRows,
    snapshotRows,
    mappingProfileRows,
    lineItemRows,
    intakeSessionRows,
    evidenceRows,
    dataRequestRows,
    vendorMappingRows,
    shareLinkRows,
    screeningRows,
  ] = await Promise.all([
    db.select().from(companies).where(eq(companies.id, companyId)),
    db.select().from(companyInputs).where(eq(companyInputs.companyId, companyId)),
    db.select().from(locations).where(eq(locations.companyId, companyId)),
    db.select().from(calcs).where(eq(calcs.companyId, companyId)),
    db.select().from(qbTransactions).where(eq(qbTransactions.companyId, companyId)),
    db.select().from(utilityData).where(eq(utilityData.companyId, companyId)),
    db.select().from(events).where(eq(events.companyId, companyId)),
    db.select().from(comments).where(eq(comments.companyId, companyId)),
    db.select().from(auditLog).where(eq(auditLog.companyId, companyId)),
    db.select().from(snapshots).where(eq(snapshots.companyId, companyId)),
    db.select().from(mappingProfiles).where(eq(mappingProfiles.companyId, companyId)),
    db.select().from(emissionLineItems).where(eq(emissionLineItems.companyId, companyId)),
    db.select().from(intakeSessions).where(eq(intakeSessions.companyId, companyId)),
    db.select().from(evidence).where(eq(evidence.companyId, companyId)),
    db.select().from(dataRequests).where(eq(dataRequests.companyId, companyId)),
    db.select().from(vendorMappings).where(eq(vendorMappings.companyId, companyId)),
    db.select().from(shareLinks).where(eq(shareLinks.companyId, companyId)),
    db.select().from(scope3Screening).where(eq(scope3Screening.companyId, companyId)),
  ]);

  if (!companyRows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const zip = new JSZip();
  zip.file(
    "data.json",
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        company: companyRows[0],
        inputs: inputsRows[0] ?? null,
        locations: locationRows,
        calcs: calcRows,
        qbTransactions: qbTxnRows,
        utilityData: utilityRows,
        auditTrail: eventRows,
        auditLog: auditRows,
        comments: commentRows,
        snapshots: snapshotRows,
        mappingProfiles: mappingProfileRows,
        emissionLineItems: lineItemRows,
        intakeSessions: intakeSessionRows,
        evidence: evidenceRows,
        dataRequests: dataRequestRows,
        vendorMappings: vendorMappingRows,
        shareLinks: shareLinkRows,
        scope3Screening: screeningRows,
      },
      null,
      2
    )
  );

  // Original evidence files, where the bytes were actually stored (blob token
  // was configured at upload time) - not just the hash/metadata already above.
  const evidenceFolder = zip.folder("evidence");
  const fetches = evidenceRows
    .filter((e) => e.blobUrl)
    .map(async (e) => {
      try {
        const res = await fetch(e.blobUrl!);
        if (!res.ok) return;
        const bytes = await res.arrayBuffer();
        const safeFilename = e.filename.replace(/[^\w.\- ]/g, "_");
        evidenceFolder?.file(`${e.id}-${safeFilename}`, bytes);
      } catch {
        // one failed file fetch never blocks the rest of the export
      }
    });
  await Promise.all(fetches);

  const content = await zip.generateAsync({ type: "nodebuffer" });
  const safeCompanyName = companyRows[0].name.replace(/[^\w.\- ]/g, "_");

  return new NextResponse(new Uint8Array(content), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeCompanyName}-sendrow-export.zip"`,
    },
  });
}
