import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { evidence, consultantClients } from "@/lib/db/schema";
import { currentUser } from "@/lib/auth";

/** Source-document download (evidence locker). Only the consultant managing
 *  the client may fetch it — blob URLs never appear in any UI directly. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || user.role !== "consultant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await db.query.evidence.findFirst({ where: eq(evidence.id, id) });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user.id),
      eq(consultantClients.companyId, row.companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!row.blobUrl) {
    return NextResponse.json(
      { error: "File bytes were not stored (blob storage unconfigured at upload time)", sha256: row.sha256, filename: row.filename },
      { status: 404 }
    );
  }

  return NextResponse.redirect(row.blobUrl);
}
