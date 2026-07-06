import { lookupFactor, applyFactor } from "@/lib/factor-engine";
import type { EmissionFactor, CalcLog } from "@/lib/factor-engine";
import type { StandardField } from "./fuzzy-match";

export type ColumnMap = Partial<Record<string, StandardField>>;

export type NormalizedRow = {
  date?: string;
  activity_type?: string;
  quantity?: number;
  unit?: string;
  scope?: number;
  category?: string;
  source_ref?: string;
  confidence?: string;
  notes?: string;
};

export type LineItemInsert = {
  id: string;
  companyId: string;
  sourceRef: string;
  scope: number;
  category: string;
  rawValue: string;
  rawUnit: string;
  co2eKg: string;
  confidence: string;
  factorId: string | null;
  calcLog: CalcLog;
  mappingProfileId: string | null;
  createdAt: string;
};

/** Maps raw spreadsheet rows through a confirmed column map to normalized rows. */
export function applyProfile(
  rows: Record<string, string>[],
  columnMap: ColumnMap
): NormalizedRow[] {
  return rows.map((row) => {
    const normalized: NormalizedRow = {};
    for (const [theirHeader, ourField] of Object.entries(columnMap)) {
      if (!ourField || !(theirHeader in row)) continue;
      const raw = row[theirHeader]?.trim() ?? "";
      if (ourField === "quantity" || ourField === "scope") {
        const n = parseFloat(raw);
        if (!isNaN(n)) (normalized as Record<string, unknown>)[ourField] = n;
      } else {
        (normalized as Record<string, unknown>)[ourField] = raw || undefined;
      }
    }
    return normalized;
  });
}

/** Resolves scope and category from an activity_type string. */
function resolveScope(activityType?: string): { scope: number; category: string } {
  const t = (activityType ?? "").toLowerCase();
  if (t.includes("electric") || t.includes("kwh") || t.includes("grid")) return { scope: 2, category: "electricity" };
  if (t.includes("gas") && !t.includes("gasoline")) return { scope: 1, category: "stationary_combustion" };
  if (t.includes("diesel") || t.includes("gasoline") || t.includes("petrol")) return { scope: 1, category: "mobile_combustion" };
  if (t.includes("refrigerant")) return { scope: 1, category: "refrigerant" };
  if (t.includes("waste")) return { scope: 3, category: "waste" };
  if (t.includes("air") || t.includes("flight") || t.includes("travel")) return { scope: 3, category: "business_travel" };
  if (t.includes("commut")) return { scope: 3, category: "employee_commuting" };
  return { scope: 3, category: "purchased_goods_services" };
}

/** Finds the best factor for a normalized row given the full factor list. */
function resolveFactorQuery(row: NormalizedRow) {
  const t = (row.activity_type ?? "").toLowerCase();
  const u = (row.unit ?? "").toLowerCase();

  if (u.includes("kwh") || t.includes("electric")) return { category: "electricity_location", unit: "kWh" };
  if (u.includes("therm") || (t.includes("gas") && !t.includes("gasoline"))) return { category: "stationary_combustion", unit: "therm" };
  if (u.includes("gallon") && t.includes("diesel")) return { category: "mobile_combustion", unit: "gallon" };
  if (u.includes("gallon") || t.includes("gasoline")) return { category: "mobile_combustion", unit: "gallon" };
  if (u.includes("mile")) return { category: "commute", unit: "mile" };
  if (u.includes("ton") || t.includes("waste")) return { category: "waste", unit: "ton" };
  return null;
}

let _idCounter = 0;
function newId(): string {
  return `li_${Date.now()}_${++_idCounter}`;
}

/**
 * Converts a normalized row to a DB insert, or null if quantity is missing
 * or no factor can be matched.
 */
export function rowToLineItem(
  row: NormalizedRow,
  factors: EmissionFactor[],
  companyId: string,
  mappingProfileId: string | null = null
): LineItemInsert | null {
  if (row.quantity === undefined || row.quantity === null) return null;

  const scopeInfo = row.scope
    ? { scope: row.scope, category: row.category ?? resolveScope(row.activity_type).category }
    : resolveScope(row.activity_type);

  const query = resolveFactorQuery(row);
  const factor = query ? lookupFactor(factors, query) : null;

  if (!factor) return null;

  const { co2e_kg, calc_log } = applyFactor(row.quantity, row.unit ?? "", factor);

  return {
    id: newId(),
    companyId,
    sourceRef: row.source_ref ?? "",
    scope: scopeInfo.scope,
    category: scopeInfo.category,
    rawValue: String(row.quantity),
    rawUnit: row.unit ?? "",
    co2eKg: co2e_kg.toFixed(4),
    confidence: row.confidence ?? "estimated",
    factorId: factor.factor_id,
    calcLog: calc_log,
    mappingProfileId,
    createdAt: new Date().toISOString(),
  };
}
