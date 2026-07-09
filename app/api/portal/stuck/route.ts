import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, consultantClients, dataRequests, userCompanies } from "@/lib/db/schema";
import { portalTokenValid } from "@/lib/portal";
import type { ChecklistItem } from "@/lib/portal";
import { sendClientStuckEmail } from "@/lib/email";

/** "I'm stuck — ask my consultant" (Plan T5.2): turns silent abandonment into
 *  an actionable flag. Token is the auth. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const token: string = body.token ?? "";
  const itemId: string = body.itemId ?? "";
  const message: string = String(body.message ?? "").trim().slice(0, 1000);

  if (!token) return NextResponse.json({ error: "Missing link token" }, { status: 401 });
  if (!message) return NextResponse.json({ error: "Tell us what's tripping you up" }, { status: 400 });

  const [dataRequest] = await db.select().from(dataRequests).where(eq(dataRequests.token, token));
  if (!dataRequest || !portalTokenValid({ token: dataRequest.token, expiresAt: dataRequest.expiresAt, status: dataRequest.status })) {
    return NextResponse.json({ error: "This link has expired" }, { status: 401 });
  }

  const checklist = (dataRequest.checklist as ChecklistItem[] | null) ?? [];
  const item = checklist.find((i) => i.id === itemId);
  if (!item) return NextResponse.json({ error: "Unknown checklist item" }, { status: 400 });

  const updated = checklist.map((i) => (i.id === itemId ? { ...i, stuckNote: message } : i));
  await db.update(dataRequests).set({ checklist: updated }).where(eq(dataRequests.id, dataRequest.id));

  // Notify the consultant who manages this client
  const [company, link] = await Promise.all([
    db.query.companies.findFirst({ where: eq(companies.id, dataRequest.companyId) }),
    db.query.consultantClients.findFirst({
      where: and(eq(consultantClients.companyId, dataRequest.companyId), isNull(consultantClients.archivedAt)),
    }),
  ]);
  if (link) {
    const consultant = await db.query.userCompanies.findFirst({ where: eq(userCompanies.clerkId, link.consultantId) });
    if (consultant?.email) {
      sendClientStuckEmail(
        consultant.email,
        consultant.name ?? "there",
        company?.name ?? "A client",
        item.label,
        message
      ).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
