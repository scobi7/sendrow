"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import type { ChecklistItem } from "@/lib/portal";
import { itemFileCount, MAX_FILES_PER_CHECKLIST_ITEM } from "@/lib/portal";
import { parsePastedRows } from "@/lib/portal-paste";
import { parseSheetMatrix } from "@/lib/ingestion/sheet-parse";
import { templateCsv } from "@/lib/ingestion/data-type-templates";
import type { DataType } from "@/lib/ingestion/data-type-templates";
import { MappingPanel } from "./mapping-panel";
import type { MappingSuggestion } from "./mapping-panel";
import { Walkthrough } from "./walkthrough";

type EntryRow = { date: string; kind: string; quantity: string };

/** Manual-entry kinds: label → activity_type + unit fed into the ingest pipeline. */
const ENTRY_KINDS: Record<string, { label: string; activity_type: string; unit: string }> = {
  electricity: { label: "Electricity (kWh)", activity_type: "electricity", unit: "kWh" },
  natgas: { label: "Natural gas (therms)", activity_type: "natural gas", unit: "therms" },
  diesel: { label: "Diesel (gallons)", activity_type: "diesel", unit: "gallon" },
  gasoline: { label: "Gasoline (gallons)", activity_type: "gasoline", unit: "gallon" },
  propane: { label: "Propane (gallons)", activity_type: "propane", unit: "gallon" },
  commute: { label: "Commuting (miles)", activity_type: "commute", unit: "mile" },
  waste_landfill: { label: "Waste - landfilled (tons)", activity_type: "waste landfilled", unit: "ton" },
  waste_recycled: { label: "Waste - recycled (tons)", activity_type: "waste recycled", unit: "ton" },
  other: { label: "Other (will be reviewed)", activity_type: "other", unit: "" },
};

type PendingUpload = {
  itemId: string;
  file: File;
  filename: string;
  matrix: string[][];
  headerRowIndex: number;
  suggestion: MappingSuggestion;
};

/** Vercel rejects bodies over ~4.5 MB with an empty non-JSON response, so we
 *  stop oversized files client-side with a message the supplier can act on. */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Reads a response body as JSON without ever throwing "Unexpected end of
 *  JSON input" at the supplier - non-JSON failures (413s, crashes, timeouts)
 *  become actionable messages instead. */
async function readJson(res: Response): Promise<{ error?: string; [k: string]: unknown }> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 413) {
      return { error: "That file is too large to send (about 4 MB max). Export a smaller date range, or type the numbers in instead." };
    }
    return { error: "The upload didn't go through - please try again. If it keeps failing, use “Type it in” and we'll take it from there." };
  }
}

type SheetChoice = {
  itemId: string;
  file: File;
  filename: string;
  sheets: { name: string; matrix: string[][]; rowCount: number; preview: string[] }[];
};

/** Fuzzy-picks a manual-entry kind from pasted text ("PG&E electric" → electricity). */
function guessKind(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("electric") || t.includes("kwh")) return "electricity";
  if (t.includes("diesel")) return "diesel";
  if (t.includes("propane")) return "propane";
  if (t.includes("commut") || t.includes("mile")) return "commute";
  if (t.includes("gasoline") || t.includes("fuel")) return "gasoline";
  if (t.includes("gas") || t.includes("therm")) return "natgas";
  if (t.includes("recycl")) return "waste_recycled";
  if (t.includes("waste") || t.includes("trash") || t.includes("landfill")) return "waste_landfill";
  return "other";
}

export type PrefillRow = { date: string; activity: string; quantity: string; unit: string; period: string | null };

export type ItemThread = { authorType: string; body: string; createdAt: string }[];

export function PortalChecklist({
  token,
  items,
  prefill = [],
  threads = {},
}: {
  token: string;
  items: ChecklistItem[];
  prefill?: PrefillRow[];
  threads?: Record<string, ItemThread>;
}) {
  const router = useRouter();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "entry" | "guided">("upload");
  const [rows, setRows] = useState<EntryRow[]>([{ date: "", kind: "electricity", quantity: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [sheetChoice, setSheetChoice] = useState<SheetChoice | null>(null);
  const [stuckOpen, setStuckOpen] = useState<string | null>(null);
  const [stuckMsg, setStuckMsg] = useState("");
  const [stuckSent, setStuckSent] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [prefillUsed, setPrefillUsed] = useState(false);
  // A PDF the supplier tried to upload: kept client-side and attached as
  // evidence when their manual entry for that item is submitted.
  const [evidenceStash, setEvidenceStash] = useState<{ itemId: string; file: File } | null>(null);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);
  const draftKey = `sendrow-draft-${token}`;

  // Save & resume (U1.6): suppliers fill these out in stolen moments -   // losing work once means they never come back.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved) as EntryRow[];
        if (Array.isArray(parsed) && parsed.some((r) => r.quantity?.trim())) {
          setRows(parsed);
          setDraftRestored(true);
        }
      }
    } catch {
      /* corrupted draft - start fresh */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (rows.some((r) => r.quantity.trim() !== "")) {
        localStorage.setItem(draftKey, JSON.stringify(rows));
      }
    } catch {
      /* storage full/blocked - non-fatal */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  async function fetchSuggestion(item: ChecklistItem, headers: string[]): Promise<MappingSuggestion> {
    const res = await fetch("/api/portal/mapping-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, itemId: item.id, headers }),
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error((data.error as string) ?? "Could not read that file");
    return { map: data.map as MappingSuggestion["map"], source: data.source as MappingSuggestion["source"] };
  }

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
      const data = (await readJson(res)) as { error?: string; imported?: number; unmapped?: number };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      const unmapped = data.unmapped ?? 0;
      setDoneMsg(
        unmapped > 0
          ? `Received - ${data.imported} rows. ${unmapped} need${unmapped === 1 ? "s" : ""} a closer look, and your consultant will handle that.`
          : `Received - ${data.imported} rows. Thank you!`
      );
      setOpenItem(null);
      setPending(null);
      try {
        localStorage.removeItem(draftKey);
      } catch { /* noop */ }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong - please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(item: ChecklistItem, file: File) {
    setError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That file is over 4 MB, which is more than this page can send. Export a smaller date range, or type the numbers in instead.");
      return;
    }
    // PDFs can't be auto-read (yet) - keep the file as proof and route the
    // supplier to manual entry so nothing dead-ends.
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setEvidenceStash({ itemId: item.id, file });
      setMode("entry");
      setError(null);
      setDoneMsg(null);
      setPdfNotice(
        `We can't read numbers out of PDFs automatically yet. Your file “${file.name}” will be attached as proof - type the totals from it below and submit.`
      );
      return;
    }
    const buf = await file.arrayBuffer();
    let wb: XLSX.WorkBook;
    try {
      // codepage 65001 = UTF-8, so CSVs with em-dashes etc. don't mojibake
      wb = XLSX.read(buf, { codepage: 65001 });
    } catch {
      setError("We couldn't read that file as a spreadsheet. CSV and Excel exports work best - or type the numbers in instead.");
      return;
    }

    // Every sheet as a raw matrix - header detection and mapping happen on
    // the confirm screen where the supplier can see and override everything.
    const sheets = wb.SheetNames.map((name) => {
      const matrix = XLSX.utils
        .sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, defval: "" })
        .map((r) => (r as unknown[]).map((c) => String(c ?? "")));
      const parsed = parseSheetMatrix(matrix);
      return { name, matrix, rowCount: parsed.rows.length, preview: parsed.headers.slice(0, 3) };
    }).filter((s) => s.rowCount > 0);

    if (sheets.length === 0) {
      setError("That file looks empty - please check it and try again.");
      return;
    }
    if (sheets.length > 1) {
      setSheetChoice({ itemId: item.id, file, filename: file.name, sheets });
      return;
    }
    await startMapping(item, file, file.name, sheets[0].matrix);
  }

  async function startMapping(item: ChecklistItem, file: File, filename: string, matrix: string[][]) {
    setBusy(true);
    try {
      const parsed = parseSheetMatrix(matrix);
      const suggestion = await fetchSuggestion(item, parsed.headers);
      setSheetChoice(null);
      setPending({ itemId: item.id, file, filename, matrix, headerRowIndex: parsed.headerRowIndex, suggestion });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file - please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendStuck(item: ChecklistItem) {
    setBusy(true);
    try {
      const res = await fetch("/api/portal/stuck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, itemId: item.id, message: stuckMsg }),
      });
      if (!res.ok) throw new Error((await readJson(res)).error ?? "Could not send");
      setStuckSent(item.id);
      setStuckOpen(null);
      setStuckMsg("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send - please try again.");
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
        const fileCount = itemFileCount(item);
        const atCap = fileCount >= MAX_FILES_PER_CHECKLIST_ITEM;
        const itemPending = pending?.itemId === item.id ? pending : null;
        const itemSheets = sheetChoice?.itemId === item.id ? sheetChoice : null;
        return (
          <div key={item.id} className="rounded-2xl" style={{ background: "var(--card)", border: isOpen ? "1px solid var(--primary)" : "1px solid var(--divider)" }}>
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left"
              onClick={() => !atCap && setOpenItem(isOpen ? null : item.id)}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.label}</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  {item.instructions}
                  {received && !atCap && !isOpen && (
                    <span className="font-medium" style={{ color: "var(--primary)" }}> · you can add more files</span>
                  )}
                </p>
              </div>
              <span
                className="ml-4 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={
                  received
                    ? { background: "var(--primary-tint)", color: "var(--primary)" }
                    : { background: "var(--divider)", color: "var(--text-muted)" }
                }
              >
                {received ? `✓ ${fileCount} received${atCap ? " (max)" : ""}` : "Needed"}
              </span>
            </button>

            {/* Conversation on this item (X2): what you sent, what they answered */}
            {(threads[item.id]?.length ?? 0) > 0 && (
              <div className="mx-5 mb-3 space-y-2 rounded-xl px-4 py-3" style={{ background: "var(--bg)", border: "1px solid var(--divider)" }}>
                {threads[item.id].map((t, i) => (
                  <p key={i} className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                    <span className="font-semibold" style={{ color: t.authorType === "supplier" ? "var(--text-muted)" : "var(--primary)" }}>
                      {t.authorType === "supplier" ? "You" : "Your consultant"}:
                    </span>{" "}
                    {t.body}
                    <span className="ml-1.5" style={{ color: "var(--text-muted)" }}>· {t.createdAt.slice(0, 10)}</span>
                  </p>
                ))}
              </div>
            )}

            {isOpen && !atCap && (
              <div className="px-5 pb-5">
                {received && (
                  <p className="mb-3 rounded-lg px-3 py-2 text-xs" style={{ background: "var(--primary-tint)", color: "var(--primary)" }}>
                    {fileCount} file{fileCount === 1 ? "" : "s"} received so far. Add another below - up to {MAX_FILES_PER_CHECKLIST_ITEM} total (e.g. separate electricity and gas sheets, or one per month).
                  </p>
                )}
                {itemSheets ? (
                  /* ── Sheet picker: multi-tab workbooks ── */
                  <div>
                    <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--warning-tint)", color: "var(--warning-strong)" }}>
                      &ldquo;{itemSheets.filename}&rdquo; has {itemSheets.sheets.length} tabs - which one holds this data?
                    </div>
                    <div className="space-y-2">
                      {itemSheets.sheets.map((sh) => (
                        <button
                          key={sh.name}
                          disabled={busy}
                          className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition-colors hover:opacity-80"
                          style={{ border: "1px solid var(--divider)", background: "var(--bg)" }}
                          onClick={() => startMapping(item, itemSheets.file, `${itemSheets.filename} - ${sh.name}`, sh.matrix)}
                        >
                          <span className="font-medium" style={{ color: "var(--text)" }}>{sh.name}</span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {sh.rowCount} row{sh.rowCount !== 1 ? "s" : ""} · {sh.preview.join(", ")}…
                          </span>
                        </button>
                      ))}
                    </div>
                    <button className="mt-3 text-xs underline" style={{ color: "var(--text-muted)" }} onClick={() => setSheetChoice(null)} disabled={busy}>
                      Choose a different file
                    </button>
                  </div>
                ) : itemPending ? (
                  /* ── Spreadsheet-view mapping ── */
                  <MappingPanel
                    filename={itemPending.filename}
                    matrix={itemPending.matrix}
                    initialHeaderRow={itemPending.headerRowIndex}
                    initialSuggestion={itemPending.suggestion}
                    busy={busy}
                    fetchSuggestion={(headers) => fetchSuggestion(item, headers)}
                    onCancel={() => setPending(null)}
                    onConfirm={(mappedRows, map) =>
                      submit(item, {
                        rows: mappedRows,
                        filename: itemPending.filename,
                        source: "upload",
                        file: itemPending.file,
                        columnMap: map,
                      })
                    }
                  />
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {([
                        ["upload", "Upload a file"],
                        ["entry", "Type it in"],
                        ["guided", "Walk me through it"],
                      ] as const).map(([m, label]) => (
                        <button
                          key={m}
                          className={mode === m ? "btn btn-primary text-xs px-3 py-1.5" : "btn btn-secondary text-xs px-3 py-1.5"}
                          onClick={() => setMode(m)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {mode === "upload" ? (
                      <>
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
                        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          Any spreadsheet works - you&apos;ll confirm how we read it. Want zero fuss?{" "}
                          <button
                            className="underline"
                            style={{ color: "var(--primary)" }}
                            onClick={() => {
                              const csv = templateCsv(item.dataType as DataType);
                              const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${item.dataType}-template.csv`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            Download our template
                          </button>{" "}
                          and fill it in.
                        </p>
                      </>
                    ) : mode === "guided" ? (
                      <Walkthrough
                        dataType={item.dataType as DataType}
                        busy={busy}
                        onSubmit={(walkedRows) =>
                          submit(item, { rows: walkedRows, filename: "guided walkthrough", source: "entry" })
                        }
                      />
                    ) : (
                      <div
                        onPaste={(e) => {
                          const text = e.clipboardData.getData("text");
                          if (text.includes("\n") || text.includes("\t")) {
                            if (handlePaste(text)) e.preventDefault();
                          }
                        }}
                      >
                        {draftRestored && (
                          <p className="mb-2 rounded-lg px-3 py-2 text-xs" style={{ background: "var(--primary-tint)", color: "var(--primary)" }}>
                            ✓ Picked up where you left off - your draft was saved automatically.
                          </p>
                        )}
                        {pdfNotice && evidenceStash?.itemId === item.id && (
                          <p className="mb-2 rounded-lg px-3 py-2 text-xs" style={{ background: "var(--warning-tint)", color: "var(--warning-strong)" }}>
                            {pdfNotice}
                          </p>
                        )}
                        {prefill.length > 0 && !prefillUsed && (
                          <div className="mb-2 flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--warning-tint)" }}>
                            <p className="text-xs" style={{ color: "var(--warning-strong)" }}>
                              You submitted {prefill.length} entries last time{prefill[0]?.period ? ` (${prefill[0].period})` : ""}.
                              Start from those and just update what changed?
                            </p>
                            <button
                              className="btn btn-secondary ml-3 shrink-0 px-2.5 py-1 text-xs"
                              onClick={() => {
                                setRows(
                                  prefill.map((p) => ({
                                    date: (p.date.match(/^\d{4}-\d{2}/) ? p.date.slice(0, 7) : ""),
                                    kind: guessKind(`${p.activity} ${p.unit}`),
                                    quantity: p.quantity,
                                  }))
                                );
                                setPrefillUsed(true);
                              }}
                            >
                              Use last submission
                            </button>
                          </div>
                        )}
                        {prefillUsed && (
                          <p className="mb-2 rounded-lg px-3 py-2 text-xs" style={{ background: "var(--warning-tint)", color: "var(--warning-strong)" }}>
                            From your last submission - <strong>confirm or update</strong> each number before submitting.
                          </p>
                        )}
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
                            onClick={() => {
                              const stash = evidenceStash?.itemId === item.id ? evidenceStash : null;
                              submit(item, {
                                rows: entryToRows(),
                                filename: stash ? stash.file.name : "manual entry",
                                source: "entry",
                                file: stash?.file,
                              });
                              if (stash) {
                                setEvidenceStash(null);
                                setPdfNotice(null);
                              }
                            }}
                          >
                            {busy ? "Sending…" : "Submit"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Stuck escape hatch: confusion becomes a flag, not abandonment */}
                    <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--divider)" }}>
                      {stuckSent === item.id ? (
                        <p className="text-xs" style={{ color: "var(--primary)" }}>
                          ✓ Sent - your consultant will follow up.
                        </p>
                      ) : stuckOpen === item.id ? (
                        <div>
                          <textarea
                            className="input w-full text-sm"
                            rows={2}
                            placeholder="What's tripping you up? e.g. 'my bills only show dollars, not kWh'"
                            value={stuckMsg}
                            onChange={(e) => setStuckMsg(e.target.value)}
                            autoFocus
                          />
                          <div className="mt-2 flex items-center gap-3">
                            <button className="btn btn-secondary px-3 py-1 text-xs" disabled={busy || !stuckMsg.trim()} onClick={() => sendStuck(item)}>
                              {busy ? "Sending…" : "Send to my consultant"}
                            </button>
                            <button className="text-xs underline" style={{ color: "var(--text-muted)" }} onClick={() => setStuckOpen(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="text-xs underline" style={{ color: "var(--text-muted)" }} onClick={() => setStuckOpen(item.id)}>
                          Stuck? Ask your consultant →
                        </button>
                      )}
                    </div>
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
