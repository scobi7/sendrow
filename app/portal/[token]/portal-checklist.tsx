"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import type { ChecklistItem } from "@/lib/portal";
import { parsePastedRows } from "@/lib/portal-paste";

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

/** Field choices on the confirm-mapping screen, in supplier language. */
const FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Skip this column" },
  { value: "date", label: "Date / billing period" },
  { value: "activity_type", label: "Activity or fuel type" },
  { value: "quantity", label: "Quantity / amount used" },
  { value: "unit", label: "Unit (kWh, gallons…)" },
  { value: "source_ref", label: "Vendor / account / reference" },
  { value: "category", label: "Category" },
  { value: "scope", label: "GHG scope" },
  { value: "confidence", label: "Data quality note" },
  { value: "notes", label: "Notes" },
];

type PendingUpload = {
  itemId: string;
  file: File;
  filename: string;
  rows: Record<string, string>[];
  headers: string[];
  map: Record<string, string | null>;
  source: "memory" | "suggested";
};

type SheetChoice = {
  itemId: string;
  file: File;
  filename: string;
  sheets: { name: string; rows: Record<string, string>[] }[];
};

/** Fuzzy-picks a manual-entry kind from pasted text ("PG&E electric" → electricity). */
function guessKind(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("electric") || t.includes("kwh")) return "electricity";
  if (t.includes("diesel")) return "diesel";
  if (t.includes("propane")) return "propane";
  if (t.includes("gasoline") || t.includes("fuel")) return "gasoline";
  if (t.includes("gas") || t.includes("therm")) return "natgas";
  if (t.includes("recycl")) return "waste_recycled";
  if (t.includes("waste") || t.includes("trash") || t.includes("landfill")) return "waste_landfill";
  return "other";
}

export function PortalChecklist({ token, items }: { token: string; items: ChecklistItem[] }) {
  const router = useRouter();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "entry">("upload");
  const [rows, setRows] = useState<EntryRow[]>([{ date: "", kind: "electricity", quantity: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [sheetChoice, setSheetChoice] = useState<SheetChoice | null>(null);

  async function submit(
    item: ChecklistItem,
    payload: {
      rows: Record<string, string>[];
      filename: string;
      source: "upload" | "entry";
      file?: File;
      columnMap?: Record<string, string | null>;
    }
  ) {
    setBusy(true);
    setError(null);
    try {
      // Uploads go multipart so the original file is kept as evidence;
      // manual entry has no source document and stays JSON.
      let res: Response;
      if (payload.file) {
        const form = new FormData();
        form.set("token", token);
        form.set("itemId", item.id);
        form.set("source", payload.source);
        form.set("rows", JSON.stringify(payload.rows));
        form.set("file", payload.file, payload.filename);
        if (payload.columnMap) form.set("columnMap", JSON.stringify(payload.columnMap));
        res = await fetch("/api/portal/import", { method: "POST", body: form });
      } else {
        res = await fetch("/api/portal/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, itemId: item.id, rows: payload.rows, filename: payload.filename, source: payload.source }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setDoneMsg(
        data.unmapped > 0
          ? `Received — ${data.imported} rows. ${data.unmapped} need${data.unmapped === 1 ? "s" : ""} a closer look, and your consultant will handle that.`
          : `Received — ${data.imported} rows. Thank you!`
      );
      setOpenItem(null);
      setPending(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(item: ChecklistItem, file: File) {
    setError(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);

    // Parse every sheet; workbooks often carry multiple tabs and only the
    // person who made the file knows which one holds the data.
    const sheets = wb.SheetNames.map((name) => {
      const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name], { defval: "" });
      return {
        name,
        rows: parsed.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v)]))),
      };
    }).filter((s) => s.rows.length > 0);

    if (sheets.length === 0) {
      setError("That file looks empty — please check it and try again.");
      return;
    }
    if (sheets.length > 1) {
      setSheetChoice({ itemId: item.id, file, filename: file.name, sheets });
      return;
    }
    await startMapping(item, file, file.name, sheets[0].rows);
  }

  async function startMapping(item: ChecklistItem, file: File, filename: string, stringRows: Record<string, string>[]) {
    const headers = Object.keys(stringRows[0]);

    // Ask the server how it reads this file (memory beats suggestions),
    // then let the person who knows the file confirm before anything counts.
    setBusy(true);
    try {
      const res = await fetch("/api/portal/mapping-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, itemId: item.id, headers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not read that file");
      setSheetChoice(null);
      setPending({
        itemId: item.id,
        file,
        filename,
        rows: stringRows,
        headers,
        map: data.map,
        source: data.source,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file — please try again.");
    } finally {
      setBusy(false);
    }
  }

  function entryToRows(): Record<string, string>[] {
    return rows
      .filter((r) => r.quantity.trim() !== "")
      .map((r) => {
        const kind = ENTRY_KINDS[r.kind];
        return { date: r.date, activity_type: kind.activity_type, quantity: r.quantity, unit: kind.unit };
      });
  }

  function handlePaste(text: string) {
    const parsed = parsePastedRows(text);
    if (parsed.length === 0) return false;
    setRows((rs) => {
      const existing = rs.filter((r) => r.quantity.trim() !== "");
      const added = parsed.map((p) => ({ date: p.date, kind: guessKind(p.kindText), quantity: p.quantity }));
      return [...existing, ...added];
    });
    return true;
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
        const itemPending = pending?.itemId === item.id ? pending : null;
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
                {sheetChoice?.itemId === item.id && !itemPending ? (
                  /* ── Sheet picker: multi-tab workbooks ── */
                  <div>
                    <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--warning-tint)", color: "var(--warning-strong)" }}>
                      &ldquo;{sheetChoice.filename}&rdquo; has {sheetChoice.sheets.length} tabs — which one holds this data?
                    </div>
                    <div className="space-y-2">
                      {sheetChoice.sheets.map((sh) => (
                        <button
                          key={sh.name}
                          disabled={busy}
                          className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition-colors hover:opacity-80"
                          style={{ border: "1px solid var(--divider)", background: "var(--bg)" }}
                          onClick={() => startMapping(item, sheetChoice.file, `${sheetChoice.filename} — ${sh.name}`, sh.rows)}
                        >
                          <span className="font-medium" style={{ color: "var(--text)" }}>{sh.name}</span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {sh.rows.length} row{sh.rows.length !== 1 ? "s" : ""} · {Object.keys(sh.rows[0] ?? {}).slice(0, 3).join(", ")}…
                          </span>
                        </button>
                      ))}
                    </div>
                    <button className="mt-3 text-xs underline" style={{ color: "var(--text-muted)" }} onClick={() => setSheetChoice(null)} disabled={busy}>
                      Choose a different file
                    </button>
                  </div>
                ) : itemPending ? (
                  /* ── Confirm-mapping screen ── */
                  <div>
                    <div
                      className="mb-3 rounded-lg px-3 py-2 text-sm"
                      style={
                        itemPending.source === "memory"
                          ? { background: "var(--primary-tint)", color: "var(--primary)" }
                          : { background: "var(--warning-tint)", color: "var(--warning-strong)" }
                      }
                    >
                      {itemPending.source === "memory"
                        ? "✓ Same file shape as last time — mapping remembered. Quick check and you're done."
                        : `Here's how we read “${itemPending.filename}”. Fix anything that looks wrong — you know this file best.`}
                    </div>
                    <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--divider)" }}>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left" style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}>
                            <th className="px-3 py-2">Your column</th>
                            <th className="px-3 py-2">First values</th>
                            <th className="px-3 py-2">What it is</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemPending.headers.map((h) => (
                            <tr key={h} style={{ borderBottom: "1px solid var(--divider)" }}>
                              <td className="px-3 py-2 font-semibold" style={{ color: "var(--text)" }}>{h}</td>
                              <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>
                                {itemPending.rows.slice(0, 3).map((r) => r[h]).filter(Boolean).join(" · ") || "—"}
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  className="input py-1 text-xs"
                                  value={itemPending.map[h] ?? ""}
                                  onChange={(e) =>
                                    setPending((p) =>
                                      p ? { ...p, map: { ...p.map, [h]: e.target.value || null } } : p
                                    )
                                  }
                                >
                                  {FIELD_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <button className="text-xs underline" style={{ color: "var(--text-muted)" }} onClick={() => setPending(null)} disabled={busy}>
                        Choose a different file
                      </button>
                      <button
                        className="btn btn-primary text-sm"
                        disabled={busy || !Object.values(itemPending.map).includes("quantity")}
                        onClick={() =>
                          submit(item, {
                            rows: itemPending.rows,
                            filename: itemPending.filename,
                            source: "upload",
                            file: itemPending.file,
                            columnMap: itemPending.map,
                          })
                        }
                      >
                        {busy ? "Importing…" : `Looks right — import ${itemPending.rows.length} rows`}
                      </button>
                    </div>
                    {!Object.values(itemPending.map).includes("quantity") && (
                      <p className="mt-2 text-xs" style={{ color: "var(--warning-strong)" }}>
                        Pick which column holds the quantity/amount to continue.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
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
                        {busy ? "Reading…" : "Click to choose a CSV or Excel file"}
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          disabled={busy}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFile(item, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    ) : (
                      <div
                        onPaste={(e) => {
                          const text = e.clipboardData.getData("text");
                          if (text.includes("\n") || text.includes("\t")) {
                            if (handlePaste(text)) e.preventDefault();
                          }
                        }}
                      >
                        <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          Tip: copy rows straight from your spreadsheet and paste anywhere below.
                        </p>
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
                  </>
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
