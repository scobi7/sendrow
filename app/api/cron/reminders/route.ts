import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { dataRequests, userCompanies, companies, consultantClients } from "@/lib/db/schema";
import { dueReminders } from "@/lib/reminders";
import { sendPortalReminderEmail } from "@/lib/email";
import { getBrandForCompany } from "@/lib/branding";

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
      dueDate: r.dueDate,
      remindersEnabled: r.remindersEnabled,
      remindersSentAt: r.remindersSentAt as Partial<Record<string, string>> | null,
    }))
  );

  let sent = 0;
  for (const reminder of due) {
    const req = open.find((r) => r.id === reminder.id)!;
    if (!req.token) continue; // pre-portal requests have no magic link to remind about

    const company = await db.query.companies.findFirst({ where: eq(companies.id, req.companyId) });
    if (!company?.clientContactEmail) continue; // no contact on file - nothing to remind

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
        company.clientContactEmail,
        company.clientContactName ?? "there",
        company.name,
        req.description,
        req.token,
        reminder,
        consultantEmail,
        await getBrandForCompany(req.companyId)
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
