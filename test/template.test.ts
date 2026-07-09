import { describe, it, expect } from "vitest";
import { templateCsv, TEMPLATE_HEADERS } from "@/lib/ingestion/data-type-templates";
import { fuzzyMatchHeaders } from "@/lib/ingestion/fuzzy-match";
import { rowToLineItem } from "@/lib/ingestion/ingest";
import { SEED_FACTORS } from "@/lib/factors";

describe("downloadable template (Sendrow standard format)", () => {
  it("template headers all auto-map with high confidence — zero mapping work", () => {
    const usable = TEMPLATE_HEADERS.filter((h) => h !== "Notes" && h !== "Vendor / Reference");
    const matches = fuzzyMatchHeaders([...TEMPLATE_HEADERS]);
    for (const h of usable) {
      const m = matches.find((x) => x.header === h)!;
      expect(m.field, h).not.toBeNull();
    }
    // vendor/reference still maps (source_ref), just via alias
    expect(matches.find((x) => x.header === "Vendor / Reference")?.field).toBe("source_ref");
  });

  it("a filled utility template row computes emissions end-to-end", () => {
    const csv = templateCsv("utility_bills");
    const [header, first] = csv.split("\n");
    const headers = header.split(",");
    const cells = first.split(",");
    const row = Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
    const item = rowToLineItem(
      { date: row["Date"], activity_type: row["Activity Type"], quantity: Number(row["Quantity"]), unit: row["Unit"], source_ref: row["Vendor / Reference"] },
      SEED_FACTORS,
      "co_t",
      null,
      []
    );
    expect(item.status).toBe("mapped");
    expect(item.scope).toBe(2);
  });

  it("every data type has a template", () => {
    for (const dt of ["utility_bills", "fleet_fuel_dollar", "vendor_invoices", "commute_survey", "business_travel", "custom"] as const) {
      expect(templateCsv(dt)).toContain("Date,Activity Type,Quantity");
    }
  });
});
