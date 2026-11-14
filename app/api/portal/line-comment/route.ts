import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { comments, emissionLineItems } from "@/lib/db/schema";
import { logEvent } from "@/lib/events";
import { checkRateLimit } from "@/lib/ratelimit";
import { uid } from "@/lib/store";
import { loadPortalRequest, readJsonBody } from "@/lib/portal-api";

/** Supplier reply to a consultant's question on a specific figure (Z2). The
 *  token is the auth - no account. The reply posts as a comment on the line
 *  item, so the consultant sees it in the ledger/review in context. */
export async function POST(request: NextRequest) {
  const body = await readJsonBody(request);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  const token: string = body.token ?? "";
  const lineItemId: string = body.lineItemId ?? "";
  const message = String(body.message ?? "").trim().slice(0, 2000);

  if (!token) return NextResponse.json({ error: "Missing link token" }, { status: 401 });
  if (!checkRateLimit(`portal:line-comment:${token}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many replies sent. Try again later" }, { status: 429 });
  }
  if (!message) return NextResponse.json({ error: "Write a reply first" }, { status: 400 });

  const dataRequest = await loadPortalRequest(token);
  if (!dataRequest) {
    return NextResponse.json({ error: "This link has expired" }, { status: 401 });
  }

  // The line item must belong to this request's company (token scope).
  const [line] = await db
    .select({ id: emissionLineItems.id })
    .from(emissionLineItems)
    .where(and(eq(emissionLineItems.id, lineItemId), eq(emissionLineItems.companyId, dataRequest.companyId)));
  if (!line) return NextResponse.json({ error: "Unknown figure" }, { status: 400 });

  await db.insert(comments).values({
    id: uid("cm_"),
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
