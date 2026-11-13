import { NextRequest, NextResponse } from "next/server";
import { sendNewLinkRequestEmail } from "@/lib/email";
import { logEvent } from "@/lib/events";
import { checkRateLimit } from "@/lib/ratelimit";
import { findPortalRequest, notifyConsultant, readJsonBody } from "@/lib/portal-api";

/** The expired page's "request a new link" (U1.2): an expired token can't do
 *  anything EXCEPT ask the consultant for a fresh one. No dead ends. */
export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  const token: string = body.token ?? "";
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (!checkRateLimit(`portal:request-new-link:${token}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Already asked recently - check your email or wait a bit" }, { status: 429 });
  }

  // findPortalRequest, not loadPortalRequest: this route must accept expired tokens
  const dataRequest = await findPortalRequest(token);
  if (!dataRequest || dataRequest.status === "cancelled") {
    return NextResponse.json({ error: "This request is no longer active" }, { status: 404 });
  }

  await notifyConsultant(dataRequest.companyId, (consultant, companyName) =>
    sendNewLinkRequestEmail(
      consultant.email,
      consultant.name,
      companyName,
      dataRequest.description,
      dataRequest.companyId
    )
  );

  logEvent({
    companyId: dataRequest.companyId,
    actor: `portal:${dataRequest.id}`,
    actorType: "supplier",
    verb: "request.link_requested",
    subject: dataRequest.description,
    subjectId: dataRequest.id,
  });

  return NextResponse.json({ ok: true });
}
