import { describe, it, expect } from "vitest";
import React from "react";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { GHGReportPDF } from "@/components/pdf/GHGReportPDF";
import type { Company } from "@/lib/types";

// 1x1 transparent PNG, used to exercise the logo branch of the report.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

function fakeCompany(): Company {
  return {
    id: "test-company",
    name: "Test Supplier Co",
    industry: null,
    headcountRange: null,
    locations: [],
    fiscalYearEndMonth: 12,
    reportingFramework: null,
    setupComplete: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    inputs: {},
    calcs: [
      { id: "calc-1", scope: 1, category: "Fleet fuel - diesel", co2eTons: 1.5, factorId: null, formula: "test", basis: "measured" },
    ],
    sectionStatus: {} as Company["sectionStatus"],
    reportGeneratedAt: null,
    actionPlan: null,
  };
}

const totals = { scope1: 1.5, scope2Location: 0, scope2Market: 0, scope3: 0, total: 1.5 };

async function render(brand: React.ComponentProps<typeof GHGReportPDF>["brand"]) {
  const element = React.createElement(GHGReportPDF, {
    company: fakeCompany(),
    totals,
    lineItemCount: 0,
    lineItemFactorIds: [],
    screeningDecisions: [],
    brand,
  }) as unknown as React.ReactElement<React.ComponentProps<typeof Document>>;
  return renderToBuffer(element);
}

describe("GHGReportPDF", () => {
  it("renders without a brand", async () => {
    const buffer = await render(null);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  it("renders with a brand that has no logo and a custom accent", async () => {
    const buffer = await render({ name: "Green Advisors", accent: "#AA3300", logo: null });
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  it("renders with a brand logo (PNG)", async () => {
    const buffer = await render({ name: "Green Advisors", accent: "#AA3300", logo: { data: PNG_1PX, format: "png" } });
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });
});
