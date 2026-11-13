import type { StandardField } from "./fuzzy-match";

export type DataType =
  | "utility_bills"
  | "fleet_fuel_dollar"
  | "vendor_invoices"
  | "commute_survey"
  | "business_travel"
  | "existing_inventory"
  | "custom";

export type DataTypeConfig = {
  label: string;
  description: string;
  columnTemplate: Record<string, StandardField>;
  requiresFuelPrices?: boolean;
  /** "supplier_calculated" rows keep the supplier's own CO2e figure; no factor is applied. */
  rowKind?: "activity" | "supplier_calculated";
};

export const DATA_TYPE_CONFIGS: Record<DataType, DataTypeConfig> = {
  utility_bills: {
    label: "Utility bills",
    description: "Electricity (kWh), natural gas (therms), propane - from utility statements",
    columnTemplate: {
      Month: "date",
      month: "date",
      "kWh Used": "quantity",
      kwh: "quantity",
      "Meter Read Type": "confidence",
      therms: "unit",
      "Natural Gas (therms)": "quantity",
      "Propane (gallons)": "quantity",
    },
  },
  fleet_fuel_dollar: {
    label: "Fleet fuel (dollar-based)",
    description: "Fuel card exports with total $ spend - you'll enter $/gallon to convert",
    columnTemplate: {
      Month: "date",
      month: "date",
      "Vehicle ID": "source_ref",
      "Fuel Type": "activity_type",
      "Total $ Charged": "quantity",
      "Total $": "quantity",
      Amount: "quantity",
    },
    requiresFuelPrices: true,
  },
  vendor_invoices: {
    label: "Vendor invoices",
    description: "Accounts payable exports - spend-based Scope 3 (purchased goods & services)",
    columnTemplate: {
      Vendor: "source_ref",
      Category: "activity_type",
      "Amount ($)": "quantity",
      Amount: "quantity",
      Date: "date",
    },
  },
  commute_survey: {
    label: "Commute survey",
    description: "Employee commute mode and miles - partial surveys are flagged automatically",
    columnTemplate: {
      "Employee ID": "source_ref",
      "One-Way (miles)": "quantity",
      "One-Way Miles": "quantity",
      "Primary Mode": "activity_type",
      Mode: "activity_type",
    },
  },
  business_travel: {
    label: "Business travel",
    description: "Flight city pairs or expense report travel entries",
    columnTemplate: {
      Employee: "source_ref",
      Origin: "notes",
      Destination: "notes",
      Purpose: "category",
      "Round Trip?": "notes",
    },
  },
  existing_inventory: {
    label: "Existing inventory or prior calculation",
    description: "CO2e already calculated by the supplier, one row per emission source, kept as the supplier stated it and never re-factored",
    columnTemplate: {},
    rowKind: "supplier_calculated",
  },
  custom: {
    label: "Other / custom",
    description: "Anything else - map columns manually",
    columnTemplate: {},
  },
};

/** Merge a data type's column template with fuzzy-match results.
 *  Template takes precedence over fuzzy suggestions. */
export function applyTemplate(
  headers: string[],
  dataType: DataType,
  fuzzyResults: { header: string; field: string | null }[]
): Record<string, string> {
  const template = DATA_TYPE_CONFIGS[dataType].columnTemplate;
  const map: Record<string, string> = {};

  for (const header of headers) {
    if (template[header]) {
      map[header] = template[header];
    } else {
      const fuzzy = fuzzyResults.find((f) => f.header === header);
      if (fuzzy?.field) map[header] = fuzzy.field;
    }
  }
  return map;
}

/** Downloadable starter template (Plan T2 follow-up): canonical headers that
 *  auto-map perfectly, with example rows per data type. Always optional -  *  any file shape still works through the confirm-mapping screen. */
export const TEMPLATE_HEADERS = ["Date", "Activity Type", "Quantity", "Unit", "Vendor / Reference", "Notes"] as const;

/** Template for supplier-calculated emissions (existing_inventory). */
export const SUPPLIER_TEMPLATE_HEADERS = ["Scope", "Category", "Description", "Emissions", "Unit", "Method", "Emission factor source", "Reporting year"] as const;

const TEMPLATE_EXAMPLES: Record<DataType, string[][]> = {
  utility_bills: [
    ["2026-01", "electricity", "1240", "kWh", "PG&E acct 4402", ""],
    ["2026-01", "natural gas", "84", "therms", "PG&E acct 4402", ""],
  ],
  fleet_fuel_dollar: [
    ["2026-01", "diesel", "120", "gallons", "TRK-01", "or enter $ spent and your consultant converts"],
    ["2026-01", "gasoline", "95", "gallons", "TRK-03", ""],
  ],
  vendor_invoices: [
    ["2026-01", "shipping", "5200", "USD", "Speedy Shipping Co", "invoice 1183"],
    ["2026-02", "packaging supplies", "1400", "USD", "BoxCo Inc", "invoice 2210"],
  ],
  commute_survey: [
    ["2026-01", "commute", "8200", "miles", "all employees, monthly total", ""],
  ],
  business_travel: [
    ["2026-03", "air travel", "2400", "USD", "Delta / corporate card", ""],
    ["2026-03", "hotels", "980", "USD", "Marriott", ""],
  ],
  existing_inventory: [
    ["1", "Stationary combustion", "Natural gas, main boiler", "12.4", "tCO2e", "Activity-based, EPA factors", "EPA GHG Emission Factors Hub 2025", "2025"],
    ["2", "Purchased electricity", "All sites, location-based", "48.9", "tCO2e", "Location-based, eGRID", "EPA eGRID2023", "2025"],
  ],
  custom: [
    ["2026-01", "describe the activity", "100", "unit (kWh, gallons, USD…)", "who it came from", ""],
  ],
};

export function templateCsv(dataType: DataType): string {
  const rows = TEMPLATE_EXAMPLES[dataType] ?? TEMPLATE_EXAMPLES.custom;
  const headers = dataType === "existing_inventory" ? SUPPLIER_TEMPLATE_HEADERS : TEMPLATE_HEADERS;
  return [headers.join(","), ...rows.map((r) => r.map((c) => (c.includes(",") ? `"${c}"` : c)).join(","))].join("\n");
}
