"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { STANDARD_FIELDS } from "@/lib/ingestion/fuzzy-match";
import { DATA_TYPE_CONFIGS, applyTemplate } from "@/lib/ingestion/data-type-templates";
import type { DataType } from "@/lib/ingestion/data-type-templates";
import type { MatchResult } from "@/lib/ingestion/fuzzy-match";

type Step = "upload" | "type" | "fuel_prices" | "map" | "done";
type ImportResult = { imported: number; skipped: number; unmapped: number; autoApproved: boolean; sessionScore: number; pipelineLocked: boolean };

export default function UploadForm() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fuzzyResults, setFuzzyResults] = useState<MatchResult[]>([]);
  const [dataType, setDataType] = useState<DataType>("custom");
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [profileName, setProfileName] = useState("");
  const [fuelPrices, setFuelPrices] = useState({ diesel: "", gasoline: "" });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const STEPS: Step[] = dataType === "fleet_fuel_dollar"
    ? ["upload", "type", "fuel_prices", "map", "done"]
    : ["upload", "type", "map", "done"];
  const stepIndex = STEPS.indexOf(step);
  const stepLabel: Record<Step, string> = { upload: "Upload", type: "Data type", fuel_prices: "Fuel prices", map: "Map columns", done: "Done" };

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setProfileName(file.name.replace(/\.[^.]+$/, ""));
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
        if (rawRows.length === 0) { setError("Spreadsheet appears empty."); setLoading(false); return; }
        const hdrs = Object.keys(rawRows[0]);
        setHeaders(hdrs);
        setRows(rawRows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v)]))));

        const res = await fetch("/api/intake/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ headers: hdrs }),
        });
        const json = await res.json();
        setFuzzyResults(json.suggestions ?? []);
        setStep("type");
      } catch {
        setError("Could not parse this file. Make sure it's a valid .xlsx or .csv.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function selectDataType(type: DataType) {
    setDataType(type);
    const merged = applyTemplate(headers, type, fuzzyResults);
    setColumnMap(merged);
  }

  function proceedFromType() {
    if (dataType === "fleet_fuel_dollar") setStep("fuel_prices");
    else setStep("map");
  }

  async function handleImport() {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { rows, columnMap, profileName, dataType, filename: fileName };
      if (dataType === "fleet_fuel_dollar") {
        body.fuelPrices = {
          diesel: parseFloat(fuelPrices.diesel) || 0,
          gasoline: parseFloat(fuelPrices.gasoline) || 0,
        };
      }
      const res = await fetch("/api/intake/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      <div className="mb-8 flex gap-5 overflow-x-auto">
        {STEPS.filter(s => s !== "done").map((s, i) => (
          <div key={s} className="flex items-center gap-2 shrink-0">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
              style={
                stepIndex >= i
                  ? { background: "var(--primary)", color: "#fff" }
                  : { background: "var(--divider)", color: "var(--text-muted)" }
              }
            >
              {i + 1}
            </span>
            <span className="text-sm" style={{ color: stepIndex >= i ? "var(--text)" : "var(--text-muted)" }}>
              {stepLabel[s]}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--danger-tint)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="card text-center">
          <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>Choose a file</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            .xlsx or .csv — any column format works.
          </p>
          <label
            className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-xl p-10 transition-opacity hover:opacity-70"
            style={{ border: "2px dashed var(--divider)", background: "var(--bg)" }}
          >
            <svg className="mb-3 h-10 w-10" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {loading ? "Reading file…" : "Click to browse"}
            </span>
            <input ref={fileRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={handleFile} disabled={loading} />
          </label>
        </div>
      )}

      {/* Step: Data type */}
      {step === "type" && (
        <div className="card">
          <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>What kind of data is this?</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Picked up {rows.length} rows from <span className="font-mono">{fileName}</span>. Choose the type to pre-fill column mapping.
          </p>
          <div className="mt-5 space-y-2">
            {(Object.entries(DATA_TYPE_CONFIGS) as [DataType, typeof DATA_TYPE_CONFIGS[DataType]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => selectDataType(key)}
                className="w-full rounded-xl px-4 py-3 text-left transition-colors"
                style={
                  dataType === key
                    ? { border: "1px solid var(--primary)", background: "var(--primary-tint)" }
                    : { border: "1px solid var(--divider)", background: "var(--surface)" }
                }
              >
                <p className="text-sm font-semibold" style={{ color: dataType === key ? "var(--primary)" : "var(--text)" }}>
                  {cfg.label}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{cfg.description}</p>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep("upload")} className="btn btn-secondary">Back</button>
            <button onClick={proceedFromType} className="btn btn-primary">Next</button>
          </div>
        </div>
      )}

      {/* Step: Fuel prices (fleet_fuel_dollar only) */}
      {step === "fuel_prices" && (
        <div className="card">
          <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>Enter fuel prices</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Your fuel card data shows $ spend, not gallons. Enter the average price per gallon to convert — CA Energy Commission or EIA has monthly averages.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <label className="label">Diesel ($/gallon)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 4.20"
                value={fuelPrices.diesel}
                onChange={(e) => setFuelPrices((p) => ({ ...p, diesel: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Gasoline ($/gallon)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 3.80"
                value={fuelPrices.gasoline}
                onChange={(e) => setFuelPrices((p) => ({ ...p, gasoline: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <button onClick={() => setStep("type")} className="btn btn-secondary">Back</button>
            <button
              onClick={() => setStep("map")}
              disabled={!fuelPrices.diesel || !fuelPrices.gasoline}
              className="btn btn-primary"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step: Map columns */}
      {step === "map" && (
        <div className="card">
          <h2 className="text-lg font-bold font-display" style={{ color: "var(--text)" }}>Confirm column mapping</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Pre-filled from the {DATA_TYPE_CONFIGS[dataType].label} template. Adjust anything that's off.
          </p>
          <div className="mt-4 mb-4">
            <label className="label">Profile name</label>
            <input className="input" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--divider)" }}>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Your column</th>
                  <th className="pb-2 pl-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Maps to</th>
                  <th className="pb-2 pl-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Sample</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--divider)" }}>
                {headers.map((h) => (
                  <tr key={h}>
                    <td className="py-2.5 pr-4 font-mono text-xs" style={{ color: "var(--text)" }}>{h}</td>
                    <td className="py-2.5 pl-4">
                      <select
                        className="input py-1 text-sm"
                        value={columnMap[h] ?? ""}
                        onChange={(e) => setColumnMap((prev) => ({ ...prev, [h]: e.target.value }))}
                      >
                        <option value="">— skip —</option>
                        {STANDARD_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 pl-4 font-mono text-xs truncate max-w-[160px]" style={{ color: "var(--text-muted)" }}>
                      {rows[0]?.[h] ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>{rows.length} rows in {fileName}</p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleImport}
              disabled={loading}
              className="btn btn-primary px-6"
            >
              {loading ? "Importing…" : `Import ${rows.length} rows`}
            </button>
            <button onClick={() => setStep(dataType === "fleet_fuel_dollar" ? "fuel_prices" : "type")} className="btn btn-secondary">Back</button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && result && (
        <div className="card text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: result.autoApproved ? "var(--primary-tint)" : "var(--warning-tint, var(--warning-tint))" }}
          >
            {result.autoApproved ? (
              <svg className="h-6 w-6" style={{ color: "var(--primary)" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-6 w-6" style={{ color: "var(--warning)" }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
              </svg>
            )}
          </div>
          <h2 className="text-xl font-bold font-display" style={{ color: "var(--text)" }}>
            {result.pipelineLocked
              ? "Auto-processed — pipeline locked"
              : result.autoApproved
              ? "Import complete"
              : "Upload received — under review"}
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text)" }}>{result.imported}</strong> rows imported
            {result.skipped > 0 && <>, <strong style={{ color: "var(--warning)" }}>{result.skipped}</strong> skipped</>}
          </p>
          {result.unmapped > 0 && (
            <p className="mt-3 rounded-lg px-4 py-2 text-sm" style={{ background: "var(--danger-tint)", color: "var(--danger)" }}>
              {result.unmapped} row{result.unmapped !== 1 ? "s" : ""} couldn&apos;t be matched to an emission factor.
              They were imported and flagged — nothing was dropped — and a reviewer will categorize them.
            </p>
          )}
          {!result.autoApproved && !result.pipelineLocked && (
            <p className="mt-3 rounded-lg px-4 py-2 text-sm" style={{ background: "var(--warning-tint)", color: "var(--warning-strong)" }}>
              Some columns couldn&apos;t be matched confidently. A reviewer will check this file before it&apos;s finalized.
            </p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/dashboard" className="btn btn-primary px-6">Back to dashboard →</Link>
            <Link href="/intake/upload" className="btn btn-secondary px-4">Upload another</Link>
          </div>
        </div>
      )}
    </div>
  );
}
