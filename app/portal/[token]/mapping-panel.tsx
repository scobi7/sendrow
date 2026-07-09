"use client";

import { useEffect, useMemo, useState } from "react";
import { parseSheetMatrixAt } from "@/lib/ingestion/sheet-parse";

/** Field choices in supplier language. */
export const FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Skip" },
  { value: "date", label: "Date / period" },
  { value: "activity_type", label: "Activity / fuel type" },
  { value: "quantity", label: "Quantity / amount" },
  { value: "unit", label: "Unit" },
  { value: "source_ref", label: "Vendor / reference" },
  { value: "category", label: "Category" },
  { value: "scope", label: "GHG scope" },
  { value: "confidence", label: "Data quality" },
  { value: "notes", label: "Notes" },
];

export type MappingSuggestion = { map: Record<string, string | null>; source: "memory" | "suggested" };

/** Spreadsheet-view mapping (Plan T5.1): the supplier sees THEIR file as a
 *  grid and assigns meaning on the column headers. If we picked the wrong
 *  header row, they click the right one — nothing is ever silently decided. */
export function MappingPanel({
  filename,
  matrix,
  initialHeaderRow,
  initialSuggestion,
  busy,
  fetchSuggestion,
  onConfirm,
  onCancel,
}: {
  filename: string;
  matrix: string[][];
  initialHeaderRow: number;
  initialSuggestion: MappingSuggestion;
  busy: boolean;
  fetchSuggestion: (headers: string[]) => Promise<MappingSuggestion>;
  onConfirm: (rows: Record<string, string>[], map: Record<string, string | null>) => void;
  onCancel: () => void;
}) {
  const [headerRow, setHeaderRow] = useState(initialHeaderRow);
  const [map, setMap] = useState<Record<string, string | null>>(initialSuggestion.map);
  const [source, setSource] = useState<"memory" | "suggested">(initialSuggestion.source);
  const [refetching, setRefetching] = useState(false);

  const parsed = useMemo(() => parseSheetMatrixAt(matrix, headerRow), [matrix, headerRow]);
  const { headers, rows } = parsed;

  // Header-row override → re-ask for suggestions against the new headers
  useEffect(() => {
    if (headerRow === initialHeaderRow) return;
    let cancelled = false;
    setRefetching(true);
    fetchSuggestion(parseSheetMatrixAt(matrix, headerRow).headers)
      .then((s) => {
        if (cancelled) return;
        setMap(s.map);
        setSource(s.source);
      })
      .catch(() => {})
      .finally(() => !cancelled && setRefetching(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerRow]);

  const hasQuantity = Object.values(map).includes("quantity");
  const previewRows = rows.slice(0, 6);
  const contextRows = matrix.slice(0, headerRow); // title/junk rows above the header

  /** Values that look like money under a quantity column deserve a heads-up. */
  const dollarHints = headers.filter((h) => {
    if (map[h] !== "quantity") return false;
    const headerHasDollar = /\$|usd|cost|charge|spend|amount \(\$\)/i.test(h);
    const values = previewRows.map((r) => r[h] ?? "");
    const valuesHaveDollar = values.some((v) => v.includes("$"));
    return headerHasDollar || valuesHaveDollar;
  });

  return (
    <div>
      <div
        className="mb-3 rounded-lg px-3 py-2 text-sm"
        style={
          source === "memory"
            ? { background: "var(--primary-tint)", color: "var(--primary)" }
            : { background: "var(--warning-tint)", color: "var(--warning-strong)" }
        }
      >
        {source === "memory"
          ? "✓ Same file shape as last time — mapping remembered. Quick check and you're done."
          : <>Here&apos;s your file. Tell us what each column is — you know &ldquo;{filename}&rdquo; best.</>}
      </div>

      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--divider)" }}>
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            {/* Assignment row: what each column MEANS */}
            <tr style={{ background: "var(--bg)" }}>
              <th className="px-2 py-1.5" style={{ width: "2rem" }} />
              {headers.map((h) => (
                <th key={h} className="px-2 py-1.5 text-left" style={{ minWidth: "8.5rem" }}>
                  <select
                    className="input w-full py-1 text-xs font-medium"
                    value={map[h] ?? ""}
                    disabled={busy || refetching}
                    onChange={(e) => setMap((m) => ({ ...m, [h]: e.target.value || null }))}
                    style={map[h] ? { borderColor: "var(--primary)", color: "var(--primary)" } : { color: "var(--text-muted)" }}
                  >
                    {FIELD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Junk rows above the detected header — click one to say "headers are here" */}
            {contextRows.map((raw, i) => (
              <tr
                key={`ctx-${i}`}
                className="cursor-pointer"
                style={{ borderBottom: "1px solid var(--divider)", opacity: 0.45 }}
                title="Not part of the data. Click if this is actually the header row."
                onClick={() => !busy && setHeaderRow(i)}
              >
                <td className="px-2 py-1 text-center" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                {headers.map((h, c) => (
                  <td key={h} className="truncate px-2 py-1" style={{ color: "var(--text-muted)", maxWidth: "10rem" }}>
                    {raw[c] ?? ""}
                  </td>
                ))}
              </tr>
            ))}

            {/* The header row itself, highlighted */}
            <tr style={{ background: "var(--primary-tint)", borderBottom: "2px solid var(--primary)" }}>
              <td className="px-2 py-1.5 text-center text-xs" title="Detected header row" style={{ color: "var(--primary)" }}>
                ▸
              </td>
              {headers.map((h) => (
                <td key={h} className="truncate px-2 py-1.5 font-bold" style={{ color: "var(--text)", maxWidth: "10rem" }}>
                  {h}
                </td>
              ))}
            </tr>

            {/* Their actual data */}
            {previewRows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--divider)" }}>
                <td className="px-2 py-1 text-center" style={{ color: "var(--text-muted)" }}>{headerRow + 2 + i}</td>
                {headers.map((h) => (
                  <td
                    key={h}
                    className="truncate px-2 py-1"
                    style={{ color: map[h] ? "var(--text)" : "var(--text-muted)", opacity: map[h] ? 1 : 0.5, maxWidth: "10rem" }}
                  >
                    {r[h] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
        {rows.length > previewRows.length ? `Showing ${previewRows.length} of ${rows.length} rows. ` : ""}
        Wrong header row? Click the correct one in the grid.
      </p>

      {dollarHints.length > 0 && (
        <p className="mt-2 rounded-lg px-3 py-2 text-xs" style={{ background: "var(--warning-tint)", color: "var(--warning-strong)" }}>
          &ldquo;{dollarHints.join("”, “")}&rdquo; looks like dollar amounts. That&apos;s fine — your consultant
          converts money to physical amounts; those rows will be marked for their review.
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <button className="text-xs underline" style={{ color: "var(--text-muted)" }} onClick={onCancel} disabled={busy}>
          Choose a different file
        </button>
        <button
          className="btn btn-primary text-sm"
          disabled={busy || refetching || !hasQuantity || rows.length === 0}
          onClick={() => onConfirm(rows, map)}
        >
          {busy ? "Importing…" : `Looks right — import ${rows.length} rows`}
        </button>
      </div>
      {!hasQuantity && (
        <p className="mt-2 text-xs" style={{ color: "var(--warning-strong)" }}>
          Set one column to <strong>Quantity / amount</strong> to continue.
        </p>
      )}
    </div>
  );
}
