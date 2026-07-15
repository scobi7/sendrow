/** Automatic chasing (#21), deadline-relative: nudge at 7 days out, 2 days
 *  out, day-of, and 3 days overdue (consultant CC'd on overdue). Requests
 *  without a due date fall back to the age-based 3/7/14 schedule. Each tier
 *  fires once; submission (status != open) stops everything instantly. */

export type ReminderRequest = {
  id: string;
  status: string;
  createdAt: string;
  dueDate?: string | null;
  remindersEnabled?: boolean;
  remindersSentAt: Partial<Record<string, string>> | null;
};

export type DueReminder = { id: string; tier: string; daysUntilDue: number | null; ccConsultant: boolean };

const DAY = 86_400_000;

/** Deadline tiers: key → days BEFORE due date (negative = after). */
const DUE_TIERS: [string, number, boolean][] = [
  ["due-7", 7, false],
  ["due-2", 2, false],
  ["due-0", 0, false],
  ["overdue", -3, true],
];

/** Age tiers for requests without a due date: key → days since created. */
const AGE_TIERS: [string, number, boolean][] = [
  ["3", 3, false],
  ["7", 7, false],
  ["14", 14, true],
];

export function dueReminders(requests: ReminderRequest[], now: Date = new Date()): DueReminder[] {
  const out: DueReminder[] = [];
  for (const req of requests) {
    if (req.status !== "open") continue;
    if (req.remindersEnabled === false) continue;
    const sent = req.remindersSentAt ?? {};

    if (req.dueDate) {
      const due = new Date(req.dueDate + "T12:00:00Z").getTime();
      const daysUntil = Math.floor((due - now.getTime()) / DAY);
      // highest applicable unsent tier only - a stale request gets one email, not four
      for (const [tier, daysBefore, cc] of [...DUE_TIERS].reverse()) {
        if (daysUntil <= daysBefore && !sent[tier]) {
          out.push({ id: req.id, tier, daysUntilDue: daysUntil, ccConsultant: cc });
          break;
        }
      }
    } else {
      const age = Math.floor((now.getTime() - new Date(req.createdAt).getTime()) / DAY);
      for (const [tier, minAge, cc] of [...AGE_TIERS].reverse()) {
        if (age >= minAge && !sent[tier]) {
          out.push({ id: req.id, tier, daysUntilDue: null, ccConsultant: cc });
          break;
        }
      }
    }
  }
  return out;
}
