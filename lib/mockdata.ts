import { Company, QBTransaction, UtilityMonth } from "./types";
import { uid } from "./store";

/**
 * Simulated connector payloads. In production these come from the
 * QuickBooks API (Bill/Purchase objects) and UtilityAPI/Arcadia.
 * Deterministic per company so demos are repeatable.
 */

function seededRandom(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const VENDORS: Record<string, string[]> = {
  "Travel - Airfare": ["United Airlines", "Southwest Airlines", "Delta Air Lines"],
  "Travel - Lodging": ["Marriott", "Hilton Garden Inn", "Holiday Inn Express"],
  "Travel - Car Rental": ["Enterprise Rent-A-Car", "Hertz"],
  "Freight & Delivery": ["FedEx Freight", "Old Dominion", "XPO Logistics", "UPS"],
  "Office Supplies": ["Staples", "Office Depot", "Uline"],
  "Software & Subscriptions": ["Microsoft", "Salesforce", "Adobe", "Zoom"],
  "Professional Fees": ["Hayes & Marsh LLP", "Calder CPA Group", "Bayline Insurance"],
  "Materials & Equipment": ["Grainger", "Fastenal", "Pacific Supply Co", "McMaster-Carr"],
  "Meals & Catering": ["Corporate Catering Co", "Costco Business", "Panera Bread"],
};

/** Annual spend envelope by category, scaled by industry + headcount. */
function spendProfile(company: Company): Record<string, number> {
  const head = { under_50: 35, "50_150": 100, "150_350": 250, "350_500": 425 }[
    company.headcountRange ?? "50_150"
  ];
  const scale = head / 100;
  const base: Record<string, number> = {
    "Travel - Airfare": 48000,
    "Travel - Lodging": 31000,
    "Travel - Car Rental": 9500,
    "Freight & Delivery": 86000,
    "Office Supplies": 22000,
    "Software & Subscriptions": 64000,
    "Professional Fees": 95000,
    "Materials & Equipment": 140000,
    "Meals & Catering": 18000,
  };
  const ind = company.industry;
  if (ind === "Logistics") base["Freight & Delivery"] *= 4.5;
  if (ind === "Manufacturing") base["Materials & Equipment"] *= 3.5;
  if (ind === "Food and Beverage") {
    base["Meals & Catering"] *= 1.5;
    base["Materials & Equipment"] *= 2.2;
  }
  if (ind === "Construction") base["Materials & Equipment"] *= 4;
  if (ind === "Professional Services") {
    base["Materials & Equipment"] *= 0.3;
    base["Freight & Delivery"] *= 0.2;
    base["Travel - Airfare"] *= 1.6;
  }
  if (ind === "Retail") base["Freight & Delivery"] *= 2;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(base)) out[k] = Math.round(v * scale);
  return out;
}

/** 12 fiscal-year months ending at fiscalYearEndMonth of the most recent completed FY. */
export function fiscalMonths(company: Company): string[] {
  const endMonth = company.fiscalYearEndMonth ?? 12;
  const now = new Date();
  let endYear = now.getFullYear();
  // use the most recently completed fiscal year
  if (endMonth >= now.getMonth() + 1) endYear -= 1;
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(endYear, endMonth - 1 - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export function generateQBTransactions(company: Company): QBTransaction[] {
  const rand = seededRandom(company.id + "qb");
  const months = fiscalMonths(company);
  const profile = spendProfile(company);
  const txns: QBTransaction[] = [];
  for (const [category, annual] of Object.entries(profile)) {
    const vendors = VENDORS[category];
    const txCount = 12 + Math.floor(rand() * 24);
    let remaining = annual;
    for (let i = 0; i < txCount; i++) {
      const share = i === txCount - 1 ? remaining : Math.round((annual / txCount) * (0.5 + rand()));
      remaining -= share;
      if (share <= 0) continue;
      const month = months[Math.floor(rand() * months.length)];
      const day = 1 + Math.floor(rand() * 27);
      txns.push({
        id: uid("qb_"),
        vendor: vendors[Math.floor(rand() * vendors.length)],
        category,
        amount: share,
        date: `${month}-${String(day).padStart(2, "0")}`,
      });
    }
  }
  return txns.sort((a, b) => a.date.localeCompare(b.date));
}

export function generateUtilityData(company: Company): UtilityMonth[] {
  const rand = seededRandom(company.id + "util");
  const months = fiscalMonths(company);
  const head = { under_50: 35, "50_150": 100, "150_350": 250, "350_500": 425 }[
    company.headcountRange ?? "50_150"
  ];
  const rows: UtilityMonth[] = [];
  for (const loc of company.locations) {
    // base load roughly proportional to headcount split across locations
    const baseKwh = (head * 2600) / Math.max(company.locations.length, 1);
    const baseTherms = (head * 55) / Math.max(company.locations.length, 1);
    for (let i = 0; i < months.length; i++) {
      // seasonal curve: more electricity in summer (cooling), more gas in winter
      const season = Math.sin(((i + 3) / 12) * 2 * Math.PI);
      rows.push({
        locationId: loc.id,
        month: months[i],
        kwh: Math.round((baseKwh / 12) * (1 + 0.25 * season + 0.08 * (rand() - 0.5))),
        therms: Math.round(Math.max(0, (baseTherms / 12) * (1 - 0.45 * season + 0.1 * (rand() - 0.5)))),
      });
    }
  }
  return rows;
}
