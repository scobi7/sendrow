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
  short: string; // compact label for the homepage deadline bar, e.g. "Scope 1 and 2 due"
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
    short: "Scope 1 and 2 due",
    date: "2026-11-10",
    dateLabel: "Nov 10, 2026",
    status: "confirmed",
    source: "https://www.sullcrom.com/insights/memo/2026/October/CARB-Initial-Regulation-Confirms-November-10-Reporting-Deadline",
    checkedOn: "2026-11-13",
  },
  {
    // CARB set November 10 as the annual date; the 2027 date itself is not yet in a CARB notice.
    id: "sb253-scope12-2027",
    regulation: "SB 253",
    title: "Annual Scope 1 and 2 reports due",
    short: "Scope 1 and 2 due",
    date: "2027-11-10",
    dateLabel: "Nov 10, 2027",
    status: "expected",
    source: "https://watershed.com/blog/carb-guidance-california",
    checkedOn: "2026-11-13",
  },
  {
    // Ninth Circuit, Nov 9 2026: Scope 3 requirement likely unconstitutional, remanded (preliminary ruling).
    id: "sb253-scope3-2027",
    regulation: "SB 253",
    title: "Scope 3 reporting on hold after the Ninth Circuit ruling of Nov 9, 2026",
    short: "Scope 3 on hold",
    date: null,
    dateLabel: "On hold",
    status: "paused",
    source: "https://www.crowell.com/en/insights/client-alerts/ninth-circuit-declines-to-halt-carbs-scope-1-and-2-disclosure-requirements-finds-scope-3-and-sb-261-likely-unconstitutional",
    checkedOn: "2026-11-13",
  },
  {
    id: "sb261-paused",
    regulation: "SB 261",
    title: "Climate risk reports on hold after the Ninth Circuit ruling of Nov 9, 2026",
    short: "on hold",
    date: null,
    dateLabel: "On hold",
    status: "paused",
    source: "https://www.crowell.com/en/insights/client-alerts/ninth-circuit-declines-to-halt-carbs-scope-1-and-2-disclosure-requirements-finds-scope-3-and-sb-261-likely-unconstitutional",
    checkedOn: "2026-11-13",
  },
  {
    id: "cdp-2026",
    regulation: "CDP",
    title: "CDP submission window closes",
    short: "Responses due",
    date: "2026-09-14",
    dateLabel: "Sep 14, 2026",
    status: "confirmed",
    source: "docs/build-pipeline-2026-07-10.pdf",
    checkedOn: "2026-11-13",
  },
  {
    // Third-party summary; CDP's own 2027 page says dates are still being published.
    id: "cdp-2027-open",
    regulation: "CDP",
    title: "CDP 2027 response window opens",
    short: "Window opens",
    date: "2027-04-14",
    dateLabel: "Apr 14, 2027",
    status: "expected",
    source: "https://nexioprojects.com/cdp-disclosure-2027-key-dates-to-plan-for/",
    checkedOn: "2026-11-13",
  },
  {
    id: "cdp-2027-close",
    regulation: "CDP",
    title: "CDP 2027 final response deadline",
    short: "Responses due",
    date: "2027-08-25",
    dateLabel: "Aug 25, 2027",
    status: "expected",
    source: "https://nexioprojects.com/cdp-disclosure-2027-key-dates-to-plan-for/",
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

/** Display order for regulations grouped on the homepage and calendar. */
const REGULATION_ORDER = ["SB 253", "SB 261", "CDP"];

/**
 * Every regulation with its upcoming dated entries (soonest first) and then its
 * undated ones (on hold or date TBD), so different regulations read the same way.
 * Regulations with nothing current are left out.
 */
export function regulatoryTimeline(today: string): { regulation: string; entries: RegulatoryDate[] }[] {
  const regs = [...new Set([...REGULATION_ORDER, ...REGULATORY_DATES.map((d) => d.regulation)])];
  return regs
    .map((regulation) => {
      const own = REGULATORY_DATES.filter((d) => d.regulation === regulation);
      const dated = own.filter((d) => d.date !== null && d.date >= today).sort((a, b) => a.date!.localeCompare(b.date!));
      const undated = own.filter((d) => d.date === null).sort((a, b) => UNDATED_ORDER[a.status] - UNDATED_ORDER[b.status]);
      return { regulation, entries: [...dated, ...undated] };
    })
    .filter((g) => g.entries.length > 0);
}
