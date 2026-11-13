/** Consultant-facing labels for the data types a request can ask for.
 *  Single source for the request form, the template form and the templates list. */
export const DATA_TYPE_OPTIONS: { key: string; label: string }[] = [
  { key: "utility_bills", label: "Electricity & gas" },
  { key: "fleet_fuel_dollar", label: "Fleet fuel" },
  { key: "vendor_invoices", label: "Spend data" },
  { key: "business_travel", label: "Business travel" },
  { key: "commute_survey", label: "Commute survey" },
  // existing_inventory (supplier-calculated) is selectable only once its rows are
  // labeled on the ledger, review page and exports (contracts/ §1).
];

export const DATA_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DATA_TYPE_OPTIONS.map((o) => [o.key, o.label])
);
