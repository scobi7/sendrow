import { EmissionFactor } from "./types";

/**
 * Versioned emission factor library — seeded at first run.
 * DEMO VALUES: representative of published EPA / eGRID / USEEIO / IPCC AR6
 * figures. Verify each against the cited source before production use.
 * Never hardcode factors in calculation logic — always look up by id here.
 */
export const SEED_FACTORS: EmissionFactor[] = [
  // ── Mobile combustion (EPA GHG Emission Factors Hub) ──
  { factor_id: "fuel.gasoline.2025", factor_name: "Motor gasoline", category: "mobile_combustion", value: 0.008887, unit: "tCO2e/gallon", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "fuel.diesel.2025", factor_name: "Diesel fuel", category: "mobile_combustion", value: 0.010210, unit: "tCO2e/gallon", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "fuel.propane.2025", factor_name: "Propane (LPG)", category: "mobile_combustion", value: 0.005752, unit: "tCO2e/gallon", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  // ── Stationary combustion ──
  { factor_id: "natgas.therm.2025", factor_name: "Natural gas", category: "stationary_combustion", value: 0.0053, unit: "tCO2e/therm", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "equip.diesel.2025", factor_name: "Diesel (stationary equipment)", category: "stationary_combustion", value: 0.010210, unit: "tCO2e/gallon", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "equip.gasoline.2025", factor_name: "Gasoline (stationary equipment)", category: "stationary_combustion", value: 0.008887, unit: "tCO2e/gallon", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "equip.propane.2025", factor_name: "Propane (stationary equipment)", category: "stationary_combustion", value: 0.005752, unit: "tCO2e/gallon", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  // ── Electricity, location-based (EPA eGRID, by subregion) ──
  { factor_id: "egrid.CAMX.2024", factor_name: "eGRID CAMX (California)", category: "electricity_location", value: 0.000209, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.NWPP.2024", factor_name: "eGRID NWPP (Northwest)", category: "electricity_location", value: 0.000289, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.AZNM.2024", factor_name: "eGRID AZNM (Southwest)", category: "electricity_location", value: 0.000390, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.ERCT.2024", factor_name: "eGRID ERCT (Texas)", category: "electricity_location", value: 0.000370, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.USAVG.2024", factor_name: "US national average grid", category: "electricity_location", value: 0.000369, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  // ── Electricity, market-based residual mix ──
  { factor_id: "residual.WECC.2024", factor_name: "WECC residual mix", category: "electricity_market", value: 0.000428, unit: "tCO2e/kWh", source: "Green-e Residual Mix (representative)", source_url: "https://www.green-e.org", year_effective: 2024, year_retired: null },
  // ── Refrigerants (IPCC AR6 GWP-100) ──
  { factor_id: "gwp.r410a.ar6", factor_name: "R-410A", category: "refrigerant_gwp", value: 2256, unit: "kgCO2e/kg", source: "IPCC AR6 GWP-100", source_url: "https://www.ipcc.ch/report/ar6/wg1/", year_effective: 2021, year_retired: null },
  { factor_id: "gwp.r134a.ar6", factor_name: "R-134a", category: "refrigerant_gwp", value: 1530, unit: "kgCO2e/kg", source: "IPCC AR6 GWP-100", source_url: "https://www.ipcc.ch/report/ar6/wg1/", year_effective: 2021, year_retired: null },
  { factor_id: "gwp.r32.ar6", factor_name: "R-32", category: "refrigerant_gwp", value: 771, unit: "kgCO2e/kg", source: "IPCC AR6 GWP-100", source_url: "https://www.ipcc.ch/report/ar6/wg1/", year_effective: 2021, year_retired: null },
  { factor_id: "gwp.r404a.ar6", factor_name: "R-404A", category: "refrigerant_gwp", value: 4728, unit: "kgCO2e/kg", source: "IPCC AR6 GWP-100", source_url: "https://www.ipcc.ch/report/ar6/wg1/", year_effective: 2021, year_retired: null },
  { factor_id: "gwp.r22.ar6", factor_name: "R-22", category: "refrigerant_gwp", value: 1960, unit: "kgCO2e/kg", source: "IPCC AR6 GWP-100", source_url: "https://www.ipcc.ch/report/ar6/wg1/", year_effective: 2021, year_retired: null },
  // ── Spend-based Scope 3 (USEEIO, representative sector intensities) ──
  { factor_id: "useeio.air_travel.v2", factor_name: "Air transportation", category: "spend_based", value: 0.00102, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.hotels.v2", factor_name: "Accommodation", category: "spend_based", value: 0.00030, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.car_rental.v2", factor_name: "Automotive rental", category: "spend_based", value: 0.00045, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.freight.v2", factor_name: "Truck transportation", category: "spend_based", value: 0.00092, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.office_supplies.v2", factor_name: "Office supplies & paper", category: "spend_based", value: 0.00045, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.it_services.v2", factor_name: "Software & IT services", category: "spend_based", value: 0.00012, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.prof_services.v2", factor_name: "Professional services", category: "spend_based", value: 0.00010, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.materials.v2", factor_name: "Manufactured goods & materials", category: "spend_based", value: 0.00060, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.food.v2", factor_name: "Food & beverage products", category: "spend_based", value: 0.00085, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  // ── Commuting (EPA, per vehicle-mile / passenger-mile) ──
  { factor_id: "commute.car.2025", factor_name: "Passenger car", category: "commute", value: 0.000400, unit: "tCO2e/mile", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "commute.carpool.2025", factor_name: "Carpool (2 riders)", category: "commute", value: 0.000200, unit: "tCO2e/mile", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "commute.transit.2025", factor_name: "Transit bus", category: "commute", value: 0.000071, unit: "tCO2e/passenger-mile", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "commute.rail.2025", factor_name: "Commuter rail", category: "commute", value: 0.000093, unit: "tCO2e/passenger-mile", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "commute.zero.2025", factor_name: "Bike / walk / WFH", category: "commute", value: 0, unit: "tCO2e/mile", source: "n/a", source_url: "", year_effective: 2025, year_retired: null },
  // ── Waste (EPA WARM, representative) ──
  { factor_id: "waste.landfill.2025", factor_name: "Mixed MSW — landfilled", category: "waste", value: 0.52, unit: "tCO2e/short ton", source: "EPA WARM (representative)", source_url: "https://www.epa.gov/warm", year_effective: 2025, year_retired: null },
  { factor_id: "waste.recycled.2025", factor_name: "Mixed recyclables — recycled", category: "waste", value: 0.09, unit: "tCO2e/short ton", source: "EPA WARM (representative)", source_url: "https://www.epa.gov/warm", year_effective: 2025, year_retired: null },
  { factor_id: "waste.composted.2025", factor_name: "Organics — composted", category: "waste", value: 0.17, unit: "tCO2e/short ton", source: "EPA WARM (representative)", source_url: "https://www.epa.gov/warm", year_effective: 2025, year_retired: null },
];

/** Map a US state to an eGRID subregion factor id (simplified demo mapping). */
export function egridForState(state: string): string {
  const s = state.trim().toUpperCase();
  if (["CA"].includes(s)) return "egrid.CAMX.2024";
  if (["WA", "OR", "ID", "MT", "UT", "WY", "NV"].includes(s)) return "egrid.NWPP.2024";
  if (["AZ", "NM"].includes(s)) return "egrid.AZNM.2024";
  if (["TX"].includes(s)) return "egrid.ERCT.2024";
  return "egrid.USAVG.2024";
}

export function egridLabel(factorId: string): string {
  return factorId.split(".")[1] ?? factorId;
}

/** QuickBooks expense category → USEEIO sector factor id */
export const QB_CATEGORY_TO_USEEIO: Record<string, { factorId: string; bucket: "travel" | "purchased" | "freight" }> = {
  "Travel — Airfare": { factorId: "useeio.air_travel.v2", bucket: "travel" },
  "Travel — Lodging": { factorId: "useeio.hotels.v2", bucket: "travel" },
  "Travel — Car Rental": { factorId: "useeio.car_rental.v2", bucket: "travel" },
  "Freight & Delivery": { factorId: "useeio.freight.v2", bucket: "freight" },
  "Office Supplies": { factorId: "useeio.office_supplies.v2", bucket: "purchased" },
  "Software & Subscriptions": { factorId: "useeio.it_services.v2", bucket: "purchased" },
  "Professional Fees": { factorId: "useeio.prof_services.v2", bucket: "purchased" },
  "Materials & Equipment": { factorId: "useeio.materials.v2", bucket: "purchased" },
  "Meals & Catering": { factorId: "useeio.food.v2", bucket: "purchased" },
};

export const REFRIGERANT_FACTOR: Record<string, string> = {
  "R-410A": "gwp.r410a.ar6",
  "R-134a": "gwp.r134a.ar6",
  "R-32": "gwp.r32.ar6",
  "R-404A": "gwp.r404a.ar6",
  "R-22": "gwp.r22.ar6",
};

export const COMMUTE_FACTOR: Record<string, string> = {
  "Drive alone": "commute.car.2025",
  "Carpool": "commute.carpool.2025",
  "Public transit": "commute.transit.2025",
  "Rail": "commute.rail.2025",
  "Bike / walk / mostly remote": "commute.zero.2025",
};

export const SCOPE3_OTHER_CATEGORIES = [
  "Capital goods",
  "Fuel- and energy-related activities",
  "Downstream transportation",
  "Use of sold products",
  "End-of-life treatment of sold products",
  "Leased assets",
];
