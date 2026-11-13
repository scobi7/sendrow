import { eq } from "drizzle-orm";
import { db } from "./db";
import { scope3Screening } from "./db/schema";

export type ScreeningDecision = {
  categoryNumber: number;
  categoryName: string;
  status: string;
  reason: string | null;
};

export async function getScreeningDecisions(companyId: string): Promise<ScreeningDecision[]> {
  const rows = await db
    .select()
    .from(scope3Screening)
    .where(eq(scope3Screening.companyId, companyId));
  return rows.map((r) => ({
    categoryNumber: r.categoryNumber,
    categoryName: r.categoryName,
    status: r.status,
    reason: r.reason,
  }));
}
