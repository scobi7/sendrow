import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { companies, consultantClients, dataRequests, userCompanies } from "@/lib/db/schema";
import { portalTokenValid } from "@/lib/portal";
import { applyTemplate, type DataType } from "@/lib/ingestion/data-type-templates";
import { fuzzyMatchHeaders } from "@/lib/ingestion/fuzzy-match";

export type PortalDataRequest = typeof dataRequests.$inferSelect;

/** Looks up the data request for a magic-link token. No validity check -
 *  request-new-link must keep accepting expired tokens on purpose. */
export async function findPortalRequest(token: string): Promise<PortalDataRequest | null> {
  const [req] = await db.select().from(dataRequests).where(eq(dataRequests.token, token));
  return req ?? null;
}

/** Looks up the data request for a magic-link token and returns it only if the
 *  token is still usable (not expired, not cancelled). Otherwise null. */
export async function loadPortalRequest(token: string): Promise<PortalDataRequest | null> {
  const req = await findPortalRequest(token);
  if (!req || !portalTokenValid({ token: req.token, expiresAt: req.expiresAt, status: req.status })) {
    return null;
  }
  return req;
}

export type ConsultantRecipient = { email: string; name: string };

/** Finds the consultant who manages this company (active link, then their
 *  account) and fires an email at them. The lookups are awaited, so lookup
 *  errors reject; the email itself is fire-and-forget (errors swallowed). */
export async function notifyConsultant(
  companyId: string,
  send: (consultant: ConsultantRecipient, companyName: string) => Promise<unknown>
): Promise<void> {
  const [company, link] = await Promise.all([
    db.query.companies.findFirst({ where: eq(companies.id, companyId) }),
    db.query.consultantClients.findFirst({
      where: and(eq(consultantClients.companyId, companyId), isNull(consultantClients.archivedAt)),
    }),
  ]);
  if (!link) return;
  const consultant = await db.query.userCompanies.findFirst({ where: eq(userCompanies.clerkId, link.consultantId) });
  if (!consultant?.email) return;
  send({ email: consultant.email, name: consultant.name ?? "there" }, company?.name ?? "A client").catch(() => {});
}

/** Parses a JSON request body. Returns null when the body is not valid JSON. */
export async function readJsonBody(request: Request): Promise<Record<string, any> | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Column mapping for a file's headers: the data type's template wins, fuzzy
 *  word-bank matches fill the rest. Every header is present; unmatched ones are null. */
export function suggestMapping(headers: string[], dataType: DataType): Record<string, string | null> {
  const fuzzy = fuzzyMatchHeaders(headers);
  const templated = applyTemplate(headers, dataType, fuzzy) as Record<string, string | null>;
  const map: Record<string, string | null> = {};
  for (const h of headers) map[h] = templated[h] ?? null;
  return map;
}
