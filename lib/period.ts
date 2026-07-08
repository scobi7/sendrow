/** Reporting periods (Plan N4). A period is a fiscal-year label: "2026" for
 *  calendar-year reporters, "FY2026" (labeled by end year) otherwise.
 *  Forward-only: line items imported before this existed keep period = null. */

export function periodForDate(dateStr: string | undefined | null, fiscalYearEndMonth: number | null): string | null {
  if (!dateStr) return null;
  // Accept "2026-03", "2026-03-15", "3/15/2026"
  let year: number | null = null;
  let month: number | null = null;
  const iso = dateStr.match(/^(\d{4})-(\d{1,2})/);
  const us = dateStr.match(/^(\d{1,2})\/\d{1,2}\/(\d{4})$/);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
  } else if (us) {
    year = Number(us[2]);
    month = Number(us[1]);
  }
  if (!year || !month || month < 1 || month > 12 || year < 1990 || year > 2100) return null;

  const end = fiscalYearEndMonth ?? 12;
  if (end === 12) return String(year);
  // Fiscal year labeled by its end year: months after the end month belong to next FY
  return month <= end ? `FY${year}` : `FY${year + 1}`;
}

/** Sums line items into per-period scope totals (kg CO2e). Unmapped rows carry
 *  zero emissions and are excluded; null periods group under "untagged". */
export function periodTotals(
  items: { period: string | null; scope: number; co2eKg: number; status: string }[]
): { period: string; scope1: number; scope2: number; scope3: number; total: number }[] {
  const byPeriod: Record<string, { scope1: number; scope2: number; scope3: number; total: number }> = {};
  for (const item of items) {
    if (item.status !== "mapped") continue;
    const key = item.period ?? "untagged";
    byPeriod[key] ??= { scope1: 0, scope2: 0, scope3: 0, total: 0 };
    const bucket = byPeriod[key];
    if (item.scope === 1) bucket.scope1 += item.co2eKg;
    else if (item.scope === 2) bucket.scope2 += item.co2eKg;
    else bucket.scope3 += item.co2eKg;
    bucket.total += item.co2eKg;
  }
  return Object.entries(byPeriod)
    .map(([period, t]) => ({ period, ...t }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/** Year-over-year delta between the two most recent tagged periods. */
export function yoyDelta(
  totals: { period: string; total: number }[]
): { current: string; previous: string; pct: number } | null {
  const tagged = totals.filter((t) => t.period !== "untagged");
  if (tagged.length < 2) return null;
  const previous = tagged[tagged.length - 2];
  const current = tagged[tagged.length - 1];
  if (previous.total === 0) return null;
  return {
    current: current.period,
    previous: previous.period,
    pct: ((current.total - previous.total) / previous.total) * 100,
  };
}
