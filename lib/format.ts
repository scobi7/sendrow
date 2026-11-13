/**
 * Shared display formatters for the consultant app and the PDF report.
 * Everything is pinned to en-US so output does not depend on the server or
 * browser locale. Changing an option here changes what users see.
 */

/** "Mar 4" */
export function fmtShortDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Mar 4, 2026" */
export function fmtShortDateYear(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Number with at most 1 decimal place, e.g. "1,234.5". */
export const fmtNum1 = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

/** Number with at most 2 decimal places. */
export const fmtNum2 = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** Number with at most 3 decimal places. */
export const fmtNum3 = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 3 });
