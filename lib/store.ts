import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  companies,
  companyInputs,
  locations,
  calcs,
  emissionFactors,
} from "./db/schema";
import { Company, EmissionFactor, Industry, HeadcountRange, Inputs, SectionName, SectionStatus } from "./types";
import { SEED_FACTORS } from "./factors";
import { factorFromRow } from "./factor-engine";

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function getFactor(factorId: string): EmissionFactor {
  const f = SEED_FACTORS.find((f) => f.factor_id === factorId);
  if (!f) throw new Error(`Unknown emission factor: ${factorId}`);
  return f;
}

/** Loads the emission factor table. A DB error throws: the caller must never
 *  recalculate on the seed factors because of a transient read failure (those
 *  results would be saved over the real ones). An empty table returns []. */
export async function loadFactors(): Promise<EmissionFactor[]> {
  const rows = await db.select().from(emissionFactors).catch((err: unknown) => {
    throw new Error(
      `loadFactors: could not read the emission_factors table; refusing to recalculate on seed factors. ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  });
  return rows.map(factorFromRow);
}

const SECTION_NAMES: SectionName[] = ["scope1", "scope2", "scope3", "social", "governance", "reports"];

/** Keeps only the current section keys, so stale rows (e.g. a retired
 *  "connections" entry) cannot skew progress percentages. */
function storedSectionStatus(raw: unknown): Record<SectionName, SectionStatus> {
  const src = (raw ?? {}) as Partial<Record<SectionName, SectionStatus>>;
  const out = {} as Record<SectionName, SectionStatus>;
  for (const name of SECTION_NAMES) out[name] = src[name] ?? "not_started";
  return out;
}

export const loadCompany = cache(async (companyId: string): Promise<Company> => {
  const [companyRows, inputRows, locRows, calcRows] = await Promise.all([
    db.select().from(companies).where(eq(companies.id, companyId)),
    db.select().from(companyInputs).where(eq(companyInputs.companyId, companyId)),
    db.select().from(locations).where(eq(locations.companyId, companyId)),
    db.select().from(calcs).where(eq(calcs.companyId, companyId)),
  ]);

  const c = companyRows[0];
  if (!c) throw new Error(`Company not found: ${companyId}`);

  return {
    id: c.id,
    name: c.name,
    industry: c.industry as Industry,
    headcountRange: c.headcountRange as HeadcountRange,
    fiscalYearEndMonth: c.fiscalYearEndMonth ?? 12,
    reportingFramework: c.reportingFramework ?? null,
    setupComplete: c.setupComplete,
    createdAt: c.createdAt,
    sectionStatus: storedSectionStatus(c.sectionStatus),
    reportGeneratedAt: c.reportGeneratedAt ?? null,
    actionPlan: (c.actionPlan as string[] | null) ?? null,
    inputs: ((inputRows[0]?.data ?? {}) as Inputs),
    locations: locRows.map((l) => ({
      id: l.id,
      address: l.address,
      city: l.city,
      state: l.state,
      zip: l.zip,
      egridSubregion: l.egridSubregion,
    })),
    calcs: calcRows.map((c) => ({
      id: c.id,
      scope: c.scope as 1 | 2 | 3,
      category: c.category,
      co2eTons: Number(c.co2eTons),
      factorId: c.factorId ?? null,
      formula: c.formula,
      basis: c.basis as "measured" | "spend_based" | "estimated",
      marketBasedTons: c.marketBasedTons != null ? Number(c.marketBasedTons) : undefined,
    })),
  };
});

export async function persistCompany(company: Company): Promise<void> {
  const id = company.id;

  await Promise.all([
    db
      .update(companies)
      .set({
        name: company.name,
        industry: company.industry ?? null,
        headcountRange: company.headcountRange ?? null,
        fiscalYearEndMonth: company.fiscalYearEndMonth,
        reportingFramework: company.reportingFramework ?? null,
        setupComplete: company.setupComplete,
        sectionStatus: company.sectionStatus,
        reportGeneratedAt: company.reportGeneratedAt ?? null,
        actionPlan: company.actionPlan ?? null,
      })
      .where(eq(companies.id, id)),

    db
      .insert(companyInputs)
      .values({ companyId: id, data: company.inputs as Record<string, unknown> })
      .onConflictDoUpdate({
        target: companyInputs.companyId,
        set: { data: company.inputs as Record<string, unknown> },
      }),

  ]);

  // Replace calcs - recalculated every persist
  await db.delete(calcs).where(eq(calcs.companyId, id));
  if (company.calcs.length > 0) {
    await db.insert(calcs).values(
      company.calcs.map((c) => ({
        id: c.id,
        companyId: id,
        scope: c.scope,
        category: c.category,
        co2eTons: String(c.co2eTons),
        factorId: c.factorId ?? null,
        formula: c.formula,
        basis: c.basis,
        marketBasedTons: c.marketBasedTons != null ? String(c.marketBasedTons) : null,
      }))
    );
  }
}
