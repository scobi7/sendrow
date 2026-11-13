"use server";

import { desc } from "drizzle-orm";
import { db } from "./db";
import { waitlistSignups, marketingEvents } from "./db/schema";

export async function getWaitlistStats() {
  const signups = await db
    .select()
    .from(waitlistSignups)
    .orderBy(desc(waitlistSignups.createdAt));

  const total = signups.length;
  const designPartners = signups.filter((s) => s.wantsDesignPartner).length;

  const events = await db.select().from(marketingEvents);
  const eventCounts = new Map<string, number>();
  for (const e of events) {
    eventCounts.set(e.eventName, (eventCounts.get(e.eventName) ?? 0) + 1);
  }

  return {
    total,
    designPartners,
    signups,
    eventCounts: Array.from(eventCounts.entries())
      .map(([eventName, count]) => ({ eventName, count }))
      .sort((a, b) => b.count - a.count),
  };
}
