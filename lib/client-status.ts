import type { ChecklistItem } from "./portal";

/** Workflow status per wireframe (#19): the one word a consultant scans for
 *  on the dashboard table. Derived — never stored. */
export type WorkflowStatus = "awaiting_reply" | "ready_for_review" | "overdue" | "approved" | "none";

export const STATUS_META: Record<WorkflowStatus, { label: string; tone: "warning" | "primary" | "danger" | "success" | "neutral" }> = {
  awaiting_reply: { label: "Awaiting reply", tone: "warning" },
  ready_for_review: { label: "Ready for review", tone: "primary" },
  overdue: { label: "Overdue", tone: "danger" },
  approved: { label: "Approved", tone: "success" },
  none: { label: "No requests", tone: "neutral" },
};

export type ClientWorkflowInput = {
  openRequests: { dueDate: string | null; checklist: ChecklistItem[] | null }[];
  pendingReviewCount: number;
  hasSnapshot: boolean;
  hasFulfilledRequest: boolean;
};

export function workflowStatus(c: ClientWorkflowInput, now: Date = new Date()): WorkflowStatus {
  if (c.pendingReviewCount > 0) return "ready_for_review";
  const overdue = c.openRequests.some((r) => r.dueDate && new Date(r.dueDate + "T23:59:59") < now);
  if (overdue) return "overdue";
  if (c.openRequests.length > 0) return "awaiting_reply";
  if (c.hasSnapshot || c.hasFulfilledRequest) return "approved";
  return "none";
}

/** Earliest open due date — the "Due" column. */
export function nextDueDate(c: ClientWorkflowInput): string | null {
  const dates = c.openRequests.map((r) => r.dueDate).filter((d): d is string => Boolean(d)).sort();
  return dates[0] ?? null;
}

/** Completeness = received / requested across open checklists (6.7).
 *  Nothing open but data approved before → 100. Nothing at all → 0. */
export function completenessPercent(c: ClientWorkflowInput): number {
  let total = 0;
  let received = 0;
  for (const r of c.openRequests) {
    const items = r.checklist ?? [];
    total += items.length;
    received += items.filter((i) => i.status === "received").length;
  }
  if (total === 0) return c.hasSnapshot || c.hasFulfilledRequest ? 100 : 0;
  return Math.round((received / total) * 100);
}
