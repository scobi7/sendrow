import { createHash } from "crypto";

/** Pure snapshot helpers (Plan T3). A snapshot freezes totals + line items;
 *  its sha256 proves the content never changed after freezing (§13). */

export type SnapshotTotals = {
  scope1: number;
  scope2Location: number;
  scope2Market: number;
  scope3: number;
  total: number;
};

export function snapshotHash(totals: SnapshotTotals, lineItems: unknown[]): string {
  return createHash("sha256")
    .update(JSON.stringify({ totals, lineItems }))
    .digest("hex");
}

export type RestatementLine = { label: string; previous: number; current: number; pct: number | null };

/** What changed between two snapshots' totals — the body of a restatement alert. */
export function restatementDiff(previous: SnapshotTotals, current: SnapshotTotals): RestatementLine[] {
  const rows: [string, number, number][] = [
    ["Scope 1", previous.scope1, current.scope1],
    ["Scope 2 (location)", previous.scope2Location, current.scope2Location],
    ["Scope 2 (market)", previous.scope2Market, current.scope2Market],
    ["Scope 3", previous.scope3, current.scope3],
    ["Total", previous.total, current.total],
  ];
  return rows
    .filter(([, prev, curr]) => Math.abs(prev - curr) > 1e-9)
    .map(([label, prev, curr]) => ({
      label,
      previous: prev,
      current: curr,
      pct: prev !== 0 ? ((curr - prev) / prev) * 100 : null,
    }));
}
