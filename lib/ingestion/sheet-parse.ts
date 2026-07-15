/** Header-row detection (Plan T2 follow-up): real files carry titles, blank
 *  rows, and logos above the actual header row. Deterministic heuristic -  *  the confirm-mapping screen still shows the result for a human to verify. */

export type ParsedSheet = { headers: string[]; rows: Record<string, string>[]; headerRowIndex: number };

function isNumericCell(v: string): boolean {
  const cleaned = v.replace(/[$,%\s]/g, "");
  return cleaned !== "" && !isNaN(Number(cleaned));
}

/** Scores how header-like a row is: many short, non-empty, non-numeric cells,
 *  followed by a row with a similar cell count. */
function headerScore(row: string[], next: string[] | undefined): number {
  const filled = row.filter((c) => c.trim() !== "");
  if (filled.length < 2) return 0;
  let score = filled.length * 2;
  score += filled.filter((c) => !isNumericCell(c)).length; // headers are words, not numbers
  score -= filled.filter((c) => c.length > 40).length * 2; // long cells are titles/sentences
  if (next) {
    const nextFilled = next.filter((c) => c.trim() !== "").length;
    if (nextFilled >= filled.length - 1) score += 3; // data continues below at similar width
  }
  return score;
}

/** Parses a raw cell matrix into records, auto-detecting the header row within
 *  the first 10 rows. Empty header cells become "Column N". */
export function parseSheetMatrix(matrix: string[][]): ParsedSheet {
  const trimmed = matrix.map((r) => r.map((c) => (c ?? "").trim()));
  const searchLimit = Math.min(trimmed.length, 10);

  let bestIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < searchLimit; i++) {
    const score = headerScore(trimmed[i], trimmed[i + 1]);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  // Belt and suspenders: a "winning" row that names almost nothing (a title
  // spanning one cell) loses to any nearby row that names most columns.
  const chosenNamed = (trimmed[bestIdx] ?? []).filter((c) => c !== "").length;
  if (chosenNamed < 2) {
    for (let i = 0; i < searchLimit; i++) {
      const named = (trimmed[i] ?? []).filter((c) => c !== "").length;
      if (named >= 2) {
        bestIdx = i;
        break;
      }
    }
  }
  return parseSheetMatrixAt(matrix, bestIdx);
}

/** Same parse, but the human said "headers are THIS row" (mapping-screen override). */
export function parseSheetMatrixAt(matrix: string[][], bestIdx: number): ParsedSheet {
  const trimmed = matrix.map((r) => r.map((c) => (c ?? "").trim()));
  const headerRow = trimmed[bestIdx] ?? [];
  const width = Math.max(headerRow.length, ...trimmed.slice(bestIdx + 1).map((r) => r.length), 0);
  const headers: string[] = [];
  for (let c = 0; c < width; c++) {
    headers.push(headerRow[c]?.trim() || `Column ${c + 1}`);
  }

  const rows: Record<string, string>[] = [];
  for (const raw of trimmed.slice(bestIdx + 1)) {
    if (raw.every((c) => c === "")) continue; // skip blank spacer rows
    const rec: Record<string, string> = {};
    headers.forEach((h, c) => {
      rec[h] = raw[c] ?? "";
    });
    rows.push(rec);
  }

  return { headers, rows, headerRowIndex: bestIdx };
}
