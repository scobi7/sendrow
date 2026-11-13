/**
 * Regulatory dates shown to consultants on the calendar and the dashboard.
 * These are compliance facts: every entry needs a source and a checkedOn
 * date. Malachi or Masao confirm any change here (see docs/progress.md).
 */

export type RegulatoryStatus = "confirmed" | "expected" | "paused" | "tbd";

export type RegulatoryDate = {
  id: string;
  regulation: string; // "SB 253", "SB 261", "CDP"
  title: string;
  date: string | null; // ISO yyyy-mm-dd; null when no date is set
  dateLabel: string; // what to show, e.g. "Nov 10, 2026" or "2027, date TBD"
  status: RegulatoryStatus;
  source: string; // URL or repo doc the date comes from
  checkedOn: string; // ISO date someone last verified it
};

export const REGULATORY_DATES: RegulatoryDate[] = [
  {
    id: "sb253-scope12-2026",
    regulation: "SB 253",
    title: "First Scope 1 and 2 reports due",
    date: "2026-11-10",
    dateLabel: "Nov 10, 2026",
    status: "confirmed",
    source: "https://www.sullcrom.com/insights/memo/2026/October/CARB-Initial-Regulation-Confirms-November-10-Reporting-Deadline",
    checkedOn: "2026-11-13",
  },
  {
    id: "cdp-2026",
    regulation: "CDP",
    title: "CDP submission window closes",
    date: "2026-09-14",
    dateLabel: "Sep 14, 2026",
    status: "confirmed",
    source: "docs/build-pipeline-2026-07-10.pdf",
    checkedOn: "2026-11-13",
  },
  {
    id: "sb253-scope3-2027",
    regulation: "SB 253",
    title: "Scope 3 reporting begins",
    date: null,
    dateLabel: "2027, date TBD",
    status: "tbd",
    source: "docs/build-pipeline-2026-07-10.pdf",
    checkedOn: "2026-11-13",
  },
  {
    id: "sb261-paused",
    regulation: "SB 261",
    title: "Climate risk reports on hold (Ninth Circuit injunction)",
    date: null,
    dateLabel: "Paused",
    status: "paused",
    source: "https://www.thompsonhine.com/insights/carbs-final-climate-disclosure-rule-sets-sb-253-deadline-leaves-sb-261-paused/",
    checkedOn: "2026-11-13",
  },
];

export const STATUS_LABEL: Record<RegulatoryStatus, string> = {
  confirmed: "Confirmed",
  expected: "Expected",
  paused: "Paused",
  tbd: "Date TBD",
};

const UNDATED_ORDER: Record<RegulatoryStatus, number> = {
  confirmed: 0,
  expected: 1,
  tbd: 2,
  paused: 3,
};

/**
 * Entries with a date on or after `today` (ISO yyyy-mm-dd), soonest first,
 * then undated entries (tbd before paused). Past dates are excluded.
 */
export function upcomingRegulatoryDates(today: string, limit = 3): RegulatoryDate[] {
  const dated = REGULATORY_DATES
    .filter((d) => d.date !== null && d.date >= today)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const undated = REGULATORY_DATES
    .filter((d) => d.date === null)
    .sort((a, b) => UNDATED_ORDER[a.status] - UNDATED_ORDER[b.status]);
  return [...dated, ...undated].slice(0, limit);
}
