import { describe, it, expect } from "vitest";
import { REGULATORY_DATES, upcomingRegulatoryDates } from "@/lib/regulatory-dates";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

describe("REGULATORY_DATES", () => {
  it("every entry has a source and a valid checkedOn date", () => {
    for (const r of REGULATORY_DATES) {
      expect(r.source.trim().length).toBeGreaterThan(0);
      expect(r.checkedOn).toMatch(ISO);
    }
  });

  it("every non-null date is ISO yyyy-mm-dd", () => {
    for (const r of REGULATORY_DATES) {
      if (r.date !== null) expect(r.date).toMatch(ISO);
    }
  });
});

describe("upcomingRegulatoryDates", () => {
  it("excludes past dated entries", () => {
    const ids = upcomingRegulatoryDates("2026-11-13").map((r) => r.id);
    expect(ids).not.toContain("sb253-scope12-2026");
    expect(ids).not.toContain("cdp-2026");
  });

  it("puts the tbd entry before the paused entry", () => {
    const ids = upcomingRegulatoryDates("2026-11-13").map((r) => r.id);
    expect(ids.indexOf("sb253-scope3-2027")).toBeGreaterThanOrEqual(0);
    expect(ids.indexOf("sb261-paused")).toBeGreaterThan(ids.indexOf("sb253-scope3-2027"));
  });

  it("sorts dated entries soonest first", () => {
    const ids = upcomingRegulatoryDates("2026-09-01").map((r) => r.id);
    expect(ids.slice(0, 2)).toEqual(["cdp-2026", "sb253-scope12-2026"]);
  });

  it("respects the limit", () => {
    expect(upcomingRegulatoryDates("2026-09-01", 1)).toHaveLength(1);
    expect(upcomingRegulatoryDates("2026-09-01", 2)).toHaveLength(2);
    expect(upcomingRegulatoryDates("2026-09-01")).toHaveLength(3);
  });
});
