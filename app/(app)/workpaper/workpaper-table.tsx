"use client";

import { useState } from "react";
import type { CalcLog } from "@/lib/factor-engine";
import type { UnmappedLog } from "@/lib/ingestion/ingest";

type LineItem = {
  id: string;
  scope: number;
  category: string;
  rawValue: string | null;
  rawUnit: string;
  co2eKg: string | null;
  confidence: string;
  status: string;
  factorId: string | null;
  calcLog: unknown;
  sourceRef: string;
  createdAt: string;
};

export function WorkpaperTable({ items }: { items: LineItem[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--divider)" }}>
      <table className="w-full text-sm">
        <thead style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Scope</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Category</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Raw value</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>kgCO₂e</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Confidence</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Source ref</th>
            <th className="w-8 px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const isExpanded = expanded.has(item.id);
            const isUnmapped = item.status === "unmapped";
            const log = isUnmapped ? null : (item.calcLog as CalcLog | null);
            const unmappedLog = isUnmapped ? (item.calcLog as UnmappedLog | null) : null;
            return (
              <>
                <tr
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className="cursor-pointer transition-colors"
                  style={{
                    background: isUnmapped ? "var(--danger-tint)" : isExpanded ? "var(--primary-tint)" : i % 2 === 0 ? "var(--card)" : "var(--surface)",
                    borderTop: i > 0 ? "1px solid var(--divider)" : undefined,
                  }}
                >
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: "var(--primary-tint)", color: "var(--primary)" }}
                    >
                      S{item.scope}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "var(--text)" }}>
                    {item.category.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.rawValue} {item.rawUnit}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {Number(item.co2eKg).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs"
                      style={
                        isUnmapped
                          ? { background: "var(--danger-border)", color: "var(--danger)", fontWeight: 600 }
                          : item.confidence === "actual"
                          ? { background: "var(--primary-tint)", color: "var(--primary)" }
                          : { background: "var(--divider)", color: "var(--text-muted)" }
                      }
                    >
                      {isUnmapped ? "⚠ unmapped" : item.confidence}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{item.sourceRef || "—"}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    {isExpanded ? "▲" : "▼"}
                  </td>
                </tr>

                {isExpanded && unmappedLog && (
                  <tr key={`${item.id}-log`} style={{ background: "var(--danger-tint)", borderTop: "1px solid var(--danger-border)" }}>
                    <td colSpan={7} className="px-6 py-4">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--danger)" }}>
                        Flagged — could not be mapped
                      </p>
                      <p className="text-sm" style={{ color: "var(--text)" }}>{unmappedLog.reason}</p>
                      <p className="mt-2 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                        raw: {unmappedLog.raw_value ?? "—"} {unmappedLog.raw_unit || "(no unit)"} · activity: {unmappedLog.activity_type || "—"}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        This row contributes 0 kgCO₂e until it is categorized. It is counted against your data quality score and is visible to your reviewer.
                      </p>
                    </td>
                  </tr>
                )}

                {isExpanded && log && (
                  <tr key={`${item.id}-log`} style={{ background: "var(--bg)", borderTop: "1px solid var(--divider)" }}>
                    <td colSpan={7} className="px-6 py-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        Calculation audit trail
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                        <div>
                          <p style={{ color: "var(--text-muted)" }}>Raw input</p>
                          <p className="mt-0.5 font-mono font-semibold" style={{ color: "var(--text)" }}>
                            {log.raw_value} {log.raw_unit}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: "var(--text-muted)" }}>Factor applied</p>
                          <p className="mt-0.5 font-mono font-semibold" style={{ color: "var(--text)" }}>
                            {log.factor_id}
                          </p>
                          <p style={{ color: "var(--text-muted)" }}>{log.factor_name} ({log.factor_vintage})</p>
                        </div>
                        <div>
                          <p style={{ color: "var(--text-muted)" }}>Formula</p>
                          <p className="mt-0.5 font-mono font-semibold break-all" style={{ color: "var(--text)" }}>
                            {log.formula}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: "var(--text-muted)" }}>Result</p>
                          <p className="mt-0.5 font-mono font-semibold" style={{ color: "var(--primary)" }}>
                            {log.co2e_kg.toFixed(4)} kgCO₂e
                          </p>
                        </div>
                        <div>
                          <p style={{ color: "var(--text-muted)" }}>Computed at</p>
                          <p className="mt-0.5 font-mono" style={{ color: "var(--text)" }}>
                            {new Date(log.computed_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
