import { describe, it, expect } from "vitest";
import { questionnaireMapping } from "@/lib/mapping";
import { createCompanyRecord } from "@/lib/newcompany";
import { combinedTotals } from "@/lib/calc";
import type { Totals } from "@/lib/calc";

const fixture = () => {
  const c = createCompanyRecord("Map Co");
  c.fiscalYearEndMonth = 12;
  return c;
};

const tot: Totals = { scope1: 12.5, scope2Location: 4, scope2Market: 3, scope3: 20, total: 36.5 };

describe("questionnaireMapping uses the totals passed in", () => {
  it("CDP, EcoVadis and Walmart answers use the combined totals, not manual calcs only", () => {
    const c = fixture();
    const cdp = questionnaireMapping(c, "CDP Supply Chain", tot);
    expect(cdp.find((r) => r.questionId === "C6.1")!.yourValue).toBe("12.5 tCO2e");
    const eco = questionnaireMapping(c, "EcoVadis", tot);
    expect(eco.find((r) => r.questionId === "ENV-1")!.yourValue).toBe("16.5 tCO2e");
    const wal = questionnaireMapping(c, "Walmart Supplier Sustainability", tot);
    expect(wal.find((r) => r.questionId === "W-2")!.yourValue).toBe("36.5 tCO2e");
  });

  it("an empty company with zero totals shows zero, and line-item totals change the answer", () => {
    const c = fixture();
    const zero: Totals = { scope1: 0, scope2Location: 0, scope2Market: 0, scope3: 0, total: 0 };
    expect(questionnaireMapping(c, "Generic", zero).find((r) => r.questionId === "G-5")!.yourValue).toBe("0 tCO2e");
    const items = [{ scope: 2, co2eKg: "2000", status: "mapped" }];
    const combined = combinedTotals(c, items);
    expect(questionnaireMapping(c, "Generic", combined).find((r) => r.questionId === "G-2")!.yourValue).toBe("2 tCO2e");
  });
});
