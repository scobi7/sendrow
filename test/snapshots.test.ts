import { describe, it, expect } from "vitest";
import { snapshotHash, restatementDiff, freezeManualCalcs, canonicalJson } from "@/lib/snapshots";
import type { SnapshotTotals } from "@/lib/snapshots";

const T = (total: number, scope2 = 10): SnapshotTotals => ({
  scope1: 5,
  scope2Location: scope2,
  scope2Market: scope2,
  scope3: total - 5 - scope2,
  total,
});

describe("snapshots (Plan T3, invariant §13)", () => {
  it("hash is stable for identical content, changes with any edit", () => {
    const items = [{ sourceRef: "PG&E", co2eKg: "100" }];
    expect(snapshotHash(T(100), items)).toBe(snapshotHash(T(100), items));
    expect(snapshotHash(T(100), items)).not.toBe(snapshotHash(T(101), items));
    expect(snapshotHash(T(100), items)).not.toBe(snapshotHash(T(100), [{ sourceRef: "PG&E", co2eKg: "100.1" }]));
  });

  it("restatement diff lists exactly what changed, with percentages", () => {
    const changes = restatementDiff(T(100, 10), T(90, 5));
    const labels = changes.map((c) => c.label);
    expect(labels).toContain("Scope 2 (location)");
    expect(labels).toContain("Total");
    expect(labels).not.toContain("Scope 1"); // unchanged
    const total = changes.find((c) => c.label === "Total")!;
    expect(total.previous).toBe(100);
    expect(total.current).toBe(90);
    expect(total.pct).toBeCloseTo(-10);
  });

  it("identical snapshots produce no restatement", () => {
    expect(restatementDiff(T(100), T(100))).toEqual([]);
  });

  it("manual calcs freeze as origin 'manual' rows with co2eKg = tons * 1000", () => {
    const rows = freezeManualCalcs([
      { id: "c1", scope: 1, category: "Fleet fuel - diesel", co2eTons: 2.5, factorId: "epa.diesel", formula: "100 gal x 0.0100 t/gal", basis: "measured" },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      origin: "manual",
      sourceRef: "Manual entry",
      scope: 1,
      category: "Fleet fuel - diesel",
      rawValue: "",
      rawUnit: "",
      co2eKg: "2500",
      period: null,
      factorId: "epa.diesel",
      locationId: null,
      calcLog: { formula: "100 gal x 0.0100 t/gal", basis: "measured", marketBasedTons: null },
    });
  });
});

describe("snapshot hash is reproducible from stored rows (canonical JSON)", () => {
  it("the same content with keys in a different order gives the same hash", () => {
    const totals = T(100);
    const reordered = { total: totals.total, scope3: totals.scope3, scope2Market: totals.scope2Market, scope2Location: totals.scope2Location, scope1: totals.scope1 };
    const items = [{ sourceRef: "PG&E", co2eKg: "100", calcLog: { formula: "x", basis: "y" } }];
    const itemsReordered = [{ calcLog: { basis: "y", formula: "x" }, co2eKg: "100", sourceRef: "PG&E" }];
    expect(snapshotHash(reordered, itemsReordered)).toBe(snapshotHash(totals, items));
  });

  it("a changed value gives a different hash", () => {
    const items = [{ sourceRef: "PG&E", co2eKg: "100" }];
    expect(snapshotHash(T(100), items)).not.toBe(snapshotHash(T(100), [{ sourceRef: "PG&E", co2eKg: "100.5" }]));
  });

  it("a known input gives a fixed hex string (catches any change to the hashing)", () => {
    const totals: SnapshotTotals = { scope1: 5, scope2Location: 10, scope2Market: 8, scope3: 85, total: 100 };
    expect(snapshotHash(totals, [{ sourceRef: "PG&E", co2eKg: "100" }])).toBe(
      "2ce096c7de82ebb8b516b496e7aaaa2f3fc1d528b9ba3b16b2006e09d4001a73"
    );
  });

  it("canonicalJson sorts keys at every depth and keeps array order", () => {
    expect(canonicalJson({ b: [{ z: 1, a: 2 }, { y: 1, x: 2 }], a: { d: 1, c: 2 } })).toBe(
      '{"a":{"c":2,"d":1},"b":[{"a":2,"z":1},{"x":2,"y":1}]}'
    );
  });
});
