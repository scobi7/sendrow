import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { dataRequests, locations } from "./db/schema";
import { generatePortalToken, portalExpiry, buildChecklist } from "./portal";
import { sendDataRequestEmail } from "./email";
import { getBrandForCompany } from "./branding";
import { logEvent } from "./events";

/** Site delegation links (Plan MO2): one location-scoped magic link per site,
 *  reusing the entire portal machinery. Shared by the consultant client page
 *  and the CFO portal - callers handle auth (Clerk or parent portal token). */

export type Location = typeof locations.$inferSelect;

export function siteLabel(loc: Pick<Location, "name" | "city" | "address">): string {
  return loc.name.trim() || loc.city.trim() || loc.address.trim() || "this site";
}

/** Creates the site's data-request link, or re-sends the existing open one
 *  (renewing it if expired). Returns the live token, or null on email-less
 *  send (the caller surfaces the link for manual sharing). */
export async function sendSiteLink(opts: {
  companyId: string;
  location: Location;
  requestedBy: string; // consultant clerk id, or "portal:<parentRequestId>"
  actorType: "consultant" | "supplier";
  parentRequestId?: string | null;
  dueDate?: string | null;
  periodLabel?: string | null;
}): Promise<{ token: string; created: boolean }> {
  const { companyId, location } = opts;
  const label = siteLabel(location);

  const existing = await db.query.dataRequests.findFirst({
    where: and(
      eq(dataRequests.companyId, companyId),
      eq(dataRequests.locationId, location.id),
      eq(dataRequests.status, "open")
    ),
    orderBy: desc(dataRequests.createdAt),
  });

  let token: string;
  let requestId: string;
  let created = false;

  if (existing?.token) {
    requestId = existing.id;
    token = existing.token;
    if (existing.expiresAt && new Date(existing.expiresAt) < new Date()) {
      token = generatePortalToken();
      await db.update(dataRequests).set({ token, expiresAt: portalExpiry() }).where(eq(dataRequests.id, existing.id));
    }
  } else {
    created = true;
    token = generatePortalToken();
    requestId = "dr_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    const description = `Facility data - ${label}`;
    await db.insert(dataRequests).values({
      id: requestId,
      companyId,
      requestedBy: opts.requestedBy,
      description,
      status: "open",
      dueDate: opts.dueDate ?? null,
      periodLabel: opts.periodLabel ?? null,
      createdAt: new Date().toISOString(),
      token,
      expiresAt: portalExpiry(),
      checklist: buildChecklist(["utility_bills"], description),
      remindersSentAt: {},
      locationId: location.id,
      parentRequestId: opts.parentRequestId ?? null,
    });
    logEvent({
      companyId,
      actor: opts.requestedBy,
      actorType: opts.actorType,
      verb: "request.created",
      subject: description,
      subjectId: requestId,
      meta: { locationId: location.id, delegated: opts.actorType === "supplier" },
    });
  }

  if (location.contactEmail) {
    const brand = await getBrandForCompany(companyId);
    const sent = await sendDataRequestEmail(
      location.contactEmail,
      location.contactName ?? "there",
      label,
      `Facility data for ${label} - utility bills for your site`,
      opts.dueDate ?? existing?.dueDate ?? null,
      token,
      brand ? { brandName: brand.brandName, replyTo: brand.replyTo } : null
    );
    logEvent({
      companyId,
      actor: "system",
      actorType: "system",
      verb: sent ? "email.sent" : "email.failed",
      subject: sent
        ? `Site link emailed to ${location.contactEmail} (${label})`
        : `Email to ${location.contactEmail} (${label}) did not send - copy the site link and share it directly`,
      subjectId: requestId,
    });
  }

  return { token, created };
}
