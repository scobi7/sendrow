// Example data for the homepage dashboard. Copied from the approved 4c design and
// scratchpad homepage/CONTENT.md. Every number must match CONTENT.md. Do not add numbers here.

export type TraceRow = {
  value: string;
  formula: string;
  activity: string;
  source: string;
  file: string;
  factor: string;
  method: string;
  uploaded: string;
  reviewed: string;
  note: string;
};

/** "How calculated" panel content, one entry per ledger row (same order). */
export const TRACE: TraceRow[] = [
  { value: "8.61", formula: "41,180 kWh × 0.000209 tCO2e/kWh = 8.61 tCO2e", activity: "Electricity, Fresno plant", source: "PG&E electric bill, Mar 2025", file: "pge-fresno-elec-2025-03.pdf", factor: "eGRID CAMX (California), 0.000209 tCO2e/kWh, EPA eGRID, 2024", method: "Location-based, eGRID subregion CAMX", uploaded: "By the client through the request link, Feb 12, 2026", reviewed: "J. Rivera, Feb 17, 2026", note: "" },
  { value: "3.94", formula: "18,849 kWh × 0.000209 tCO2e/kWh = 3.94 tCO2e", activity: "Electricity, Stockton warehouse", source: "PG&E electric bill, Mar 2025", file: "pge-stockton-elec-2025-03.pdf", factor: "eGRID CAMX (California), 0.000209 tCO2e/kWh, EPA eGRID, 2024", method: "Location-based, eGRID subregion CAMX", uploaded: "Feb 12, 2026", reviewed: "J. Rivera, Feb 17, 2026", note: "" },
  { value: "16.54", formula: "3,120 therms × 0.0053 tCO2e/therm = 16.54 tCO2e", activity: "Natural gas, Fresno plant", source: "PG&E gas bill, Mar 2025", file: "pge-fresno-gas-2025-03.pdf", factor: "Natural gas, 0.0053 tCO2e/therm, EPA GHG Emission Factors Hub, 2025", method: "Stationary combustion", uploaded: "Feb 12, 2026", reviewed: "J. Rivera, Feb 17, 2026", note: "" },
  { value: "2.15", formula: "406 therms × 0.0053 tCO2e/therm = 2.15 tCO2e", activity: "Natural gas, Stockton warehouse", source: "PG&E gas bill, Mar 2025", file: "pge-stockton-gas-2025-03.pdf", factor: "Natural gas, 0.0053 tCO2e/therm, EPA GHG Emission Factors Hub, 2025", method: "Stationary combustion", uploaded: "Feb 12, 2026", reviewed: "J. Rivera, Feb 17, 2026", note: "" },
  { value: "8.25", formula: "808 gal × 0.01021 tCO2e/gal = 8.25 tCO2e", activity: "Diesel, Delivery fleet", source: "WEX fuel card export, Mar 2025", file: "wex-fleet-2025-03.csv", factor: "Diesel fuel, 0.01021 tCO2e/gal, EPA GHG Emission Factors Hub, 2025", method: "Mobile combustion. Gallons converted from spend: $3,151.20 at $3.90 per gallon", uploaded: "Feb 13, 2026", reviewed: "Not yet", note: "Converted from spend. Check the price per gallon." },
  { value: "1.53", formula: "150 gal × 0.01021 tCO2e/gal = 1.53 tCO2e", activity: "Diesel, Fresno backup generator", source: "Valley Fuel invoice #4471, Mar 2025", file: "valley-fuel-4471.pdf", factor: "Diesel (stationary equipment), 0.01021 tCO2e/gal, EPA GHG Emission Factors Hub, 2025", method: "Stationary combustion", uploaded: "Feb 12, 2026", reviewed: "J. Rivera, Feb 17, 2026", note: "" },
];

export type LedgerRow = {
  activity: string;
  site: string;
  source: string;
  quantity: string;
  factorName: string;
  factorValue: string;
  tco2e: string;
  status: string;
  needsReview?: boolean;
};

/** Ledger rows for March 2025. */
export const LEDGER: LedgerRow[] = [
  { activity: "Electricity", site: "Fresno plant", source: "PG&E electric bill, Mar 2025", quantity: "41,180 kWh", factorName: "eGRID CAMX (California)", factorValue: "0.000209 tCO2e/kWh", tco2e: "8.61", status: "Reviewed" },
  { activity: "Electricity", site: "Stockton warehouse", source: "PG&E electric bill, Mar 2025", quantity: "18,849 kWh", factorName: "eGRID CAMX (California)", factorValue: "0.000209 tCO2e/kWh", tco2e: "3.94", status: "Reviewed" },
  { activity: "Natural gas", site: "Fresno plant", source: "PG&E gas bill, Mar 2025", quantity: "3,120 therms", factorName: "Natural gas", factorValue: "0.0053 tCO2e/therm", tco2e: "16.54", status: "Reviewed" },
  { activity: "Natural gas", site: "Stockton warehouse", source: "PG&E gas bill, Mar 2025", quantity: "406 therms", factorName: "Natural gas", factorValue: "0.0053 tCO2e/therm", tco2e: "2.15", status: "Reviewed" },
  { activity: "Diesel", site: "Delivery fleet", source: "WEX fuel card export, Mar 2025", quantity: "808 gal", factorName: "Diesel fuel", factorValue: "0.01021 tCO2e/gal", tco2e: "8.25", status: "Needs review", needsReview: true },
  { activity: "Diesel", site: "Fresno backup generator", source: "Valley Fuel invoice #4471, Mar 2025", quantity: "150 gal", factorName: "Diesel (stationary equipment)", factorValue: "0.01021 tCO2e/gal", tco2e: "1.53", status: "Reviewed" },
];

/** March 2025 totals in tCO2e. Scope 1 and 2 add up to the total. */
export const TOTALS = [
  { label: "Scope 1", value: "28.47" },
  { label: "Scope 2 (location-based)", value: "12.55" },
  { label: "Total", value: "41.02" },
];
