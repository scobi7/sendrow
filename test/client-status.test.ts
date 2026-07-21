import { describe, expect, it } from "vitest";
import { workflowStatus, nextDueDate, completenessPercent, pipelineStage, isOverdue } from "../lib/client-status";
import type { ChecklistItem } from "../lib/portal";

const item = (status: "pending" | "received", stuckNote?: string): ChecklistItem => ({
  id: "item_1",
  dataType: "custom",
  label: "Data",
  instructions: "",
  status,
  ...(stuckNote ? { stuckNote } : {}),
});

const NOW = new Date("2026-07-13T12:00:00Z");

describe("workflowStatus (#19 dashboard badge)", () => {
  it("pending review wins over everything", () => {
    expect(
      workflowStatus(
        { openRequests: [{ dueDate: "2026-07-01", checklist: null }], pendingReviewCount: 2, hasSnapshot: true, hasFulfilledRequest: true },
        NOW
      )
    ).toBe("ready_for_review");
  });

  it("open request past due is overdue", () => {
    expect(
      workflowStatus(
        { openRequests: [{ dueDate: "2026-07-10", checklist: null }], pendingReviewCount: 0, hasSnapshot: false, hasFulfilledRequest: false },
        NOW
      )
    ).toBe("overdue");
  });

  it("due today is not yet overdue", () => {
    expect(
      workflowStatus(
        { openRequests: [{ dueDate: "2026-07-13", checklist: null }], pendingReviewCount: 0, hasSnapshot: false, hasFulfilledRequest: false },
        NOW
      )
    ).toBe("awaiting_reply");
  });

  it("open request in the future is awaiting reply", () => {
    expect(
      workflowStatus(
        { openRequests: [{ dueDate: "2026-08-03", checklist: null }], pendingReviewCount: 0, hasSnapshot: false, hasFulfilledRequest: false },
        NOW
      )
    ).toBe("awaiting_reply");
  });

  it("nothing open + a snapshot means approved", () => {
    expect(
      workflowStatus({ openRequests: [], pendingReviewCount: 0, hasSnapshot: true, hasFulfilledRequest: false }, NOW)
    ).toBe("approved");
  });

  it("brand-new client has no status", () => {
    expect(
      workflowStatus({ openRequests: [], pendingReviewCount: 0, hasSnapshot: false, hasFulfilledRequest: false }, NOW)
    ).toBe("none");
  });
});

describe("nextDueDate", () => {
  it("returns the earliest open due date", () => {
    expect(
      nextDueDate({
        openRequests: [
          { dueDate: "2026-08-03", checklist: null },
          { dueDate: "2026-07-28", checklist: null },
          { dueDate: null, checklist: null },
        ],
        pendingReviewCount: 0,
        hasSnapshot: false,
        hasFulfilledRequest: false,
      })
    ).toBe("2026-07-28");
  });

  it("null when nothing has a due date", () => {
    expect(
      nextDueDate({ openRequests: [{ dueDate: null, checklist: null }], pendingReviewCount: 0, hasSnapshot: false, hasFulfilledRequest: false })
    ).toBeNull();
  });
});

describe("completenessPercent (6.7 meter)", () => {
  it("counts received across open checklists", () => {
    expect(
      completenessPercent({
        openRequests: [
          { dueDate: null, checklist: [item("received"), item("pending")] },
          { dueDate: null, checklist: [item("received"), item("received"), item("pending")] },
        ],
        pendingReviewCount: 0,
        hasSnapshot: false,
        hasFulfilledRequest: false,
      })
    ).toBe(60);
  });

  it("100 when nothing open but data was approved before", () => {
    expect(
      completenessPercent({ openRequests: [], pendingReviewCount: 0, hasSnapshot: true, hasFulfilledRequest: false })
    ).toBe(100);
  });

  it("0 for a brand-new client", () => {
    expect(
      completenessPercent({ openRequests: [], pendingReviewCount: 0, hasSnapshot: false, hasFulfilledRequest: false })
    ).toBe(0);
  });

  it("never resets to 0% when a new request lands on a finished client (X1.3, feedback #8)", () => {
    expect(
      completenessPercent({
        openRequests: [{ dueDate: null, checklist: [item("pending")] }],
        fulfilledRequests: [{ checklist: [item("received"), item("received")] }],
        pendingReviewCount: 0,
        hasSnapshot: true,
        hasFulfilledRequest: true,
      })
    ).toBe(67);
  });
});

describe("pipelineStage (Y1 CRM board column)", () => {
  const base = { pendingReviewCount: 0, hasSnapshot: false, hasFulfilledRequest: false };

  it("no requests and no history -> new", () => {
    expect(pipelineStage({ openRequests: [], ...base })).toBe("new");
  });

  it("open request, nothing received -> requested", () => {
    expect(
      pipelineStage({ openRequests: [{ dueDate: "2026-08-01", checklist: [item("pending"), item("pending")] }], ...base })
    ).toBe("requested");
  });

  it("open request, some received -> responding", () => {
    expect(
      pipelineStage({ openRequests: [{ dueDate: "2026-08-01", checklist: [item("received"), item("pending")] }], ...base })
    ).toBe("responding");
  });

  it("open request fully received, nothing pending -> review", () => {
    expect(
      pipelineStage({ openRequests: [{ dueDate: "2026-08-01", checklist: [item("received"), item("received")] }], ...base })
    ).toBe("review");
  });

  it("pending upload sessions win -> review", () => {
    expect(
      pipelineStage({ openRequests: [{ dueDate: "2026-08-01", checklist: [item("pending")] }], ...base, pendingReviewCount: 1 })
    ).toBe("review");
  });

  it("snapshot exists, no open request -> approved", () => {
    expect(pipelineStage({ openRequests: [], ...base, hasSnapshot: true })).toBe("approved");
  });

  it("overdue is a flag, not a stage - an overdue requested client is still 'requested'", () => {
    const c = { openRequests: [{ dueDate: "2026-07-10", checklist: [item("pending")] }], ...base };
    expect(pipelineStage(c)).toBe("requested");
    expect(isOverdue(c, new Date("2026-07-21T12:00:00Z"))).toBe(true);
  });
});
