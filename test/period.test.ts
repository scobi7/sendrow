import { describe, it, expect } from "vitest";
import { periodForDate, periodTotals, yoyDelta } from "@/lib/period";

describe("periodForDate (Plan N4)", () => {
  it("calendar-year reporters get plain years", () => {
    expect(periodForDate("2026-03-15", 12)).toBe("2026");
    expect(periodForDate("2026-03", null)).toBe("2026");
    expect(periodForDate("3/15/2026", 12)).toBe("2026");
  });

  it("fiscal years are labeled by end year", () => {
    // FY ending June: July 2025 – June 2026 = FY2026
    expect(periodForDate("2026-03-01", 6)).toBe("FY2026");
    expect(periodForDate("2026-07-01", 6)).toBe("FY2027");
    expect(periodForDate("2025-08-10", 6)).toBe("FY2026");
  });

  it("bad or missing dates yield null, never a guess", () => {
    expect(periodForDate("", 12)).toBeNull();
    expect(periodForDate(undefined, 12)).toBeNull();
    expect(periodForDate("last month", 12)).toBeNull();
    expect(periodForDate("2026-13", 12)).toBeNull();
  });
});

describe("periodTotals + yoyDelta", () => {
  const items = [
    { period: "2025", scope: 2, co2eKg: 1000, status: "mapped" },
    { period: "2025", scope: 3, co2eKg: 500, status: "mapped" },
    { period: "2026", scope: 2, co2eKg: 800, status: "mapped" },
    { period: "2026", scope: 1, co2eKg: 100, status: "unmapped" }, // excluded: zero-emission flag
    { period: null, scope: 1, co2eKg: 50, status: "mapped" },
  ];

  it("groups mapped items by period, untagged last-class", () => {
    const totals = periodTotals(items);
    expect(totals).toEqual([
      { period: "2025", scope1: 0, scope2: 1000, scope3: 500, total: 1500 },
      { period: "2026", scope1: 0, scope2: 800, scope3: 0, total: 800 },
      { period: "untagged", scope1: 50, scope2: 0, scope3: 0, total: 50 },
    ]);
  });

  it("yoy compares the two most recent tagged periods", () => {
    const yoy = yoyDelta(periodTotals(items));
    expect(yoy?.current).toBe("2026");
    expect(yoy?.previous).toBe("2025");
    expect(yoy?.pct).toBeCloseTo(-46.67, 1);
  });

  it("yoy is null with fewer than two tagged periods", () => {
    expect(yoyDelta([{ period: "2026", total: 100 }])).toBeNull();
    expect(yoyDelta([{ period: "untagged", total: 1 }, { period: "2026", total: 2 }])).toBeNull();
  });
});
