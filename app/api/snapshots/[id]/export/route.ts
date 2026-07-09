import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, consultantClients, snapshots } from "@/lib/db/schema";
import { currentUser } from "@/lib/auth";
import { FORMATS } from "@/lib/formats";
import type { SnapshotForExport, FrozenLineItem } from "@/lib/formats";
import type { SnapshotTotals } from "@/lib/snapshots";

/** Reshaping engine endpoint (Plan T4): one frozen snapshot → any format.
 *  Consultant-of-this-client only. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") ?? "excel";
  const builder = FORMATS[format];
  if (!builder) return NextResponse.json({ error: `Unknown format "${format}"` }, { status: 400 });

  const user = await currentUser();
  if (!user || user.role !== "consultant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snap = await db.query.snapshots.findFirst({ where: eq(snapshots.id, id) });
  if (!snap) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user.id),
      eq(consultantClients.companyId, snap.companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const company = await db.query.companies.findFirst({ where: eq(companies.id, snap.companyId) });
  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const snapshotForExport: SnapshotForExport = {
    id: snap.id,
    label: snap.label,
    createdAt: snap.createdAt,
    sha256: snap.sha256,
    itemCount: snap.itemCount,
    totals: snap.totals as SnapshotTotals,
    lineItems: snap.lineItems as FrozenLineItem[],
  };

  const file = builder.build(snapshotForExport, {
    name: company.name,
    industry: company.industry,
    headcountRange: company.headcountRange,
  });

  return new NextResponse(new Uint8Array(file.content), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
    },
  });
}
