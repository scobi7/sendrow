"use client";

import { useState } from "react";
import { ScopeBarChart, ScopeDonutChart } from "@/components/ui";

export function ScopeChartToggle({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const [view, setView] = useState<"bar" | "donut">("bar");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold font-display" style={{ color: "var(--text)" }}>
          Emissions by scope
        </h2>
        <div
          className="flex rounded-full p-0.5"
          style={{ background: "rgba(0,0,0,0.06)" }}
        >
          {(["bar", "donut"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-all"
              style={
                view === v
                  ? { background: "var(--primary)", color: "#fff" }
                  : { color: "var(--text-muted)" }
              }
            >
              {v === "bar" ? "Bar" : "Donut"}
            </button>
          ))}
        </div>
      </div>
      {view === "bar" ? <ScopeBarChart data={data} /> : <ScopeDonutChart data={data} />}
    </div>
  );
}
