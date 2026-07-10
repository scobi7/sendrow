import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultantClients, events } from "@/lib/db/schema";
import { currentUser } from "@/lib/auth";

/** Audit-log export (U1.3): auditors want a readable CSV, not database rows. */
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get("companyId") ?? "";
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

  const rows = await db.select().from(events).where(eq(events.companyId, companyId)).orderBy(desc(events.ts));

  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    "timestamp,actor_type,actor,event,subject,details",
    ...rows.map((e) =>
      [e.ts, e.actorType, e.actor, e.verb, e.subject, e.meta ? JSON.stringify(e.meta) : ""].map(esc).join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="audit-log-${companyId}.csv"`,
    },
  });
}
