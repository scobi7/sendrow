"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";

const DATA_TYPE_CHIPS: { key: string; label: string }[] = [
  { key: "utility_bills", label: "Electricity & gas" },
  { key: "fleet_fuel_dollar", label: "Fleet fuel" },
  { key: "vendor_invoices", label: "Spend data" },
  { key: "business_travel", label: "Business travel" },
  { key: "commute_survey", label: "Commute survey" },
];

export function NewTemplateForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-secondary w-full">
        + New template
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setOpen(false);
        setSelected([]);
      }}
      className="card space-y-4"
    >
      <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>New template</h2>
      <input type="hidden" name="data_types" value={JSON.stringify(selected)} />
      <div>
        <label className="label">Name</label>
        <input name="name" required className="input" placeholder="Standard SB 253 package" />
      </div>
      <div>
        <label className="label">What the supplier sees</label>
        <input name="description" required className="input" placeholder="Quarterly emissions data" />
      </div>
      <div>
        <label className="label">Data types</label>
        <div className="flex flex-wrap gap-2">
          {DATA_TYPE_CHIPS.map(({ key, label }) => {
            const active = selected.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected((p) => (active ? p.filter((k) => k !== key) : [...p, key]))}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
                style={
                  active
                    ? { background: "var(--primary-tint)", color: "var(--primary)", border: "1px solid var(--emerald)" }
                    : { background: "var(--card-strong)", color: "var(--text-muted)", border: "1px solid var(--chip-border)" }
                }
              >
                {active ? "✓ " : ""}{label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Period label</label>
          <input name="period_label" className="input" placeholder="Q1 2026" />
        </div>
        <div>
          <label className="label">Due in (days)</label>
          <input name="due_in_days" type="number" min="1" className="input" placeholder="30" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary text-sm">Cancel</button>
        <SubmitButton className="btn btn-primary text-sm" pendingText="Saving…">Save template</SubmitButton>
      </div>
    </form>
  );
}
