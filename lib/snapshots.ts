import { createHash } from "crypto";
import type { CalcResult } from "./types";

/** Pure snapshot helpers (Plan T3). A snapshot freezes totals + line items;
 *  its sha256 proves the content never changed after freezing (§13). */

export type SnapshotTotals = {
  scope1: number;
  scope2Location: number;
  scope2Market: number;
  scope3: number;
  total: number;
};

/** JSON with object keys sorted at every depth and arrays kept in order.
 *  Postgres jsonb does not keep key order, so the hash must not depend on it. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (value !== null && typeof value === "object" && typeof (value as { toJSON?: unknown }).toJSON === "function") {
    return canonicalize((value as { toJSON: () => unknown }).toJSON());
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v === undefined) continue;
      out[key] = canonicalize(v);
    }
    return out;
  }
  return value;
}

export function snapshotHash(totals: SnapshotTotals, lineItems: unknown[]): string {
  return createHash("sha256")
    .update(canonicalJson({ totals, lineItems }))
    .digest("hex");
}

export type RestatementLine = { label: string; previous: number; current: number; pct: number | null };

/** What changed between two snapshots' totals - the body of a restatement alert. */
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

/** Manual-entry calcs (company.calcs) frozen as line-item rows, so the
 *  snapshot's line items add up to its totals (§1: co2e is never written
 *  here, only carried over from the calc that already produced it). */
export function freezeManualCalcs(calcs: CalcResult[]) {
  return calcs.map((c) => ({
    origin: "manual" as const,
    sourceRef: "Manual entry",
    scope: c.scope,
    category: c.category,
    rawValue: "",
    rawUnit: "",
    co2eKg: String(Math.round(c.co2eTons * 1000 * 10000) / 10000),
    period: null,
    factorId: c.factorId,
    calcLog: { formula: c.formula, basis: c.basis, marketBasedTons: c.marketBasedTons ?? null },
    locationId: null,
  }));
}
