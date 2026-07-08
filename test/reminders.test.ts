import { describe, it, expect } from "vitest";
import { dueReminders } from "@/lib/reminders";

const NOW = new Date("2026-07-08T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

describe("dueReminders (portal nag schedule)", () => {
  it("nudges at 3, 7, and 14 days", () => {
    const due = dueReminders(
      [
        { id: "a", status: "open", createdAt: daysAgo(3), remindersSentAt: {} },
        { id: "b", status: "open", createdAt: daysAgo(7), remindersSentAt: { "3": "sent" } },
        { id: "c", status: "open", createdAt: daysAgo(14), remindersSentAt: { "3": "sent", "7": "sent" } },
      ],
      NOW
    );
    expect(due).toEqual([
      { id: "a", tier: 3, ccConsultant: false },
      { id: "b", tier: 7, ccConsultant: false },
      { id: "c", tier: 14, ccConsultant: true },
    ]);
  });

  it("sends only the highest overdue tier — a stale request gets one email, not three", () => {
    const due = dueReminders([{ id: "x", status: "open", createdAt: daysAgo(20), remindersSentAt: {} }], NOW);
    expect(due).toEqual([{ id: "x", tier: 14, ccConsultant: true }]);
  });

  it("never repeats a tier already sent", () => {
    const due = dueReminders(
      [{ id: "x", status: "open", createdAt: daysAgo(15), remindersSentAt: { "3": "s", "7": "s", "14": "s" } }],
      NOW
    );
    expect(due).toEqual([]);
  });

  it("skips fulfilled/cancelled requests and fresh ones", () => {
    const due = dueReminders(
      [
        { id: "f", status: "fulfilled", createdAt: daysAgo(10), remindersSentAt: {} },
        { id: "c", status: "cancelled", createdAt: daysAgo(10), remindersSentAt: {} },
        { id: "new", status: "open", createdAt: daysAgo(1), remindersSentAt: {} },
      ],
      NOW
    );
    expect(due).toEqual([]);
  });
});
