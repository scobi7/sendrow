import "server-only";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { consultantClients } from "./db/schema";
import { currentUser } from "./auth";
import type { User } from "./types";

/** The one ownership query (contracts/invariants.md §7). Returns the active
 *  (non-archived) consultantClients link for this consultant and company, or
 *  undefined. Every consultant-facing read or write of a company goes through
 *  this, directly or via requireOwnedClient / the shared guards in
 *  lib/consultant-actions.ts. */
export async function findOwnedLink(consultantId: string, companyId: string) {
  return db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, consultantId),
      eq(consultantClients.companyId, companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
}

/** For server pages and layouts under clients/[id]. Anyone who is not a
 *  consultant, or does not own an active link to this company, gets a 404
 *  (never a redirect, so the existence of a client is not disclosed). */
export async function requireOwnedClient(companyId: string): Promise<{
  user: User;
  link: NonNullable<Awaited<ReturnType<typeof findOwnedLink>>>;
}> {
  const user = await currentUser();
  if (!user || user.role !== "consultant") notFound();
  const link = await findOwnedLink(user.id, companyId);
  if (!link) notFound();
  return { user, link };
}
