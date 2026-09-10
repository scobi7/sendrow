"use server";

import { sql, desc } from "drizzle-orm";
import { db } from "./db";
import { waitlistSignups, marketingEvents } from "./db/schema";
import { uid } from "./store";
import { clientIp, checkRateLimit } from "./ratelimit";
import { normalizeEmail, isValidEmail } from "./waitlist-validation";

export type WaitlistSource = "hero" | "partner";
export type SubmitWaitlistResult = { ok: true } | { ok: false; error: string };

export async function submitWaitlist(
  rawEmail: string,
  source: WaitlistSource,
  wantsDesignPartner: boolean
): Promise<SubmitWaitlistResult> {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const ip = await clientIp();
  if (!checkRateLimit(`waitlist:${ip}`, 5, 60 * 60 * 1000)) {
    return { ok: false, error: "Too many attempts. Try again in a bit." };
  }

  await db
    .insert(waitlistSignups)
    .values({
      id: uid("wl_"),
      email,
      wantsDesignPartner,
      source,
      createdAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: waitlistSignups.email,
      set: {
        wantsDesignPartner: sql`${waitlistSignups.wantsDesignPartner} OR excluded.wants_design_partner`,
      },
    });

  return { ok: true };
}

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
