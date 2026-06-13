import { loadDB, uid } from "./store";
import { User } from "./types";

/**
 * Append-only audit log. Every write to any data field inserts a row —
 * previous value, new value, factor used, formula, user, timestamp.
 * The Audit Trail export reads and formats this log; nothing is ever
 * overwritten or deleted.
 */
export function logChange(opts: {
  user: User;
  companyId: string;
  section: string;
  field: string;
  prev: unknown;
  next: unknown;
  factorId?: string;
  formula?: string;
}) {
  const show = (v: unknown) =>
    v === undefined || v === null || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v);
  if (show(opts.prev) === show(opts.next)) return; // no actual change
  loadDB().auditLog.push({
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

export function auditForCompany(companyId: string) {
  return loadDB()
    .auditLog.filter((r) => r.companyId === companyId)
    .sort((a, b) => b.ts.localeCompare(a.ts));
}
