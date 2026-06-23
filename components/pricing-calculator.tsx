"use client";

import { useState } from "react";

export function PricingCalculator() {
  const [clients, setClients] = useState(5);
  const base = 300;
  const extra = Math.max(0, clients - 3) * 100;
  const total = base + extra;

  return (
    <div className="mt-6 rounded-xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--divider)" }}>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium" style={{ color: "var(--text)" }}>
          How many active clients?
        </label>
        <span className="text-sm font-bold font-data" style={{ color: "var(--primary)" }}>{clients}</span>
      </div>
      <input
        type="range"
        min={1}
        max={20}
        value={clients}
        onChange={(e) => setClients(Number(e.target.value))}
        className="w-full accent-green-600"
      />
      <div className="mt-4 flex items-end justify-between">
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          {clients <= 3 ? (
            <span>3 clients included in base</span>
          ) : (
            <span>$300 base + {clients - 3} extra × $100</span>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-data" style={{ color: "var(--text)" }}>
            ${total.toLocaleString()}<span className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>/mo</span>
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>${(total * 12).toLocaleString()}/yr</p>
        </div>
      </div>
    </div>
  );
}
