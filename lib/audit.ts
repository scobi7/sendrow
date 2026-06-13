import { appendAudit, uid } from "./store";
import { User } from "./types";

export { auditForCompany } from "./store";

/**
 * Append-only audit log. Every write to any data field inserts a row —
 * previous value, new value, factor used, formula, user, timestamp.
 */
export async function logChange(opts: {
  user: User;
  companyId: string;
  section: string;
  field: string;
  prev: unknown;
  next: unknown;
  factorId?: string;
  formula?: string;
}): Promise<void> {
  const show = (v: unknown) =>
    v === undefined || v === null || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v);
  if (show(opts.prev) === show(opts.next)) return; // no actual change
  await appendAudit({
    id: uid("aud_"),
    ts: new Date().toISOString(),
    companyId: opts.companyId,
    userId: opts.user.id,
    userName: opts.user.name,
    section: opts.section,
    field: opts.field,
    prev: show(opts.prev),
    next: show(opts.next),
    factorId: opts.factorId,
    formula: opts.formula,
  });
}
