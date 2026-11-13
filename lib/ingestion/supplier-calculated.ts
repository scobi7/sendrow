import { uid } from "@/lib/store";
import type { LineItemInsert } from "./ingest";

/** Supplier-calculated emissions (existing_inventory): CO2e the supplier already
 *  calculated. The supplier's figure is kept as given, labeled, and never has one
 *  of our factors applied. Pure: no DB access. */

type SupplierField =
  | "scope"
  | "category"
  | "description"
  | "emissions"
  | "unit"
  | "method"
  | "factorSource"
  | "reportingYear";

/** Maps each supplier field to the raw header that carries it. */
export type SupplierHeaderMap = Partial<Record<SupplierField, string>>;

const FIELD_ALIASES: Record<SupplierField, string[]> = {
  scope: ["scope"],
  category: ["category", "emission category", "source category"],
  description: ["description", "emission source", "source", "site", "facility"],
  emissions: ["emissions", "co2e", "tco2e", "kgco2e", "total emissions", "emissions tco2e", "emissions kgco2e"],
  unit: ["unit", "units", "emissions unit"],
  method: ["method", "methodology", "calculation method", "approach"],
  factorSource: ["emission factor source", "factor source", "ef source", "emission factors"],
  reportingYear: ["reporting year", "year", "fiscal year", "period"],
};

/** Case, spacing and punctuation insensitive key: "Emissions (tCO2e)" → "emissions tco2e". */
function normalizeHeader(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const FIELD_ORDER = Object.keys(FIELD_ALIASES) as SupplierField[];

/** Matches raw spreadsheet headers to supplier fields. Each header maps to at
 *  most one field, and each field takes the first header that matches it. */
export function matchSupplierHeaders(headers: string[]): SupplierHeaderMap {
  const map: SupplierHeaderMap = {};
  const claimed = new Set<string>();
  for (const field of FIELD_ORDER) {
    const aliases = new Set(FIELD_ALIASES[field]);
    for (const header of headers) {
      if (claimed.has(header)) continue;
      if (aliases.has(normalizeHeader(header))) {
        map[field] = header;
        claimed.add(header);
        break;
      }
    }
  }
  return map;
}

const TONNE_UNITS = new Set(["tco2e", "tonco2e", "tonnesco2e", "tonneco2e", "mtco2e", "metrictonsco2e", "metrictonco2e"]);
const KG_UNITS = new Set(["kgco2e", "kilogramsco2e", "kilogramco2e"]);
const TONNE_KG = 1000;

type UnitInfo = { factorToKg: number; label: "tCO2e" | "kgCO2e" };

/** A unit cell: only the recognized spellings count. */
function parseUnitCell(raw: string): UnitInfo | null {
  const compact = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (TONNE_UNITS.has(compact)) return { factorToKg: TONNE_KG, label: "tCO2e" };
  if (KG_UNITS.has(compact)) return { factorToKg: 1, label: "kgCO2e" };
  return null;
}

/** An emissions header that states its unit, e.g. "Emissions (tCO2e)". */
function inferUnitFromHeader(header: string): UnitInfo | null {
  const compact = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (compact.includes("kgco2e")) return { factorToKg: 1, label: "kgCO2e" };
  for (const token of TONNE_UNITS) {
    if (compact.includes(token)) return { factorToKg: TONNE_KG, label: "tCO2e" };
  }
  return null;
}

/** Scope from "1", "Scope 1", "S1" or "s 1". */
export function parseSupplierScope(raw: string | undefined): 1 | 2 | 3 | null {
  const m = (raw ?? "").trim().match(/^(?:scope|s)?\s*([123])$/i);
  return m ? (Number(m[1]) as 1 | 2 | 3) : null;
}

/** Emissions number; thousands commas are removed. Must be zero or more. */
function parseEmissions(raw: string | undefined): number | null {
  const cleaned = (raw ?? "").trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

/** Reporting year: "2025" or "FY2025" kept as stated, otherwise null. */
function parsePeriod(raw: string | undefined): string | null {
  const m = (raw ?? "").trim().match(/^(FY\s?)?((?:19|20)\d{2})$/i);
  if (!m) return null;
  return m[1] ? `FY${m[2]}` : m[2];
}

function snakeCase(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export type SupplierRowContext = {
  companyId: string;
  mappingProfileId?: string | null;
  evidenceId?: string | null;
};

type SupplierCalcLog = {
  origin: "supplier_calculated";
  stated_value: number;
  stated_unit: "tCO2e" | "kgCO2e";
  stated_method: string;
  stated_factor_source: string;
  reporting_year: string | null;
  evidence_id: string | null;
};

type SupplierUnmappedLog = {
  origin: "supplier_calculated";
  reason: string;
  raw_scope: string;
  raw_category: string;
  raw_description: string;
  raw_emissions: string;
  raw_unit: string;
  stated_method: string;
  stated_factor_source: string;
  reporting_year: string;
  evidence_id: string | null;
};

/** Same shape as rowToLineItem's return, with the supplier-specific calc log and period. */
export type SupplierLineItemInsert = Omit<LineItemInsert, "calcLog"> & {
  calcLog: SupplierCalcLog | SupplierUnmappedLog;
  period: string | null;
};

/** Turns one supplier row into a line item. Never drops a row: a row that fails
 *  validation comes back as a flagged, unmapped item with the reason recorded. */
export function supplierRowToLineItem(
  row: Record<string, string>,
  headerMap: SupplierHeaderMap,
  ctx: SupplierRowContext
): SupplierLineItemInsert {
  const get = (field: SupplierField) => (headerMap[field] !== undefined ? (row[headerMap[field]!] ?? "").trim() : "");

  const rawScope = get("scope");
  const rawCategory = get("category");
  const rawDescription = get("description");
  const rawEmissions = get("emissions");
  const rawUnit = get("unit");
  const method = get("method");
  const factorSource = get("factorSource");
  const rawYear = get("reportingYear");

  const scope = parseSupplierScope(rawScope);
  const emissions = parseEmissions(rawEmissions);

  // Unit: a recognized unit cell wins; otherwise the emissions header must state one.
  const unitFromCell = rawUnit ? parseUnitCell(rawUnit) : null;
  const unitFromHeader = headerMap.emissions ? inferUnitFromHeader(headerMap.emissions) : null;
  const unit = unitFromCell ?? (rawUnit ? null : unitFromHeader);

  const problems: string[] = [];
  if (scope === null) problems.push("Scope must be 1, 2 or 3");
  if (emissions === null) problems.push(rawEmissions ? "Emissions must be a number of zero or more" : "Emissions value is missing");
  if (!unit) {
    problems.push(rawUnit
      ? `Unit "${rawUnit}" is not tCO2e or kgCO2e`
      : "Unit is missing and the emissions column does not state tCO2e or kgCO2e");
  }

  const category = rawCategory ? snakeCase(rawCategory) : "";
  const sourceRef = rawDescription || rawCategory;
  const period = parsePeriod(rawYear);
  const evidenceId = ctx.evidenceId ?? null;

  if (problems.length > 0 || scope === null || emissions === null || !unit) {
    const log: SupplierUnmappedLog = {
      origin: "supplier_calculated",
      reason: problems.join("; ") + ".",
      raw_scope: rawScope,
      raw_category: rawCategory,
      raw_description: rawDescription,
      raw_emissions: rawEmissions,
      raw_unit: rawUnit,
      stated_method: method,
      stated_factor_source: factorSource,
      reporting_year: rawYear,
      evidence_id: evidenceId,
    };
    return {
      id: uid("li_"),
      companyId: ctx.companyId,
      sourceRef,
      scope: scope ?? 3,
      category: category || "supplier_reported",
      rawValue: rawEmissions || "0",
      rawUnit,
      co2eKg: "0",
      confidence: "flagged",
      status: "unmapped",
      factorId: null,
      calcLog: log,
      mappingProfileId: ctx.mappingProfileId ?? null,
      period,
      createdAt: new Date().toISOString(),
    };
  }

  const log: SupplierCalcLog = {
    origin: "supplier_calculated",
    stated_value: emissions,
    stated_unit: unit.label,
    stated_method: method,
    stated_factor_source: factorSource,
    reporting_year: period,
    evidence_id: evidenceId,
  };
  return {
    id: uid("li_"),
    companyId: ctx.companyId,
    sourceRef,
    scope,
    category: category || "supplier_reported",
    rawValue: String(emissions),
    rawUnit: unit.label,
    co2eKg: (emissions * unit.factorToKg).toFixed(4),
    confidence: "supplier_calculated",
    status: "mapped",
    factorId: null,
    calcLog: log,
    mappingProfileId: ctx.mappingProfileId ?? null,
    period,
    createdAt: new Date().toISOString(),
  };
}

/** True when a line item's calc log says the supplier calculated it. */
export function isSupplierCalculated(calcLog: unknown): boolean {
  return typeof calcLog === "object" && calcLog !== null && (calcLog as { origin?: unknown }).origin === "supplier_calculated";
}
