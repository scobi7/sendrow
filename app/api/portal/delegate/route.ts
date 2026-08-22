import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dataRequests, locations } from "@/lib/db/schema";
import { portalTokenValid } from "@/lib/portal";
import { sendSiteLink, siteLabel } from "@/lib/site-requests";

/** CFO delegation (Plan MO2): from the company-wide portal page, send each
 *  site's contact their own location-scoped upload link. The parent portal
 *  token is the auth - no account needed to coordinate. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const token: string = body.token ?? "";
  const locationId: string = body.locationId ?? "";
  const contactName = String(body.contactName ?? "").trim();
  const contactEmail = String(body.contactEmail ?? "").trim();
  const message = String(body.message ?? "").trim().slice(0, 500) || null;

  if (!token) return NextResponse.json({ error: "Missing link token" }, { status: 401 });

  const [parent] = await db.select().from(dataRequests).where(eq(dataRequests.token, token));
  if (!parent || !portalTokenValid({ token: parent.token, expiresAt: parent.expiresAt, status: parent.status })) {
    return NextResponse.json({ error: "This link has expired" }, { status: 401 });
  }
  // Only a company-wide request can delegate - site links don't fan out further
  if (parent.locationId) return NextResponse.json({ error: "This link is already site-specific" }, { status: 400 });

  const [loc] = await db.select().from(locations).where(eq(locations.id, locationId));
  if (!loc || loc.companyId !== parent.companyId) {
    return NextResponse.json({ error: "Unknown location" }, { status: 400 });
  }

  if (contactName || contactEmail) {
    await db
      .update(locations)
      .set({ ...(contactName ? { contactName } : {}), ...(contactEmail ? { contactEmail } : {}) })
      .where(eq(locations.id, locationId));
    if (contactName) loc.contactName = contactName;
    if (contactEmail) loc.contactEmail = contactEmail;
  }

  const { token: siteToken, created } = await sendSiteLink({
    companyId: parent.companyId,
    location: loc,
    requestedBy: `portal:${parent.id}`,
    actorType: "supplier",
    parentRequestId: parent.id,
    dueDate: parent.dueDate,
    periodLabel: parent.periodLabel,
    message,
  });

  return NextResponse.json({
    ok: true,
    created,
    emailed: Boolean(loc.contactEmail),
    // The CFO can always copy the link and share it directly (e.g. no email on file)
    link: `/portal/${siteToken}`,
    site: siteLabel(loc),
  });
}
