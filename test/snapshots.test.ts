import { describe, it, expect } from "vitest";
import { snapshotHash, restatementDiff } from "@/lib/snapshots";
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
});
