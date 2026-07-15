"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { confirmVendorMapping } from "@/lib/consultant-actions";
import { VENDOR_CONFIRM_OPTIONS } from "@/lib/vendor-mappings";

/** Flagged rows grouped by their reference column. That reference is often a
 *  vendor ("PG&E") - but sometimes a truck ID or account number, which must
 *  never enter the shared vendor memory. Hence the scope choice, defaulting
 *  to this-client-only. */
export function VendorConfirm({ companyId, vendors }: { companyId: string; vendors: { name: string; count: number }[] }) {
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [scopes, setScopes] = useState<Record<string, "client" | "global">>({});
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);

  function confirm(vendor: string) {
    const key = choices[vendor];
    if (!key) return;
    setConfirming(vendor);
    startTransition(async () => {
      await confirmVendorMapping(companyId, vendor, key, scopes[vendor] ?? "client");
      setConfirming(null);
    });
  }

  if (vendors.length === 0) return null;

  return (
    <div className="rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--danger-border)" }}>
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--danger)" }}>
          Flagged rows - grouped by reference ({vendors.length})
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          These rows couldn&apos;t be mapped to an emission factor. If the reference is a <strong>vendor</strong>,
          categorize it here and the rows recalculate immediately. If it&apos;s not a vendor (a truck ID, an
          account number, dollar amounts needing conversion), fix the rows in the{" "}
          <Link href={`/consultant/clients/${companyId}/ledger?status=unmapped`} className="underline" style={{ color: "var(--primary)" }}>
            Data Ledger
          </Link>{" "}
          instead.
        </p>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
        {vendors.map(({ name, count }) => (
          <div key={name} className="px-5 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>{name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{count} flagged row{count !== 1 ? "s" : ""}</p>
              </div>
              <select
                className="input w-64 text-xs"
                value={choices[name] ?? ""}
                onChange={(e) => setChoices((c) => ({ ...c, [name]: e.target.value }))}
              >
                <option value="">If this is a vendor, what kind?</option>
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
            {choices[name] && (
              <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="radio"
                    name={`scope-${name}`}
                    checked={(scopes[name] ?? "client") === "client"}
                    onChange={() => setScopes((s) => ({ ...s, [name]: "client" }))}
                  />
                  Just this client
                </label>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="radio"
                    name={`scope-${name}`}
                    checked={scopes[name] === "global"}
                    onChange={() => setScopes((s) => ({ ...s, [name]: "global" }))}
                  />
                  All clients - it&apos;s a common vendor (PG&amp;E, UPS…)
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
