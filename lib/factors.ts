import { EmissionFactor } from "./types";

/**
 * Versioned emission factor library - seeded at first run.
 * DEMO VALUES: representative of published EPA / eGRID / USEEIO / IPCC AR6
 * figures. Verify each against the cited source before production use.
 * Never hardcode factors in calculation logic - always look up by id here.
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
  { factor_id: "egrid.AKGD.2024", factor_name: "eGRID AKGD (Alaska Grid)", category: "electricity_location", value: 0.000464, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.AKMS.2024", factor_name: "eGRID AKMS (Alaska Miscellaneous)", category: "electricity_location", value: 0.000232, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.FRCC.2024", factor_name: "eGRID FRCC (Florida)", category: "electricity_location", value: 0.000377, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.HIMS.2024", factor_name: "eGRID HIMS (Hawaii Miscellaneous)", category: "electricity_location", value: 0.000522, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.HIOA.2024", factor_name: "eGRID HIOA (Hawaii Oahu)", category: "electricity_location", value: 0.000710, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.MROE.2024", factor_name: "eGRID MROE (Wisconsin / Upper Michigan)", category: "electricity_location", value: 0.000680, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.MROW.2024", factor_name: "eGRID MROW (Upper Midwest)", category: "electricity_location", value: 0.000425, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.NEWE.2024", factor_name: "eGRID NEWE (New England)", category: "electricity_location", value: 0.000240, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.NYCW.2024", factor_name: "eGRID NYCW (NYC / Westchester)", category: "electricity_location", value: 0.000259, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.NYLI.2024", factor_name: "eGRID NYLI (Long Island)", category: "electricity_location", value: 0.000545, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.NYUP.2024", factor_name: "eGRID NYUP (Upstate New York)", category: "electricity_location", value: 0.000119, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.RFCE.2024", factor_name: "eGRID RFCE (Mid-Atlantic East)", category: "electricity_location", value: 0.000298, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.RFCM.2024", factor_name: "eGRID RFCM (Michigan)", category: "electricity_location", value: 0.000554, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.RFCW.2024", factor_name: "eGRID RFCW (Ohio Valley)", category: "electricity_location", value: 0.000455, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.RMPA.2024", factor_name: "eGRID RMPA (Rockies)", category: "electricity_location", value: 0.000500, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.SPNO.2024", factor_name: "eGRID SPNO (Kansas)", category: "electricity_location", value: 0.000471, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.SPSO.2024", factor_name: "eGRID SPSO (Oklahoma / Central South)", category: "electricity_location", value: 0.000481, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.SRMV.2024", factor_name: "eGRID SRMV (Mississippi Valley)", category: "electricity_location", value: 0.000370, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.SRMW.2024", factor_name: "eGRID SRMW (Midwest / Missouri)", category: "electricity_location", value: 0.000699, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.SRSO.2024", factor_name: "eGRID SRSO (South)", category: "electricity_location", value: 0.000409, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.SRTV.2024", factor_name: "eGRID SRTV (Tennessee Valley)", category: "electricity_location", value: 0.000424, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
  { factor_id: "egrid.SRVC.2024", factor_name: "eGRID SRVC (Virginia / Carolinas)", category: "electricity_location", value: 0.000298, unit: "tCO2e/kWh", source: "EPA eGRID", source_url: "https://www.epa.gov/egrid", year_effective: 2024, year_retired: null },
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
  { factor_id: "useeio.advertising.v2", factor_name: "Advertising & related services", category: "spend_based", value: 0.00013, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.insurance.v2", factor_name: "Insurance carriers", category: "spend_based", value: 0.00006, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.real_estate.v2", factor_name: "Real estate & rental", category: "spend_based", value: 0.00011, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.repairs.v2", factor_name: "Repair & maintenance services", category: "spend_based", value: 0.00032, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.machinery.v2", factor_name: "Machinery & equipment", category: "spend_based", value: 0.00058, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.packaging.v2", factor_name: "Packaging materials & containers", category: "spend_based", value: 0.00082, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.chemicals.v2", factor_name: "Chemical products", category: "spend_based", value: 0.00125, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.metals.v2", factor_name: "Fabricated metal products", category: "spend_based", value: 0.00155, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.contract_mfg.v2", factor_name: "Contract manufacturing services", category: "spend_based", value: 0.00068, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.admin_services.v2", factor_name: "Administrative & support services", category: "spend_based", value: 0.00014, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.education.v2", factor_name: "Educational services", category: "spend_based", value: 0.00011, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.telecom.v2", factor_name: "Telecommunications", category: "spend_based", value: 0.00019, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.printing.v2", factor_name: "Printing & related support", category: "spend_based", value: 0.00052, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  { factor_id: "useeio.facilities.v2", factor_name: "Facilities support services", category: "spend_based", value: 0.00024, unit: "tCO2e/USD", source: "USEEIO v2.0 (representative)", source_url: "https://www.epa.gov/land-research/us-environmentally-extended-input-output-useeio-models", year_effective: 2022, year_retired: null },
  // ── Commuting (EPA, per vehicle-mile / passenger-mile) ──
  { factor_id: "commute.car.2025", factor_name: "Passenger car", category: "commute", value: 0.000400, unit: "tCO2e/mile", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "commute.carpool.2025", factor_name: "Carpool (2 riders)", category: "commute", value: 0.000200, unit: "tCO2e/mile", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "commute.transit.2025", factor_name: "Transit bus", category: "commute", value: 0.000071, unit: "tCO2e/passenger-mile", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "commute.rail.2025", factor_name: "Commuter rail", category: "commute", value: 0.000093, unit: "tCO2e/passenger-mile", source: "EPA GHG Emission Factors Hub", source_url: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub", year_effective: 2025, year_retired: null },
  { factor_id: "commute.zero.2025", factor_name: "Bike / walk / WFH", category: "commute", value: 0, unit: "tCO2e/mile", source: "n/a", source_url: "", year_effective: 2025, year_retired: null },
  // ── Waste (EPA WARM, representative) ──
  { factor_id: "waste.landfill.2025", factor_name: "Mixed MSW - landfilled", category: "waste", value: 0.52, unit: "tCO2e/short ton", source: "EPA WARM (representative)", source_url: "https://www.epa.gov/warm", year_effective: 2025, year_retired: null },
  { factor_id: "waste.recycled.2025", factor_name: "Mixed recyclables - recycled", category: "waste", value: 0.09, unit: "tCO2e/short ton", source: "EPA WARM (representative)", source_url: "https://www.epa.gov/warm", year_effective: 2025, year_retired: null },
  { factor_id: "waste.composted.2025", factor_name: "Organics - composted", category: "waste", value: 0.17, unit: "tCO2e/short ton", source: "EPA WARM (representative)", source_url: "https://www.epa.gov/warm", year_effective: 2025, year_retired: null },
];

/**
 * Map a US state to an eGRID subregion factor id.
 *
 * States that span multiple subregions use the subregion serving the state's
 * largest load center (documented inline). Mapping changes apply forward only:
 * the resolved subregion is stored on the location row at creation, so
 * historical calculations keep the subregion they were created with.
 */
export function egridForState(state: string): string {
  const s = state.trim().toUpperCase();
  const map: Record<string, string> = {
    AL: "egrid.SRSO.2024", // south AL; north AL is SRTV
    AK: "egrid.AKGD.2024", // Railbelt grid serves most load; rural AK is AKMS
    AZ: "egrid.AZNM.2024",
    AR: "egrid.SRMV.2024",
    CA: "egrid.CAMX.2024",
    CO: "egrid.RMPA.2024",
    CT: "egrid.NEWE.2024",
    DE: "egrid.RFCE.2024",
    DC: "egrid.RFCE.2024",
    FL: "egrid.FRCC.2024", // peninsular FL; panhandle is SRSO
    GA: "egrid.SRSO.2024",
    HI: "egrid.HIOA.2024", // Oahu serves most load; other islands are HIMS
    ID: "egrid.NWPP.2024",
    IL: "egrid.RFCW.2024", // Chicago metro; southern IL is SRMW
    IN: "egrid.RFCW.2024",
    IA: "egrid.MROW.2024",
    KS: "egrid.SPNO.2024",
    KY: "egrid.SRTV.2024", // western KY; eastern KY is RFCW
    LA: "egrid.SRMV.2024",
    ME: "egrid.NEWE.2024",
    MD: "egrid.RFCE.2024",
    MA: "egrid.NEWE.2024",
    MI: "egrid.RFCM.2024", // Lower Peninsula; Upper Peninsula is MROE
    MN: "egrid.MROW.2024",
    MS: "egrid.SRMV.2024",
    MO: "egrid.SRMW.2024",
    MT: "egrid.NWPP.2024",
    NE: "egrid.MROW.2024",
    NV: "egrid.NWPP.2024",
    NH: "egrid.NEWE.2024",
    NJ: "egrid.RFCE.2024",
    NM: "egrid.AZNM.2024",
    NY: "egrid.NYCW.2024", // NYC metro is the largest load center; upstate is NYUP, Long Island NYLI
    NC: "egrid.SRVC.2024",
    ND: "egrid.MROW.2024",
    OH: "egrid.RFCW.2024",
    OK: "egrid.SPSO.2024",
    OR: "egrid.NWPP.2024",
    PA: "egrid.RFCE.2024", // eastern PA (Philadelphia); western PA is RFCW
    RI: "egrid.NEWE.2024",
    SC: "egrid.SRVC.2024",
    SD: "egrid.MROW.2024",
    TN: "egrid.SRTV.2024",
    TX: "egrid.ERCT.2024", // ERCOT serves ~90% of TX load; panhandle SPSO, El Paso AZNM
    UT: "egrid.NWPP.2024",
    VT: "egrid.NEWE.2024",
    VA: "egrid.SRVC.2024",
    WA: "egrid.NWPP.2024",
    WV: "egrid.RFCW.2024",
    WI: "egrid.MROE.2024",
    WY: "egrid.NWPP.2024",
  };
  return map[s] ?? "egrid.USAVG.2024";
}

export function egridLabel(factorId: string): string {
  return factorId.split(".")[1] ?? factorId;
}

/** QuickBooks expense category → USEEIO sector factor id.
 *  Deliberately unmapped (would double-count other scopes): "Utilities" (Scope 2),
 *  "Fuel" (Scope 1), "Waste Removal" (Scope 3 waste, measured in tons). Spend in
 *  categories absent from this map is surfaced as flagged unmapped spend - never dropped. */
export const QB_CATEGORY_TO_USEEIO: Record<string, { factorId: string; bucket: "travel" | "purchased" | "freight" }> = {
  "Travel - Airfare": { factorId: "useeio.air_travel.v2", bucket: "travel" },
  "Travel - Lodging": { factorId: "useeio.hotels.v2", bucket: "travel" },
  "Travel - Car Rental": { factorId: "useeio.car_rental.v2", bucket: "travel" },
  "Freight & Delivery": { factorId: "useeio.freight.v2", bucket: "freight" },
  "Shipping & Postage": { factorId: "useeio.freight.v2", bucket: "freight" },
  "Office Supplies": { factorId: "useeio.office_supplies.v2", bucket: "purchased" },
  "Software & Subscriptions": { factorId: "useeio.it_services.v2", bucket: "purchased" },
  "Professional Fees": { factorId: "useeio.prof_services.v2", bucket: "purchased" },
  "Materials & Equipment": { factorId: "useeio.materials.v2", bucket: "purchased" },
  "Meals & Catering": { factorId: "useeio.food.v2", bucket: "purchased" },
  // Professional services chart of accounts
  "Advertising & Marketing": { factorId: "useeio.advertising.v2", bucket: "purchased" },
  "Insurance": { factorId: "useeio.insurance.v2", bucket: "purchased" },
  "Rent & Lease": { factorId: "useeio.real_estate.v2", bucket: "purchased" },
  "Repairs & Maintenance": { factorId: "useeio.repairs.v2", bucket: "purchased" },
  "Legal & Accounting": { factorId: "useeio.prof_services.v2", bucket: "purchased" },
  "Consulting Fees": { factorId: "useeio.prof_services.v2", bucket: "purchased" },
  "Subcontractors": { factorId: "useeio.prof_services.v2", bucket: "purchased" },
  "IT & Cloud Services": { factorId: "useeio.it_services.v2", bucket: "purchased" },
  "Telecommunications": { factorId: "useeio.telecom.v2", bucket: "purchased" },
  "Printing & Reproduction": { factorId: "useeio.printing.v2", bucket: "purchased" },
  "Training & Education": { factorId: "useeio.education.v2", bucket: "purchased" },
  "Recruiting & HR": { factorId: "useeio.admin_services.v2", bucket: "purchased" },
  "Janitorial & Facilities": { factorId: "useeio.facilities.v2", bucket: "purchased" },
  // Manufacturing chart of accounts
  "Raw Materials": { factorId: "useeio.materials.v2", bucket: "purchased" },
  "Packaging Supplies": { factorId: "useeio.packaging.v2", bucket: "purchased" },
  "Chemicals & Solvents": { factorId: "useeio.chemicals.v2", bucket: "purchased" },
  "Metals & Fabrication": { factorId: "useeio.metals.v2", bucket: "purchased" },
  "Equipment Purchases": { factorId: "useeio.machinery.v2", bucket: "purchased" },
  "Contract Manufacturing": { factorId: "useeio.contract_mfg.v2", bucket: "purchased" },
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
