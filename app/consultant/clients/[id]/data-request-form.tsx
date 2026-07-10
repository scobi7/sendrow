"use client";

import { useState, useTransition } from "react";
import { createDataRequest } from "@/lib/consultant-actions";
import { DATA_TYPE_CONFIGS } from "@/lib/ingestion/data-type-templates";
import type { DataType } from "@/lib/ingestion/data-type-templates";

const REQUESTABLE_TYPES = (Object.keys(DATA_TYPE_CONFIGS) as DataType[]).filter((t) => t !== "custom");

export function DataRequestForm({ companyId, consultantId }: { companyId: string; consultantId: string }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [period, setPeriod] = useState("");
  const [customPeriod, setCustomPeriod] = useState("");
  const [types, setTypes] = useState<DataType[]>([]);
  const [isPending, startTransition] = useTransition();

  function toggleType(t: DataType) {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  const year = new Date().getFullYear();
  const PERIOD_PRESETS = [
    `Calendar year ${year - 1}`,
    `Calendar year ${year} (year to date)`,
    `Q1 ${year}`,
    `Q2 ${year}`,
  ];

  function submit() {
    if (!description.trim()) return;
    const periodLabel = period === "custom" ? customPeriod : period;
    startTransition(async () => {
      await createDataRequest(companyId, consultantId, description, dueDate || null, types, periodLabel || null);
      setDescription("");
      setDueDate("");
      setPeriod("");
      setCustomPeriod("");
      setTypes([]);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <button className="btn btn-secondary text-sm" onClick={() => setOpen(true)}>
          + New request
        </button>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Creating a request automatically emails the secure portal link to your client contact.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">What do you need from the client?</label>
        <textarea
          className="input w-full resize-none text-sm"
          rows={2}
          placeholder="e.g. Upload Q3 utility bills for all locations"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Checklist items (the client sees these on their portal link)</label>
        <div className="flex flex-wrap gap-2">
          {REQUESTABLE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleType(t)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={
                types.includes(t)
                  ? { background: "var(--primary)", color: "#fff" }
                  : { background: "var(--divider)", color: "var(--text-muted)" }
              }
            >
              {DATA_TYPE_CONFIGS[t].label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          None selected = a single item using your description above.
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="label">Data covers (time period)</label>
          <select className="input text-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="">Not specified</option>
            {PERIOD_PRESETS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
            <option value="custom">Custom…</option>
          </select>
          {period === "custom" && (
            <input
              className="input mt-2 text-sm"
              placeholder="e.g. Jul 2025 – Jun 2026"
              value={customPeriod}
              onChange={(e) => setCustomPeriod(e.target.value)}
              autoFocus
            />
          )}
        </div>
        <div>
          <label className="label">Due date (optional)</label>
          <input type="date" className="input text-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary text-sm" disabled={isPending || !description.trim()} onClick={submit}>
          {isPending ? "Sending…" : "Send request + portal link"}
        </button>
        <button className="btn btn-secondary text-sm" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
