import { describe, it, expect } from "vitest";
import { REGULATORY_DATES, upcomingRegulatoryDates, regulatoryTimeline } from "@/lib/regulatory-dates";

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

  it("lists dated entries before undated (on hold) ones", () => {
    const ids = upcomingRegulatoryDates("2026-11-13", 10).map((r) => r.id);
    expect(ids.indexOf("sb253-scope12-2027")).toBeLessThan(ids.indexOf("sb261-paused"));
    expect(ids.indexOf("cdp-2027-close")).toBeLessThan(ids.indexOf("sb253-scope3-2027"));
  });

  it("sorts dated entries soonest first", () => {
    const ids = upcomingRegulatoryDates("2026-09-01").map((r) => r.id);
    expect(ids.slice(0, 2)).toEqual(["cdp-2026", "sb253-scope12-2026"]);
    expect(upcomingRegulatoryDates("2026-11-13").map((r) => r.id)).toEqual(["cdp-2027-open", "cdp-2027-close", "sb253-scope12-2027"]);
  });

  it("respects the limit", () => {
    expect(upcomingRegulatoryDates("2026-09-01", 1)).toHaveLength(1);
    expect(upcomingRegulatoryDates("2026-09-01", 2)).toHaveLength(2);
    expect(upcomingRegulatoryDates("2026-09-01")).toHaveLength(3);
  });
});

describe("regulatoryTimeline", () => {
  it("groups by regulation in a fixed order, upcoming dates before holds", () => {
    const t = regulatoryTimeline("2026-11-13");
    expect(t.map((g) => g.regulation)).toEqual(["SB 253", "SB 261", "CDP"]);
    expect(t[0].entries.map((e) => e.id)).toEqual(["sb253-scope12-2027", "sb253-scope3-2027"]);
    expect(t[2].entries.map((e) => e.id)).toEqual(["cdp-2027-open", "cdp-2027-close"]);
  });

  it("drops past entries", () => {
    const ids = regulatoryTimeline("2026-11-13").flatMap((g) => g.entries.map((e) => e.id));
    expect(ids).not.toContain("sb253-scope12-2026");
    expect(ids).not.toContain("cdp-2026");
  });
});
