import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { auditLog } from "./db/schema";
import { uid } from "./store";
import { User } from "./types";

const show = (v: unknown) =>
  v === undefined || v === null || v === "" ? " - " : typeof v === "object" ? JSON.stringify(v) : String(v);

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
  if (show(opts.prev) === show(opts.next)) return;
  await db.insert(auditLog).values({
    id: uid("aud_"),
    ts: new Date().toISOString(),
    companyId: opts.companyId,
    userId: opts.user.id,
    userName: opts.user.name,
    section: opts.section,
    field: opts.field,
    prev: show(opts.prev),
    next: show(opts.next),
    factorId: opts.factorId ?? null,
    formula: opts.formula ?? null,
  });
}

export async function auditForCompany(companyId: string) {
  return db
    .select()
    .from(auditLog)
    .where(eq(auditLog.companyId, companyId))
    .orderBy(desc(auditLog.ts));
}
