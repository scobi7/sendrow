import { describe, it, expect } from "vitest";
import { dueReminders } from "@/lib/reminders";

const NOW = new Date("2026-07-10T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const dueIn = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString().slice(0, 10);

describe("dueReminders — deadline-relative chasing (#21)", () => {
  it("nudges at 7 days out, 2 out, day-of, and overdue (consultant CC'd)", () => {
    const base = { status: "open", createdAt: daysAgo(10), remindersSentAt: {} };
    expect(dueReminders([{ ...base, id: "a", dueDate: dueIn(7) }], NOW)).toEqual([
      { id: "a", tier: "due-7", daysUntilDue: 7, ccConsultant: false },
    ]);
    expect(dueReminders([{ ...base, id: "b", dueDate: dueIn(2), remindersSentAt: { "due-7": "s" } }], NOW)).toEqual([
      { id: "b", tier: "due-2", daysUntilDue: 2, ccConsultant: false },
    ]);
    expect(dueReminders([{ ...base, id: "c", dueDate: dueIn(0), remindersSentAt: { "due-7": "s", "due-2": "s" } }], NOW)[0].tier).toBe("due-0");
    const overdue = dueReminders([{ ...base, id: "d", dueDate: dueIn(-4), remindersSentAt: { "due-7": "s", "due-2": "s", "due-0": "s" } }], NOW);
    expect(overdue).toEqual([{ id: "d", tier: "overdue", daysUntilDue: -4, ccConsultant: true }]);
  });

  it("sends only the highest applicable unsent tier — never four emails at once", () => {
    const due = dueReminders(
      [{ id: "x", status: "open", createdAt: daysAgo(30), dueDate: dueIn(-10), remindersSentAt: {} }],
      NOW
    );
    expect(due).toHaveLength(1);
    expect(due[0].tier).toBe("overdue");
  });

  it("per-request kill switch stops all chasing", () => {
    expect(
      dueReminders([{ id: "x", status: "open", createdAt: daysAgo(30), dueDate: dueIn(-10), remindersEnabled: false, remindersSentAt: {} }], NOW)
    ).toEqual([]);
  });

  it("submission stops reminders instantly", () => {
    expect(
      dueReminders([{ id: "x", status: "fulfilled", createdAt: daysAgo(30), dueDate: dueIn(-1), remindersSentAt: {} }], NOW)
    ).toEqual([]);
  });

  it("no due date falls back to the 3/7/14 age schedule", () => {
    const due = dueReminders(
      [
        { id: "a", status: "open", createdAt: daysAgo(3), remindersSentAt: {} },
        { id: "b", status: "open", createdAt: daysAgo(15), remindersSentAt: { "3": "s", "7": "s" } },
        { id: "new", status: "open", createdAt: daysAgo(1), remindersSentAt: {} },
      ],
      NOW
    );
    expect(due).toEqual([
      { id: "a", tier: "3", daysUntilDue: null, ccConsultant: false },
      { id: "b", tier: "14", daysUntilDue: null, ccConsultant: true },
    ]);
  });
});
