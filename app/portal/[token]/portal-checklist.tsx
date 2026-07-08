"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import type { ChecklistItem } from "@/lib/portal";

type EntryRow = { date: string; kind: string; quantity: string };

/** Manual-entry kinds: label → activity_type + unit fed into the ingest pipeline. */
const ENTRY_KINDS: Record<string, { label: string; activity_type: string; unit: string }> = {
  electricity: { label: "Electricity (kWh)", activity_type: "electricity", unit: "kWh" },
  natgas: { label: "Natural gas (therms)", activity_type: "natural gas", unit: "therms" },
  diesel: { label: "Diesel (gallons)", activity_type: "diesel", unit: "gallon" },
  gasoline: { label: "Gasoline (gallons)", activity_type: "gasoline", unit: "gallon" },
  propane: { label: "Propane (gallons)", activity_type: "propane", unit: "gallon" },
  waste_landfill: { label: "Waste — landfilled (tons)", activity_type: "waste landfilled", unit: "ton" },
  waste_recycled: { label: "Waste — recycled (tons)", activity_type: "waste recycled", unit: "ton" },
  other: { label: "Other (will be reviewed)", activity_type: "other", unit: "" },
};

export function PortalChecklist({ token, items }: { token: string; items: ChecklistItem[] }) {
  const router = useRouter();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "entry">("upload");
  const [rows, setRows] = useState<EntryRow[]>([{ date: "", kind: "electricity", quantity: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  async function submit(item: ChecklistItem, payload: { rows: Record<string, string>[]; filename: string; source: "upload" | "entry" }) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, itemId: item.id, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setDoneMsg(
        data.unmapped > 0
          ? `Received — ${data.imported} rows. ${data.unmapped} need${data.unmapped === 1 ? "s" : ""} a closer look, and your consultant will handle that.`
          : `Received — ${data.imported} rows. Thank you!`
      );
      setOpenItem(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(item: ChecklistItem, file: File) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (parsed.length === 0) {
      setError("That file looks empty — please check it and try again.");
      return;
    }
    const stringRows = parsed.map((r) =>
      Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v)]))
    );
    await submit(item, { rows: stringRows, filename: file.name, source: "upload" });
  }

  function entryToRows(): Record<string, string>[] {
    return rows
      .filter((r) => r.quantity.trim() !== "")
      .map((r) => {
        const kind = ENTRY_KINDS[r.kind];
        return { date: r.date, activity_type: kind.activity_type, quantity: r.quantity, unit: kind.unit };
      });
  }

  return (
    <div className="space-y-3">
      {doneMsg && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--primary-tint)", color: "var(--primary)" }}>
          ✓ {doneMsg}
        </div>
      )}
      {items.map((item) => {
        const isOpen = openItem === item.id;
        const received = item.status === "received";
        return (
          <div key={item.id} className="rounded-2xl" style={{ background: "var(--card)", border: isOpen ? "1px solid var(--primary)" : "1px solid var(--divider)" }}>
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              onClick={() => !received && setOpenItem(isOpen ? null : item.id)}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.label}</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{item.instructions}</p>
              </div>
              <span
                className="ml-4 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={
                  received
                    ? { background: "var(--primary-tint)", color: "var(--primary)" }
                    : { background: "var(--divider)", color: "var(--text-muted)" }
                }
              >
                {received ? "✓ Received" : "Needed"}
              </span>
            </button>

            {isOpen && !received && (
              <div className="px-5 pb-5">
                <div className="mb-4 flex gap-2">
                  <button
                    className={mode === "upload" ? "btn btn-primary text-xs px-3 py-1.5" : "btn btn-secondary text-xs px-3 py-1.5"}
                    onClick={() => setMode("upload")}
                  >
                    Upload a file
                  </button>
                  <button
                    className={mode === "entry" ? "btn btn-primary text-xs px-3 py-1.5" : "btn btn-secondary text-xs px-3 py-1.5"}
                    onClick={() => setMode("entry")}
                  >
                    Type it in
                  </button>
                </div>

                {mode === "upload" ? (
                  <label
                    className="block cursor-pointer rounded-xl p-8 text-center text-sm"
                    style={{ border: "2px dashed var(--divider)", color: "var(--text-muted)" }}
                  >
                    {busy ? "Uploading…" : "Click to choose a CSV or Excel file"}
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(item, f);
                      }}
                    />
                  </label>
                ) : (
                  <div>
                    <div className="space-y-2">
                      {rows.map((r, i) => (
                        <div key={i} className="grid grid-cols-3 gap-2">
                          <input
                            type="month"
                            className="input text-sm"
                            value={r.date}
                            onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))}
                          />
                          <select
                            className="input text-sm"
                            value={r.kind}
                            onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)))}
                          >
                            {Object.entries(ENTRY_KINDS).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Amount"
                            className="input text-sm"
                            value={r.quantity}
                            onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        className="text-xs underline"
                        style={{ color: "var(--text-muted)" }}
                        onClick={() => setRows((rs) => [...rs, { date: "", kind: rs[rs.length - 1]?.kind ?? "electricity", quantity: "" }])}
                      >
                        + Add row
                      </button>
                      <button
                        className="btn btn-primary text-sm"
                        disabled={busy || entryToRows().length === 0}
                        onClick={() => submit(item, { rows: entryToRows(), filename: "manual entry", source: "entry" })}
                      >
                        {busy ? "Sending…" : "Submit"}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="mt-3 text-sm" style={{ color: "var(--danger)" }}>{error}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
