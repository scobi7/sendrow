import { describe, it, expect } from "vitest";
import { buildTrace } from "@/lib/trace";

const SOURCE = { source: "EPA GHG Emission Factors Hub", sourceUrl: "https://www.epa.gov/climateleadership/ghg-emission-factors-hub" };

describe("buildTrace", () => {
  it("traces an activity-based calculation from calcLog", () => {
    const t = buildTrace(
      {
        rawValue: "120",
        rawUnit: "gallon",
        factorId: "fuel.diesel.2025",
        confidence: "actual",
        period: "2025",
        locationName: "Plant A",
        calcLog: {
          raw_value: 120,
          raw_unit: "gallon",
          factor_id: "fuel.diesel.2025",
          factor_name: "Diesel fuel",
          factor_value: 0.01021,
          factor_unit: "tCO2e/gallon",
          factor_vintage: 2025,
          formula: "120 gallon × 0.01021 tCO2e/gallon × 1000 kg/t",
          co2e_kg: 1225.2,
          computed_at: "2026-01-02T00:00:00.000Z",
        },
      },
      SOURCE
    );
    expect(t.activity).toBe("120 gallon");
    expect(t.factorId).toBe("fuel.diesel.2025");
    expect(t.factorName).toBe("Diesel fuel");
    expect(t.factorValue).toBe("0.01021");
    expect(t.factorUnit).toBe("tCO2e/gallon");
    expect(t.factorYear).toBe(2025);
    expect(t.source).toBe(SOURCE.source);
    expect(t.sourceUrl).toBe(SOURCE.sourceUrl);
    expect(t.method).toBe("Activity-based");
    expect(t.formula).toContain("120 gallon");
    expect(t.computedAt).toBe("2026-01-02T00:00:00.000Z");
    expect(t.assumptions).toEqual(["Reporting period 2025", "Site: Plant A"]);
  });

  it("marks a spend-based calculation and explains the dollar conversion", () => {
    const t = buildTrace(
      {
        rawValue: "5000.00",
        rawUnit: "USD",
        factorId: "useeio.freight.v2",
        confidence: "estimated",
        period: null,
        calcLog: {
          factor_id: "useeio.freight.v2",
          factor_name: "Truck transportation",
          factor_value: 0.00092,
          factor_unit: "tCO2e/USD",
          factor_vintage: 2022,
          formula: "5000 USD × 0.00092 tCO2e/USD × 1000 kg/t",
          computed_at: "2026-01-02T00:00:00.000Z",
          dollar_amount: 5000,
          price_per_gal: 3.5,
          derived_gallons: 1428.57,
          vendor_mapping_id: "vm_123",
          unit_conversion: "1 MWh = 1000 kWh",
        },
      },
      SOURCE
    );
    expect(t.method).toBe("Spend-based (EEIO)");
    expect(t.factorYear).toBe(2022);
    expect(t.assumptions).toContain("Estimated value, not yet confirmed as actual");
    expect(t.assumptions).toContain("No reporting period tagged (row has no date)");
    expect(t.assumptions).toContain("Spend of $5000 converted to gallons at $3.5 per gallon, giving 1428.57 gallons");
    expect(t.assumptions).toContain("Factor chosen by a confirmed vendor mapping (ID vm_123)");
    expect(t.assumptions).toContain("Unit converted before the factor was applied: 1 MWh = 1000 kWh");
  });

  it("returns nulls and no throw for an empty calcLog", () => {
    const t = buildTrace({ rawValue: "10", rawUnit: "kWh", factorId: null, calcLog: {}, confidence: "estimated", period: "2025" }, null);
    expect(t.factorId).toBeNull();
    expect(t.factorName).toBeNull();
    expect(t.factorValue).toBeNull();
    expect(t.factorUnit).toBeNull();
    expect(t.factorYear).toBeNull();
    expect(t.source).toBeNull();
    expect(t.sourceUrl).toBeNull();
    expect(t.formula).toBeNull();
    expect(t.computedAt).toBeNull();
    expect(t.method).toBe("Activity-based");
    expect(t.assumptions).toEqual(["Estimated value, not yet confirmed as actual", "Reporting period 2025"]);
  });

  it("does not throw when calcLog is not an object", () => {
    const t = buildTrace({ rawValue: "0", rawUnit: "", factorId: null, calcLog: null, confidence: "flagged", period: null });
    expect(t.factorYear).toBeNull();
    expect(t.method).toBe("Activity-based");
  });
});
