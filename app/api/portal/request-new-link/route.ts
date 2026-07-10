import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, consultantClients, dataRequests, userCompanies } from "@/lib/db/schema";
import { logEvent } from "@/lib/events";
import { sendNewLinkRequestEmail } from "@/lib/email";

/** The expired page's "request a new link" (U1.2): an expired token can't do
 *  anything EXCEPT ask the consultant for a fresh one. No dead ends. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const token: string = body.token ?? "";
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const [req] = await db.select().from(dataRequests).where(eq(dataRequests.token, token));
  if (!req || req.status === "cancelled") {
    return NextResponse.json({ error: "This request is no longer active" }, { status: 404 });
  }

  const [company, link] = await Promise.all([
    db.query.companies.findFirst({ where: eq(companies.id, req.companyId) }),
    db.query.consultantClients.findFirst({
      where: and(eq(consultantClients.companyId, req.companyId), isNull(consultantClients.archivedAt)),
    }),
  ]);

  if (link) {
    const consultant = await db.query.userCompanies.findFirst({ where: eq(userCompanies.clerkId, link.consultantId) });
    if (consultant?.email) {
      sendNewLinkRequestEmail(
        consultant.email,
        consultant.name ?? "there",
        company?.name ?? "A client",
        req.description,
        req.companyId
      ).catch(() => {});
    }
  }

  logEvent({
    companyId: req.companyId,
    actor: `portal:${req.id}`,
    actorType: "supplier",
    verb: "request.link_requested",
    subject: req.description,
    subjectId: req.id,
  });

  return NextResponse.json({ ok: true });
}
