/** Pure reminder-selection logic for open data requests (Plan J Phase 2).
 *  Nudges the client at 3, 7, and 14 days after the request was created;
 *  the 14-day reminder CCs the consultant. Each tier fires at most once. */

export const REMINDER_TIERS = [3, 7, 14] as const;
export type ReminderTier = (typeof REMINDER_TIERS)[number];

export type ReminderCandidate = {
  id: string;
  status: string;
  createdAt: string;
  remindersSentAt: Partial<Record<string, string>> | null;
};

export type DueReminder = { id: string; tier: ReminderTier; ccConsultant: boolean };

export function dueReminders(requests: ReminderCandidate[], now: Date = new Date()): DueReminder[] {
  const due: DueReminder[] = [];
  for (const req of requests) {
    if (req.status !== "open") continue;
    const ageDays = (now.getTime() - new Date(req.createdAt).getTime()) / 86_400_000;
    const sent = req.remindersSentAt ?? {};
    // Only the highest overdue tier not yet sent — a stale request doesn't get
    // three emails in one cron run.
    const tier = [...REMINDER_TIERS].reverse().find((t) => ageDays >= t && !sent[String(t)]);
    if (tier) due.push({ id: req.id, tier, ccConsultant: tier === 14 });
  }
  return due;
}
