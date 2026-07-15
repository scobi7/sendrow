import { SEED_FACTORS } from "./factors";
import type { EmissionFactor } from "./types";

export type { EmissionFactor };

export type CalcLog = {
  raw_value: number;
  raw_unit: string;
  factor_id: string;
  factor_name: string;
  factor_value: number;
  factor_unit: string;
  factor_vintage: number;
  formula: string;
  co2e_kg: number;
  computed_at: string;
};

export type FactorQuery = {
  factorId?: string;
  category?: string;
  unit?: string;
};

/** Pure lookup - takes a factors array so it works in tests without a DB call. */
export function lookupFactor(
  factors: EmissionFactor[],
  query: FactorQuery
): EmissionFactor | null {
  if (query.factorId) {
    return factors.find((f) => f.factor_id === query.factorId) ?? null;
  }
  const matches = factors.filter((f) => {
    const categoryMatch = !query.category || f.category === query.category;
    const unitMatch = !query.unit || f.unit.toLowerCase().includes(query.unit.toLowerCase());
    return categoryMatch && unitMatch && !f.year_retired;
  });
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.year_effective - a.year_effective)[0];
}

/** Pure conversion - multiply raw value by factor, return CO2e in kg and a replayable log. */
export function applyFactor(
  rawValue: number,
  rawUnit: string,
  factor: EmissionFactor
): { co2e_kg: number; calc_log: CalcLog } {
  const co2e_tons = rawValue * factor.value;
  const co2e_kg = co2e_tons * 1000;
  const calc_log: CalcLog = {
    raw_value: rawValue,
    raw_unit: rawUnit,
    factor_id: factor.factor_id,
    factor_name: factor.factor_name,
    factor_value: Number(factor.value),
    factor_unit: factor.unit,
    factor_vintage: factor.year_effective,
    formula: `${rawValue} ${rawUnit} × ${factor.value} ${factor.unit} × 1000 kg/t`,
    co2e_kg,
    computed_at: new Date().toISOString(),
  };
  return { co2e_kg, calc_log };
}

/** DB-backed loader - returns all non-retired factors from gt_emission_factors.
 *  Falls back to SEED_FACTORS if the DB has no rows (useful in dev before seeding). */
export async function getFactorsFromDb(): Promise<EmissionFactor[]> {
  const { db } = await import("./db");
  const { emissionFactors } = await import("./db/schema");
  const { isNull } = await import("drizzle-orm");

  const rows = await db
    .select()
    .from(emissionFactors)
    .where(isNull(emissionFactors.yearRetired));

  if (rows.length === 0) return SEED_FACTORS;

  return rows.map((r) => ({
    factor_id: r.factorId,
    factor_name: r.factorName,
    category: r.category,
    value: Number(r.value),
    unit: r.unit,
    source: r.source,
    source_url: r.sourceUrl,
    year_effective: r.yearEffective,
    year_retired: r.yearRetired ?? null,
  }));
}
