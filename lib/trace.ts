/**
 * Calculation trace for one ledger row: which factor, from which source and year,
 * what method and formula, and which assumptions shaped the number. Pure: no DB.
 * Read defensively, because calcLog is stored as jsonb and its shape varies by path
 * (factor engine, dollar-fuel conversion, vendor mapping, unit conversion).
 */

export type Trace = {
  activity: string;
  factorId: string | null;
  factorName: string | null;
  factorValue: string | null;
  factorUnit: string | null;
  factorYear: number | null;
  source: string | null;
  sourceUrl: string | null;
  method: string;
  formula: string | null;
  assumptions: string[];
  computedAt: string | null;
};

type TraceItem = {
  rawValue: string;
  rawUnit: string;
  factorId: string | null;
  calcLog: unknown;
  confidence: string;
  period: string | null;
  locationName?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Spend factors are written per dollar, e.g. "tCO2e/USD" (see lib/factors.ts). */
function isSpendUnit(unit: string | null): boolean {
  return unit !== null && (unit.includes("USD") || unit.includes("$"));
}

export function buildTrace(
  item: TraceItem,
  factor?: { source: string; sourceUrl: string } | null
): Trace {
  const log = asRecord(item.calcLog);
  const factorUnit = str(log.factor_unit);
  const factorValue = num(log.factor_value);
  const dollarAmount = num(log.dollar_amount);
  const pricePerGal = num(log.price_per_gal);
  const derivedGallons = num(log.derived_gallons);
  const vendorMappingId = str(log.vendor_mapping_id);
  const unitConversion = str(log.unit_conversion);

  const assumptions: string[] = [];
  if (item.confidence !== "actual" && item.confidence !== "measured") {
    assumptions.push("Estimated value, not yet confirmed as actual");
  }
  assumptions.push(
    item.period
      ? `Reporting period ${item.period}`
      : "No reporting period tagged (row has no date)"
  );
  if (item.locationName) assumptions.push(`Site: ${item.locationName}`);
  if (dollarAmount !== null) {
    const price = pricePerGal !== null ? ` at $${pricePerGal} per gallon` : "";
    const gallons = derivedGallons !== null ? `, giving ${derivedGallons} gallons` : "";
    assumptions.push(`Spend of $${dollarAmount} converted to gallons${price}${gallons}`);
  } else if (derivedGallons !== null) {
    assumptions.push(`Quantity derived as ${derivedGallons} gallons`);
  }
  if (vendorMappingId) {
    assumptions.push(`Factor chosen by a confirmed vendor mapping (ID ${vendorMappingId})`);
  }
  if (unitConversion) {
    assumptions.push(`Unit converted before the factor was applied: ${unitConversion}`);
  }

  return {
    activity: `${item.rawValue} ${item.rawUnit}`.trim(),
    factorId: str(log.factor_id) ?? item.factorId ?? null,
    factorName: str(log.factor_name),
    factorValue: factorValue !== null ? String(factorValue) : null,
    factorUnit,
    factorYear: num(log.factor_vintage),
    source: str(factor?.source),
    sourceUrl: /^https?:\/\//i.test(factor?.sourceUrl ?? "") ? str(factor?.sourceUrl) : null,
    method: isSpendUnit(factorUnit) ? "Spend-based (EEIO)" : "Activity-based",
    formula: str(log.formula),
    assumptions,
    computedAt: str(log.computed_at),
  };
}
