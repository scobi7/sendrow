/** Paste-from-spreadsheet parsing for the portal's manual entry grid (Plan T2).
 *  Accepts TSV (Excel/Sheets clipboard) or CSV lines. Column heuristic per row:
 *  a date-ish cell → date, a numeric cell → quantity, remaining text → kind. */

export type PastedRow = { date: string; kindText: string; quantity: string };

const DATE_RE = /^\d{4}-\d{1,2}(-\d{1,2})?$|^\d{1,2}\/\d{1,2}\/\d{2,4}$|^\d{4}\/\d{1,2}$|^[A-Za-z]{3,9}[\s-]\d{4}$/;

function isDateish(cell: string): boolean {
  return DATE_RE.test(cell.trim());
}

function isNumeric(cell: string): boolean {
  const cleaned = cell.replace(/[$,\s]/g, "");
  return cleaned !== "" && !isNaN(Number(cleaned));
}

/** Converts common date spellings to the grid's YYYY-MM month format. */
function toMonthValue(cell: string): string {
  const t = cell.trim();
  const iso = t.match(/^(\d{4})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}`;
  const us = t.match(/^(\d{1,2})\/(?:\d{1,2}\/)?(\d{2,4})$/);
  if (us) {
    const year = us[2].length === 2 ? `20${us[2]}` : us[2];
    return `${year}-${us[1].padStart(2, "0")}`;
  }
  const named = t.match(/^([A-Za-z]{3,9})[\s-](\d{4})$/);
  if (named) {
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const idx = months.indexOf(named[1].slice(0, 3).toLowerCase());
    if (idx >= 0) return `${named[2]}-${String(idx + 1).padStart(2, "0")}`;
  }
  return "";
}

export function parsePastedRows(text: string): PastedRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: PastedRow[] = [];

  for (const line of lines) {
    const cells = (line.includes("\t") ? line.split("\t") : line.split(",")).map((c) => c.trim());
    let date = "";
    let quantity = "";
    const textCells: string[] = [];

    for (const cell of cells) {
      if (!cell) continue;
      if (!date && isDateish(cell)) {
        date = toMonthValue(cell);
      } else if (isNumeric(cell)) {
        // last numeric cell wins - spreadsheets often lead with row numbers
        quantity = cell.replace(/[$,\s]/g, "");
      } else {
        textCells.push(cell);
      }
    }

    if (!quantity) continue; // a row without a number isn't data
    rows.push({ date, kindText: textCells.join(" "), quantity });
  }
  return rows;
}
