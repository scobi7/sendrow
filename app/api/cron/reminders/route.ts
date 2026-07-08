import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { dataRequests, userCompanies, companies, consultantClients } from "@/lib/db/schema";
import { dueReminders } from "@/lib/reminders";
import { sendPortalReminderEmail } from "@/lib/email";

/** Daily cron (vercel.json): nudges clients with open data requests. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const open = await db.select().from(dataRequests).where(eq(dataRequests.status, "open"));
  const due = dueReminders(
    open.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      remindersSentAt: r.remindersSentAt as Partial<Record<string, string>> | null,
    }))
  );

  let sent = 0;
  for (const reminder of due) {
    const req = open.find((r) => r.id === reminder.id)!;
    if (!req.token) continue; // pre-portal requests have no magic link to remind about

    const [clientUser, [company]] = await Promise.all([
      db.query.userCompanies.findFirst({
        where: and(eq(userCompanies.companyId, req.companyId), eq(userCompanies.role, "company")),
      }),
      db.select({ name: companies.name }).from(companies).where(eq(companies.id, req.companyId)),
    ]);
    if (!clientUser?.email || !company) continue;

    let consultantEmail: string | null = null;
    if (reminder.ccConsultant) {
      const link = await db.query.consultantClients.findFirst({
        where: and(eq(consultantClients.companyId, req.companyId), isNull(consultantClients.archivedAt)),
      });
      if (link) {
        const consultant = await db.query.userCompanies.findFirst({
          where: eq(userCompanies.clerkId, link.consultantId),
        });
        consultantEmail = consultant?.email ?? null;
      }
    }

    try {
      await sendPortalReminderEmail(
        clientUser.email,
        clientUser.name ?? "there",
        company.name,
        req.description,
        req.token,
        reminder.tier,
        consultantEmail
      );
      const sentMap = (req.remindersSentAt as Record<string, string> | null) ?? {};
      await db
        .update(dataRequests)
        .set({ remindersSentAt: { ...sentMap, [String(reminder.tier)]: new Date().toISOString() } })
        .where(eq(dataRequests.id, req.id));
      sent++;
    } catch {
      // one failed send never blocks the rest of the batch
    }
  }

  return NextResponse.json({ open: open.length, due: due.length, sent });
}
