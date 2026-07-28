import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { comments, dataRequests, emissionLineItems } from "@/lib/db/schema";
import { portalTokenValid } from "@/lib/portal";
import { logEvent } from "@/lib/events";

/** Supplier reply to a consultant's question on a specific figure (Z2). The
 *  token is the auth - no account. The reply posts as a comment on the line
 *  item, so the consultant sees it in the ledger/review in context. */
export async function POST(request: NextRequest) {
  let body: { token?: string; lineItemId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const token = body.token ?? "";
  const lineItemId = body.lineItemId ?? "";
  const message = String(body.message ?? "").trim().slice(0, 2000);

  if (!token) return NextResponse.json({ error: "Missing link token" }, { status: 401 });
  if (!message) return NextResponse.json({ error: "Write a reply first" }, { status: 400 });

  const [dataRequest] = await db.select().from(dataRequests).where(eq(dataRequests.token, token));
  if (!dataRequest || !portalTokenValid({ token: dataRequest.token, expiresAt: dataRequest.expiresAt, status: dataRequest.status })) {
    return NextResponse.json({ error: "This link has expired" }, { status: 401 });
  }

  // The line item must belong to this request's company (token scope).
  const [line] = await db
    .select({ id: emissionLineItems.id })
    .from(emissionLineItems)
    .where(and(eq(emissionLineItems.id, lineItemId), eq(emissionLineItems.companyId, dataRequest.companyId)));
  if (!line) return NextResponse.json({ error: "Unknown figure" }, { status: 400 });

  await db.insert(comments).values({
    id: "cm_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
    companyId: dataRequest.companyId,
    lineItemId,
    author: `portal:${dataRequest.id}`,
    authorType: "supplier",
    body: message,
    createdAt: new Date().toISOString(),
  });
  logEvent({ companyId: dataRequest.companyId, actor: `portal:${dataRequest.id}`, actorType: "supplier", verb: "comment.added", subject: "reply to consultant question", subjectId: lineItemId });

  return NextResponse.json({ ok: true });
}
