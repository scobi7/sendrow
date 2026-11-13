import { describe, it, expect } from "vitest";
import {
  matchSupplierHeaders,
  supplierRowToLineItem,
  isSupplierCalculated,
  parseSupplierScope,
} from "@/lib/ingestion/supplier-calculated";
import { templateCsv, DATA_TYPE_CONFIGS, SUPPLIER_TEMPLATE_HEADERS } from "@/lib/ingestion/data-type-templates";

const CTX = { companyId: "co_test", mappingProfileId: "mp_test", evidenceId: "ev_test" };

const STANDARD_HEADERS = ["Scope", "Category", "Description", "Emissions", "Unit", "Method", "Emission factor source", "Reporting year"];
const STANDARD_MAP = matchSupplierHeaders(STANDARD_HEADERS);

function row(overrides: Record<string, string>): Record<string, string> {
  return {
    Scope: "1",
    Category: "Stationary combustion",
    Description: "Natural gas, main boiler",
    Emissions: "12.4",
    Unit: "tCO2e",
    Method: "Activity-based, EPA factors",
    "Emission factor source": "EPA GHG Emission Factors Hub 2025",
    "Reporting year": "2025",
    ...overrides,
  };
}

describe("matchSupplierHeaders", () => {
  it("matches messy headers regardless of case, spacing and punctuation", () => {
    const map = matchSupplierHeaders([
      "  SCOPE ",
      "Emission Category",
      "Site",
      "Emissions (tCO2e)",
      "Units",
      "Methodology",
      "EF Source",
      "Fiscal Year",
    ]);
    expect(map).toEqual({
      scope: "  SCOPE ",
      category: "Emission Category",
      description: "Site",
      emissions: "Emissions (tCO2e)",
      unit: "Units",
      method: "Methodology",
      factorSource: "EF Source",
      reportingYear: "Fiscal Year",
    });
  });

  it("maps each header to at most one field and ignores unknown headers", () => {
    const map = matchSupplierHeaders(["Junk column", "Emissions", "tCO2e"]);
    expect(map.emissions).toBe("Emissions");
    expect(Object.values(map).filter((h) => h === "tCO2e")).toHaveLength(0);
    expect(Object.values(map)).not.toContain("Junk column");
  });
});

describe("parseSupplierScope", () => {
  it("accepts '1', 'Scope 2' and 'S3'", () => {
    expect(parseSupplierScope("1")).toBe(1);
    expect(parseSupplierScope("Scope 2")).toBe(2);
    expect(parseSupplierScope("S3")).toBe(3);
  });

  it("rejects scopes outside 1 to 3", () => {
    expect(parseSupplierScope("Scope 7")).toBeNull();
    expect(parseSupplierScope("")).toBeNull();
  });
});

describe("supplierRowToLineItem", () => {
  it("converts tonnes to kg and keeps the stated figure", () => {
    const item = supplierRowToLineItem(row({}), STANDARD_MAP, CTX);
    expect(item.status).toBe("mapped");
    expect(item.co2eKg).toBe("12400.0000");
    expect(item.rawValue).toBe("12.4");
    expect(item.rawUnit).toBe("tCO2e");
    expect(item.factorId).toBeNull();
    expect(item.confidence).toBe("supplier_calculated");
    expect(item.scope).toBe(1);
    expect(item.category).toBe("stationary_combustion");
    expect(item.sourceRef).toBe("Natural gas, main boiler");
    expect(item.period).toBe("2025");
    expect(item.mappingProfileId).toBe("mp_test");
    expect(item.companyId).toBe("co_test");
    expect(item.id).toBeTruthy();
  });

  it("passes kilograms through unchanged", () => {
    const item = supplierRowToLineItem(row({ Emissions: "850", Unit: "kgCO2e" }), STANDARD_MAP, CTX);
    expect(item.status).toBe("mapped");
    expect(item.co2eKg).toBe("850.0000");
    expect(item.rawUnit).toBe("kgCO2e");
  });

  it("parses thousands commas in the emissions figure", () => {
    const item = supplierRowToLineItem(row({ Emissions: "1,234.5" }), STANDARD_MAP, CTX);
    expect(item.status).toBe("mapped");
    expect(item.rawValue).toBe("1234.5");
    expect(item.co2eKg).toBe("1234500.0000");
  });

  it("infers the unit from an 'Emissions (tCO2e)' header when there is no unit column", () => {
    const headers = ["Scope", "Description", "Emissions (tCO2e)"];
    const map = matchSupplierHeaders(headers);
    const item = supplierRowToLineItem({ Scope: "S2", Description: "Grid electricity", "Emissions (tCO2e)": "48.9" }, map, CTX);
    expect(item.status).toBe("mapped");
    expect(item.rawUnit).toBe("tCO2e");
    expect(item.co2eKg).toBe("48900.0000");
    expect(item.scope).toBe(2);
  });

  it("infers kilograms from a 'Emissions (kgCO2e)' header", () => {
    const map = matchSupplierHeaders(["Scope", "Emissions (kgCO2e)"]);
    const item = supplierRowToLineItem({ Scope: "3", "Emissions (kgCO2e)": "500" }, map, CTX);
    expect(item.rawUnit).toBe("kgCO2e");
    expect(item.co2eKg).toBe("500.0000");
  });

  it("flags an invalid scope as unmapped with a reason, and does not drop the row", () => {
    const item = supplierRowToLineItem(row({ Scope: "Scope 7" }), STANDARD_MAP, CTX);
    expect(item.status).toBe("unmapped");
    expect(item.confidence).toBe("flagged");
    expect(item.co2eKg).toBe("0");
    expect(item.factorId).toBeNull();
    expect(isSupplierCalculated(item.calcLog)).toBe(true);
    const log = item.calcLog as { reason: string; raw_emissions: string };
    expect(log.reason).toContain("Scope must be 1, 2 or 3");
    expect(log.raw_emissions).toBe("12.4");
  });

  it("flags an unknown unit as unmapped with a reason", () => {
    const item = supplierRowToLineItem(row({ Unit: "MWh" }), STANDARD_MAP, CTX);
    expect(item.status).toBe("unmapped");
    expect(item.co2eKg).toBe("0");
    expect((item.calcLog as { reason: string }).reason).toContain('Unit "MWh" is not tCO2e or kgCO2e');
  });

  it("flags a non-numeric emissions figure instead of dropping it", () => {
    const item = supplierRowToLineItem(row({ Emissions: "about 12" }), STANDARD_MAP, CTX);
    expect(item.status).toBe("unmapped");
    expect((item.calcLog as { reason: string }).reason).toContain("Emissions must be a number");
  });

  it("uses supplier_reported when the category is blank and drops no period for a non-year value", () => {
    const item = supplierRowToLineItem(row({ Category: "", "Reporting year": "Q3 2025" }), STANDARD_MAP, CTX);
    expect(item.category).toBe("supplier_reported");
    expect(item.period).toBeNull();
  });

  it("records the evidence id and the stated fields in the calc log", () => {
    const item = supplierRowToLineItem(row({}), STANDARD_MAP, CTX);
    expect(item.calcLog).toMatchObject({
      origin: "supplier_calculated",
      stated_value: 12.4,
      stated_unit: "tCO2e",
      stated_method: "Activity-based, EPA factors",
      stated_factor_source: "EPA GHG Emission Factors Hub 2025",
      reporting_year: "2025",
      evidence_id: "ev_test",
    });
  });
});

describe("isSupplierCalculated", () => {
  it("is true only for a calc log with origin supplier_calculated", () => {
    expect(isSupplierCalculated({ origin: "supplier_calculated" })).toBe(true);
    expect(isSupplierCalculated({ origin: "factor" })).toBe(false);
    expect(isSupplierCalculated({ factor_id: "fuel.diesel.2025" })).toBe(false);
    expect(isSupplierCalculated(null)).toBe(false);
    expect(isSupplierCalculated(undefined)).toBe(false);
    expect(isSupplierCalculated("supplier_calculated")).toBe(false);
  });
});

describe("existing_inventory config and template", () => {
  it("is a supplier_calculated data type with no column template", () => {
    expect(DATA_TYPE_CONFIGS.existing_inventory.rowKind).toBe("supplier_calculated");
    expect(DATA_TYPE_CONFIGS.existing_inventory.columnTemplate).toEqual({});
    expect(DATA_TYPE_CONFIGS.utility_bills.rowKind).toBeUndefined();
  });

  it("templateCsv('existing_inventory') starts with the supplier headers", () => {
    const lines = templateCsv("existing_inventory").split("\n");
    expect(lines[0]).toBe(SUPPLIER_TEMPLATE_HEADERS.join(","));
    expect(lines[0]).toBe("Scope,Category,Description,Emissions,Unit,Method,Emission factor source,Reporting year");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe('1,Stationary combustion,"Natural gas, main boiler",12.4,tCO2e,"Activity-based, EPA factors",EPA GHG Emission Factors Hub 2025,2025');
    expect(lines[2]).toBe('2,Purchased electricity,"All sites, location-based",48.9,tCO2e,"Location-based, eGRID",EPA eGRID2023,2025');
  });

  it("templateCsv('utility_bills') is unchanged", () => {
    expect(templateCsv("utility_bills")).toBe(
      [
        "Date,Activity Type,Quantity,Unit,Vendor / Reference,Notes",
        "2026-01,electricity,1240,kWh,PG&E acct 4402,",
        "2026-01,natural gas,84,therms,PG&E acct 4402,",
      ].join("\n")
    );
  });
});
