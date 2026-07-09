/** Unit normalization (Plan T2): canonical units + conversions so a perfectly
 *  mapped column doesn't flag just because the utility reports in MWh.
 *  Conversions are recorded in the calc log by the caller. Unknown units pass
 *  through untouched — never guessed. */

type Conversion = { unit: string; factor: number };

/** alias (normalized) → canonical unit + multiplier applied to the quantity */
const UNIT_TABLE: Record<string, Conversion> = {
  // electricity
  kwh: { unit: "kWh", factor: 1 },
  "kilowatt hour": { unit: "kWh", factor: 1 },
  "kilowatt hours": { unit: "kWh", factor: 1 },
  mwh: { unit: "kWh", factor: 1000 },
  "megawatt hour": { unit: "kWh", factor: 1000 },
  "megawatt hours": { unit: "kWh", factor: 1000 },
  gwh: { unit: "kWh", factor: 1_000_000 },
  // natural gas
  therm: { unit: "therms", factor: 1 },
  therms: { unit: "therms", factor: 1 },
  ccf: { unit: "therms", factor: 1.037 }, // 1 ccf ≈ 1.037 therms (EIA)
  mcf: { unit: "therms", factor: 10.37 },
  "cubic feet": { unit: "therms", factor: 0.01037 },
  dth: { unit: "therms", factor: 10 },
  dekatherm: { unit: "therms", factor: 10 },
  dekatherms: { unit: "therms", factor: 10 },
  // liquid fuel
  gal: { unit: "gallon", factor: 1 },
  gals: { unit: "gallon", factor: 1 },
  gallon: { unit: "gallon", factor: 1 },
  gallons: { unit: "gallon", factor: 1 },
  l: { unit: "gallon", factor: 0.264172 },
  liter: { unit: "gallon", factor: 0.264172 },
  liters: { unit: "gallon", factor: 0.264172 },
  litre: { unit: "gallon", factor: 0.264172 },
  litres: { unit: "gallon", factor: 0.264172 },
  // distance
  mi: { unit: "mile", factor: 1 },
  mile: { unit: "mile", factor: 1 },
  miles: { unit: "mile", factor: 1 },
  km: { unit: "mile", factor: 0.621371 },
  kilometer: { unit: "mile", factor: 0.621371 },
  kilometers: { unit: "mile", factor: 0.621371 },
  // mass
  ton: { unit: "ton", factor: 1 },
  tons: { unit: "ton", factor: 1 },
  "short ton": { unit: "ton", factor: 1 },
  tonne: { unit: "ton", factor: 1.10231 },
  tonnes: { unit: "ton", factor: 1.10231 },
  "metric ton": { unit: "ton", factor: 1.10231 },
  "metric tons": { unit: "ton", factor: 1.10231 },
  kg: { unit: "ton", factor: 0.00110231 },
  lb: { unit: "ton", factor: 0.0005 },
  lbs: { unit: "ton", factor: 0.0005 },
  pounds: { unit: "ton", factor: 0.0005 },
};

export type NormalizedQuantity = {
  quantity: number;
  unit: string;
  converted: boolean;
  conversion?: string; // human-readable, for the calc log
};

export function normalizeQuantity(quantity: number, rawUnit: string | undefined): NormalizedQuantity {
  const key = (rawUnit ?? "").toLowerCase().replace(/[.]/g, "").trim();
  const hit = UNIT_TABLE[key];
  if (!hit) return { quantity, unit: rawUnit ?? "", converted: false };
  if (hit.factor === 1 && hit.unit.toLowerCase() === key) {
    return { quantity, unit: hit.unit, converted: false };
  }
  const convertedQty = quantity * hit.factor;
  return {
    quantity: convertedQty,
    unit: hit.unit,
    converted: true,
    conversion: `${quantity} ${rawUnit} × ${hit.factor} = ${convertedQty.toFixed(4)} ${hit.unit}`,
  };
}
