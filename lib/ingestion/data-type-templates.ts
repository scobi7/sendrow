import type { StandardField } from "./fuzzy-match";

export type DataType =
  | "utility_bills"
  | "fleet_fuel_dollar"
  | "vendor_invoices"
  | "commute_survey"
  | "business_travel"
  | "custom";

export type DataTypeConfig = {
  label: string;
  description: string;
  columnTemplate: Record<string, StandardField>;
  requiresFuelPrices?: boolean;
};

export const DATA_TYPE_CONFIGS: Record<DataType, DataTypeConfig> = {
  utility_bills: {
    label: "Utility bills",
    description: "Electricity (kWh), natural gas (therms), propane — from utility statements",
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
    description: "Fuel card exports with total $ spend — you'll enter $/gallon to convert",
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
    description: "Accounts payable exports — spend-based Scope 3 (purchased goods & services)",
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
    description: "Employee commute mode and miles — partial surveys are flagged automatically",
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
  custom: {
    label: "Other / custom",
    description: "Anything else — map columns manually",
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
