"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { STANDARD_FIELDS } from "@/lib/ingestion/fuzzy-match";
import type { MatchResult } from "@/lib/ingestion/fuzzy-match";

type Step = "upload" | "map" | "done";

type ImportResult = { imported: number; skipped: number };

export default function UploadPage() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [suggestions, setSuggestions] = useState<MatchResult[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [profileName, setProfileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setProfileName(file.name.replace(/\.[^.]+$/, ""));

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });

        if (rawRows.length === 0) { setError("The spreadsheet appears to be empty."); return; }

        const hdrs = Object.keys(rawRows[0]);
        setHeaders(hdrs);
        setRows(rawRows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v)]))));

        setLoading(true);
        const res = await fetch("/api/intake/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ headers: hdrs }),
        });
        const json = await res.json();
        setSuggestions(json.suggestions ?? []);
        const initialMap: Record<string, string> = {};
        for (const s of json.suggestions ?? []) {
          if (s.field) initialMap[s.header] = s.field;
        }
        setColumnMap(initialMap);
        setStep("map");
      } catch {
        setError("Could not parse this file. Make sure it's a valid .xlsx or .csv.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/intake/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, columnMap, profileName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import failed");
      setResult(json);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/intake" className="text-sm" style={{ color: "var(--text-muted)" }}>← Data Intake</Link>
        <span style={{ color: "var(--divider)" }}>/</span>
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>Upload spreadsheet</span>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex gap-6">
        {(["upload", "map", "done"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
              style={
                step === s
                  ? { background: "var(--primary)", color: "#fff" }
                  : { background: "var(--divider)", color: "var(--text-muted)" }
              }
            >
              {i + 1}
            </span>
            <span className="text-sm capitalize" style={{ color: step === s ? "var(--text)" : "var(--text-muted)" }}>
              {s === "upload" ? "Upload" : s === "map" ? "Map columns" : "Done"}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--danger-tint)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Step 1 — Upload */}
      {step === "upload" && (
        <div className="card text-center">
          <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>Choose a file</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Accepts .xlsx or .csv. Any column format works — you'll map the columns in the next step.
          </p>
          <label
            className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-xl p-10 transition-colors hover:opacity-80"
            style={{ border: "2px dashed var(--divider)", background: "var(--bg)" }}
          >
            <svg className="mb-3 h-10 w-10" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {loading ? "Reading file…" : "Click to browse"}
            </span>
            <span className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>or drag and drop</span>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleFile}
              disabled={loading}
            />
          </label>
        </div>
      )}

      {/* Step 2 — Map columns */}
      {step === "map" && (
        <div className="card">
          <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>Map your columns</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            We pre-filled our best guess. Adjust any that are wrong, then hit Import.
          </p>

          <div className="mt-6 mb-4">
            <label className="label">Profile name</label>
            <input
              className="input"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="e.g. PG&amp;E Monthly Bill"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--divider)" }}>
                  <th className="pb-2 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Your column</th>
                  <th className="pb-2 pl-4 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Maps to</th>
                  <th className="pb-2 pl-4 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Sample</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--divider)" }}>
                {headers.map((h) => {
                  const suggestion = suggestions.find((s) => s.header === h);
                  const sample = rows[0]?.[h] ?? "";
                  return (
                    <tr key={h}>
                      <td className="py-2.5 pr-4 font-mono text-xs" style={{ color: "var(--text)" }}>{h}</td>
                      <td className="py-2.5 pl-4">
                        <select
                          className="input py-1 text-sm"
                          value={columnMap[h] ?? ""}
                          onChange={(e) =>
                            setColumnMap((prev) => ({ ...prev, [h]: e.target.value }))
                          }
                        >
                          <option value="">— skip —</option>
                          {STANDARD_FIELDS.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                        {suggestion?.confidence === "low" && columnMap[h] && (
                          <span className="ml-2 text-xs" style={{ color: "var(--warning)" }}>low confidence</span>
                        )}
                      </td>
                      <td className="py-2.5 pl-4 font-mono text-xs truncate max-w-[160px]" style={{ color: "var(--text-muted)" }}>
                        {sample}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
            {rows.length} row{rows.length !== 1 ? "s" : ""} in {fileName}
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleImport}
              disabled={loading}
              className="btn btn-primary px-6"
            >
              {loading ? "Importing…" : `Import ${rows.length} rows`}
            </button>
            <button
              onClick={() => { setStep("upload"); setError(null); }}
              className="btn btn-secondary px-4"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Done */}
      {step === "done" && result && (
        <div className="card text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--primary-tint)" }}
          >
            <svg className="h-6 w-6" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold font-display" style={{ color: "var(--text)" }}>Import complete</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text)" }}>{result.imported}</strong> rows imported
            {result.skipped > 0 && <>, <strong style={{ color: "var(--warning)" }}>{result.skipped}</strong> skipped (missing quantity or unrecognized activity type)</>}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/workpaper" className="btn btn-primary px-6">View workpaper →</Link>
            <Link href="/intake/upload" className="btn btn-secondary px-4">Upload another</Link>
          </div>
        </div>
      )}
    </div>
  );
}
