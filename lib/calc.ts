import { CalcResult, Company, EmissionFactor } from "./types";
import { getFactor, uid } from "./store";
import { COMMUTE_FACTOR, REFRIGERANT_FACTOR } from "./factors";
import type { VendorMapping } from "./vendor-mappings";

/**
 * Server-side calculation engine. Runs after every data save; results are
 * stored on the company record. The dashboard reads stored values only.
 * Every result carries the factor id used and a human-readable formula -  * both flow into the audit trail and methodology section.
 */

const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export function headcountMidpoint(company: Company): number {
  if (company.inputs.social_total_employees) return company.inputs.social_total_employees;
  return { under_50: 35, "50_150": 100, "150_350": 250, "350_500": 425 }[
    company.headcountRange ?? "50_150"
  ];
}

/** Returns the most recent complete 12-month reporting period based on fiscal year end month. */
export function reportingPeriod(fiscalYearEndMonth: number): {
  start: string; // YYYY-MM
  end: string;   // YYYY-MM
  label: string;
} {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Use previous year's end if the current FY hasn't closed yet
  const endYear = currentMonth > fiscalYearEndMonth ? currentYear : currentYear - 1;
  const endDate = new Date(endYear, fiscalYearEndMonth, 0); // last day of end month

  const startMonth = (fiscalYearEndMonth % 12) + 1; // month after end month (Jan if end=Dec)
  const startYear = fiscalYearEndMonth === 12 ? endYear : endYear - 1;
  const startDate = new Date(startYear, startMonth - 1, 1);

  const fmt = (d: Date) => d.toLocaleString("en-US", { month: "short", year: "numeric" });
  return {
    start: startDate.toISOString().substring(0, 7),
    end: endDate.toISOString().substring(0, 7),
    label: `${fmt(startDate)} – ${fmt(endDate)}`,
  };
}

/**
 * Recalculates the manual-entry calcs (fleet, natural gas override, refrigerants,
 * equipment, commuting, waste, industry-average placeholders). Electricity and
 * spend-based figures arrive as imported line items and are combined in
 * combinedTotals, not here. `_vendorMappings` is accepted for caller
 * compatibility only: vendor-mapped spend resolves in the ingestion pipeline.
 */
export function recalcCompany(
  company: Company,
  factorOverrides: EmissionFactor[] = [],
  _vendorMappings: VendorMapping[] = []
): void {
  const results: CalcResult[] = [];
  const inp = company.inputs;

  const getF = (id: string): EmissionFactor => {
    const override = factorOverrides.find((f) => f.factor_id === id);
    return override ?? getFactor(id);
  };

  const add = (
    scope: 1 | 2 | 3,
    category: string,
    co2eTons: number,
    factorId: string | null,
    formula: string,
    basis: CalcResult["basis"] = "measured",
    marketBasedTons?: number
  ) => {
    results.push({ id: uid("calc_"), scope, category, co2eTons: r2(co2eTons), factorId, formula, basis, marketBasedTons: marketBasedTons === undefined ? undefined : r2(marketBasedTons) });
  };

  // ───────────── Scope 1 ─────────────
  if (!inp.fleet_na) {
    const fuels: [string, number | null | undefined, string][] = [
      ["gasoline", inp.fleet_gasoline_gal, "fuel.gasoline.2025"],
      ["diesel", inp.fleet_diesel_gal, "fuel.diesel.2025"],
      ["propane", inp.fleet_propane_gal, "fuel.propane.2025"],
    ];
    for (const [name, gal, fid] of fuels) {
      if (gal && gal > 0) {
        const f = getF(fid);
        add(1, `Fleet fuel - ${name}`, gal * f.value, fid,
          `${fmt(gal)} gal ${name} × ${f.value} ${f.unit} = ${fmt(r2(gal * f.value))} tCO2e`);
      }
    }
  }
  if (!inp.natgas_na) {
    const therms = inp.natgas_therms_override;
    if (therms && therms > 0) {
      const f = getF("natgas.therm.2025");
      add(1, "Natural gas", therms * f.value, f.factor_id,
        `${fmt(therms)} therms (manual entry) × ${f.value} ${f.unit} = ${fmt(r2(therms * f.value))} tCO2e`);
    }
  }
  if (!inp.refrigerant_na && inp.refrigerant_kg && inp.refrigerant_kg > 0 && inp.refrigerant_type) {
    const fid = REFRIGERANT_FACTOR[inp.refrigerant_type];
    if (fid) {
      const f = getF(fid);
      const tons = (inp.refrigerant_kg * f.value) / 1000;
      add(1, `Refrigerant - ${inp.refrigerant_type}`, tons, fid,
        `${fmt(inp.refrigerant_kg)} kg ${inp.refrigerant_type} × GWP ${f.value} ÷ 1000 = ${fmt(r2(tons))} tCO2e`);
    }
  }
  if (!inp.equipment_na && inp.equipment_gal && inp.equipment_gal > 0 && inp.equipment_fuel_type) {
    const fid = `equip.${inp.equipment_fuel_type.toLowerCase()}.2025`;
    const f = getF(fid);
    add(1, `On-site equipment - ${inp.equipment_fuel_type.toLowerCase()}`, inp.equipment_gal * f.value, fid,
      `${fmt(inp.equipment_gal)} gal × ${f.value} ${f.unit} = ${fmt(r2(inp.equipment_gal * f.value))} tCO2e`);
  }

  // ───────────── Scope 3 ─────────────
  if (inp.commute_avg_miles && inp.commute_mode && inp.commute_days_in_office != null) {
    const fid = COMMUTE_FACTOR[inp.commute_mode];
    if (fid) {
      const f = getF(fid);
      const employees = headcountMidpoint(company);
      const annualDays = Math.round(235 * ((inp.commute_days_in_office ?? 5) / 5));
      const tons = employees * inp.commute_avg_miles * annualDays * f.value;
      add(3, "Employee commuting", tons, fid,
        `${employees} employees × ${fmt(inp.commute_avg_miles)} mi/day × ${annualDays} days × ${f.value} ${f.unit} = ${fmt(r2(tons))} tCO2e`,
        "estimated");
    }
  }

  const wasteRows: [string, number | null | undefined, string][] = [
    ["landfilled", inp.waste_landfill_tons, "waste.landfill.2025"],
    ["recycled", inp.waste_recycled_tons, "waste.recycled.2025"],
    ["composted", inp.waste_composted_tons, "waste.composted.2025"],
  ];
  for (const [name, tons, fid] of wasteRows) {
    if (tons && tons > 0) {
      const f = getF(fid);
      add(3, `Waste - ${name}`, tons * f.value, fid,
        `${fmt(tons)} short tons ${name} × ${f.value} ${f.unit} = ${fmt(r2(tons * f.value))} tCO2e`);
    }
  }

  for (const [cat, decision] of Object.entries(inp.scope3_other_categories ?? {})) {
    if (decision === "industry_average") {
      // flat low-confidence placeholder: 1% of current scope 3 subtotal or 5 t
      const s3 = results.filter((r) => r.scope === 3).reduce((s, r) => s + r.co2eTons, 0);
      const est = r2(Math.max(s3 * 0.01, 5));
      add(3, `${cat} (industry average estimate)`, est, null,
        `Estimated with industry average - flagged low-confidence in audit trail`, "estimated");
    }
  }

  company.calcs = results;
}

export interface Totals {
  scope1: number;
  scope2Location: number;
  scope2Market: number;
  scope3: number;
  total: number;
}

export type RecContext = { hasRecs: boolean; recCoveragePct: number; residualFactorValue: number };

/** Builds the REC/residual-mix context for a company, same inputs + factor
 *  (`residual.WECC.2024`) the manual-entry path uses in recalcCompany above.
 *  Shared so every consumer of imported line items applies the identical
 *  market-based adjustment instead of each reimplementing it (or skipping it). */
function recContextFor(company: Company): RecContext {
  const inp = company.inputs;
  return {
    hasRecs: !!inp?.has_recs,
    recCoveragePct: Math.min(Math.max(inp?.rec_coverage_pct ?? 0, 0), 100),
    residualFactorValue: getFactor("residual.WECC.2024").value,
  };
}

/** The one REC/residual-mix rule for market-based Scope 2. Returns the market-based
 *  tons for a kWh electricity line item, or null when the row keeps its
 *  location-based tons (no rec context, or not a kWh electricity row with a value).
 *  Used by lineItemTotals here. */
export function recAdjustedKwhTons(
  item: { category?: string; rawUnit?: string | null; rawValue?: string | number | null },
  rec?: RecContext
): number | null {
  if (!rec || item.category !== "electricity" || item.rawUnit !== "kWh" || item.rawValue == null) return null;
  // residualFactorValue is tCO2e/kWh (same unit as egrid factors), so this is already tons.
  return Number(item.rawValue) * rec.residualFactorValue * (1 - (rec.hasRecs ? rec.recCoveragePct : 0) / 100);
}

/** The one consultant-override rule for market-based Scope 2
 *  (company.inputs.scope2_market_override_tons, X3.4). An override wins over the
 *  derived figure and is rounded to 2dp; with no override the derived figure is returned unchanged. */
export function applyScope2MarketOverride(derivedTons: number, override: number | null | undefined): number {
  return override !== null && override !== undefined ? r2(override) : derivedTons;
}

/** Tons of CO2e from imported line items (the portal pipeline). Only mapped
 *  rows count - unmapped/excluded carry zero.
 *
 *  Market-based scope 2: when `rec` is supplied and a row is a kWh electricity
 *  line item, market-based is recomputed from the row's raw kWh via the
 *  residual-mix factor and REC coverage - matching the manual-entry formula
 *  in recalcCompany above - instead of reusing the location-based figure.
 *  Without `rec` (or for non-electricity/non-kWh rows), location-based stands
 *  in, same as before. */
export function lineItemTotals(
  items: {
    scope: number;
    category?: string;
    co2eKg: string | number;
    rawValue?: string | number | null;
    rawUnit?: string | null;
    status: string;
  }[],
  rec?: RecContext
): Totals {
  let s1 = 0, s2Location = 0, s2Market = 0, s3 = 0;
  for (const i of items) {
    if (i.status !== "mapped") continue;
    const tons = Number(i.co2eKg) / 1000;
    if (i.scope === 1) { s1 += tons; continue; }
    if (i.scope === 3) { s3 += tons; continue; }
    s2Location += tons;
    // Already tons, unlike co2eKg above which is kg.
    s2Market += recAdjustedKwhTons(i, rec) ?? tons;
  }
  return { scope1: r2(s1), scope2Location: r2(s2Location), scope2Market: r2(s2Market), scope3: r2(s3), total: r2(s1 + s2Location + s3) };
}

/** The company's full picture: inputs-based calcs (manage-on-behalf)
 *  PLUS imported line items (portal). Duplicates are the consultant's call -  *  the ledger's exclude exists for exactly that. */
export function combinedTotals(
  company: Company,
  items: {
    scope: number;
    category?: string;
    co2eKg: string | number;
    rawValue?: string | number | null;
    rawUnit?: string | null;
    status: string;
  }[]
): Totals {
  const a = totals(company);
  const b = lineItemTotals(items, recContextFor(company));
  return {
    scope1: r2(a.scope1 + b.scope1),
    scope2Location: r2(a.scope2Location + b.scope2Location),
    scope2Market: r2(a.scope2Market + b.scope2Market),
    scope3: r2(a.scope3 + b.scope3),
    total: r2(a.total + b.total),
  };
}

export function totals(company: Company): Totals {
  const s = (n: number[]) => r2(n.reduce((a, b) => a + b, 0));
  const scope1 = s(company.calcs.filter((c) => c.scope === 1).map((c) => c.co2eTons));
  const scope2Location = s(company.calcs.filter((c) => c.scope === 2).map((c) => c.co2eTons));
  const scope2Market = applyScope2MarketOverride(
    s(company.calcs.filter((c) => c.scope === 2).map((c) => c.marketBasedTons ?? c.co2eTons)),
    company.inputs?.scope2_market_override_tons
  );
  const scope3 = s(company.calcs.filter((c) => c.scope === 3).map((c) => c.co2eTons));
  return { scope1, scope2Location, scope2Market, scope3, total: r2(scope1 + scope2Location + scope3) };
}
