import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { consultantClients, consultantProfiles, userCompanies } from "./db/schema";

export type Brand = {
  brandName: string;
  logoUrl: string | null;
  accentColor: string | null;
  replyTo: string | null;
};

/** The brand a client of this company should see (contracts/ §11: never
 *  Sendrow). Falls back to the consultant's own name when no profile is set;
 *  null when the company has no active consultant. */
export async function getBrandForCompany(companyId: string): Promise<Brand | null> {
  const link = await db.query.consultantClients.findFirst({
    where: and(eq(consultantClients.companyId, companyId), isNull(consultantClients.archivedAt)),
  });
  if (!link) return null;
  return getBrandForConsultant(link.consultantId);
}

export async function getBrandForConsultant(consultantId: string): Promise<Brand | null> {
  const [profile, consultant] = await Promise.all([
    db.query.consultantProfiles.findFirst({ where: eq(consultantProfiles.consultantId, consultantId) }),
    db.query.userCompanies.findFirst({ where: eq(userCompanies.clerkId, consultantId) }),
  ]);
  const brandName = profile?.brandName?.trim() || consultant?.name || null;
  if (!brandName) return null;
  return {
    brandName,
    logoUrl: profile?.logoUrl ?? null,
    accentColor: profile?.accentColor ?? null,
    replyTo: profile?.replyTo ?? consultant?.email ?? null,
  };
}
