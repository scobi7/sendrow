import { SEED_FACTORS } from "@/lib/factors";

/** Where a row's factor came from. Prefers the stored factor table; when the row's
 *  factor_id is not in that table, falls back to the seed library the calc used,
 *  so the trace still names the source. Pure: no DB. */
export function resolveFactorSource(
  factorId: string,
  stored: { source: string; sourceUrl: string } | undefined
): { source: string; sourceUrl: string } | null {
  if (stored) return stored;
  const seed = SEED_FACTORS.find((f) => f.factor_id === factorId);
  return seed ? { source: seed.source, sourceUrl: seed.source_url } : null;
}
