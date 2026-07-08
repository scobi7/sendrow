"use client";

import { useState, useTransition } from "react";
import { confirmVendorMapping } from "@/lib/consultant-actions";
import { VENDOR_CONFIRM_OPTIONS } from "@/lib/vendor-mappings";

export function VendorConfirm({ companyId, vendors }: { companyId: string; vendors: { name: string; count: number }[] }) {
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);

  function confirm(vendor: string) {
    const key = choices[vendor];
    if (!key) return;
    setConfirming(vendor);
    startTransition(async () => {
      await confirmVendorMapping(companyId, vendor, key);
      setConfirming(null);
    });
  }

  if (vendors.length === 0) return null;

  return (
    <div className="rounded-2xl" style={{ background: "var(--card)", border: "1px solid #fecaca" }}>
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#dc2626" }}>
          Unmapped vendors ({vendors.length})
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Confirm once — the mapping applies to every client, forever, and these flagged rows recalculate immediately.
        </p>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
        {vendors.map(({ name, count }) => (
          <div key={name} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>{name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{count} flagged row{count !== 1 ? "s" : ""}</p>
            </div>
            <select
              className="input w-64 text-xs"
              value={choices[name] ?? ""}
              onChange={(e) => setChoices((c) => ({ ...c, [name]: e.target.value }))}
            >
              <option value="">What is this vendor?</option>
              {VENDOR_CONFIRM_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            <button
              className="btn btn-primary text-xs px-3 py-1.5"
              disabled={!choices[name] || pending}
              onClick={() => confirm(name)}
            >
              {confirming === name ? "Confirming…" : "Confirm"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
