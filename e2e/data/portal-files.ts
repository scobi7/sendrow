/** Files the portal E2E suite uploads. Generated at runtime so no binary fixture is committed. */
import * as XLSX from "xlsx";

/** Twelve monthly kWh readings, one per row. The header matches the utility_bills template. */
export const UTILITY_KWH: { month: string; kwh: number }[] = Array.from({ length: 12 }, (_, i) => ({
  month: `2025-${String(i + 1).padStart(2, "0")}`,
  kwh: 4100 + i * 265,
}));

export function utilityCsv(): string {
  return ["Month,kWh Used", ...UTILITY_KWH.map((r) => `${r.month},${r.kwh}`)].join("\n") + "\n";
}

/** Two vendor invoice rows on one sheet. Headers match the vendor_invoices template. */
export const VENDOR_ROWS = [
  { date: "2026-01", category: "shipping", amount: 5200, vendor: "Speedy Shipping Co" },
  { date: "2026-02", category: "packaging supplies", amount: 1400, vendor: "BoxCo Inc" },
];

export function vendorXlsx(): Buffer {
  const aoa: (string | number)[][] = [
    ["Date", "Category", "Amount ($)", "Vendor"],
    ...VENDOR_ROWS.map((r) => [r.date, r.category, r.amount, r.vendor]),
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Invoices");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

/** Fleet fuel typed in by hand: month, gallons. */
export const DIESEL_ENTRIES = [
  { month: "2026-01", gallons: "120" },
  { month: "2026-02", gallons: "95" },
];
