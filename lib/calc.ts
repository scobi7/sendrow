import { CalcResult, Company, EmissionFactor } from "./types";
import { getFactor, uid } from "./store";
import { COMMUTE_FACTOR, QB_CATEGORY_TO_USEEIO, REFRIGERANT_FACTOR } from "./factors";

/**
 * Server-side calculation engine. Runs after every data save; results are
 * stored on the company record. The dashboard reads stored values only.
 * Every result carries the factor id used and a human-readable formula —
 * both flow into the audit trail and methodology section.
 */

const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

export function headcountMidpoint(company: Company): number {
  if (company.inputs.social_total_employees) return company.inputs.social_total_employees;
  return { under_50: 35, "50_150": 100, "150_350": 250, "350_500": 425 }[
    company.headcountRange ?? "50_150"
  ];
}

export function recalcCompany(company: Company, factorOverrides: EmissionFactor[] = []): void {
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
        add(1, `Fleet fuel — ${name}`, gal * f.value, fid,
          `${fmt(gal)} gal ${name} × ${f.value} ${f.unit} = ${fmt(r2(gal * f.value))} tCO2e`);
      }
    }
  }
  if (!inp.natgas_na) {
    const utilityTherms = company.utilityData.reduce((s, m) => s + m.therms, 0);
    const therms = inp.natgas_therms_override ?? (utilityTherms > 0 ? utilityTherms : null);
    if (therms && therms > 0) {
      const f = getF("natgas.therm.2025");
      const src = inp.natgas_therms_override != null ? "manual entry" : "utility connection";
      add(1, "Natural gas", therms * f.value, f.factor_id,
        `${fmt(therms)} therms (${src}) × ${f.value} ${f.unit} = ${fmt(r2(therms * f.value))} tCO2e`);
    }
  }
  if (!inp.refrigerant_na && inp.refrigerant_kg && inp.refrigerant_kg > 0 && inp.refrigerant_type) {
    const fid = REFRIGERANT_FACTOR[inp.refrigerant_type];
    if (fid) {
      const f = getF(fid);
      const tons = (inp.refrigerant_kg * f.value) / 1000;
      add(1, `Refrigerant — ${inp.refrigerant_type}`, tons, fid,
        `${fmt(inp.refrigerant_kg)} kg ${inp.refrigerant_type} × GWP ${f.value} ÷ 1000 = ${fmt(r2(tons))} tCO2e`);
    }
  }
  if (!inp.equipment_na && inp.equipment_gal && inp.equipment_gal > 0 && inp.equipment_fuel_type) {
    const fid = `equip.${inp.equipment_fuel_type.toLowerCase()}.2025`;
    const f = getF(fid);
    add(1, `On-site equipment — ${inp.equipment_fuel_type.toLowerCase()}`, inp.equipment_gal * f.value, fid,
      `${fmt(inp.equipment_gal)} gal × ${f.value} ${f.unit} = ${fmt(r2(inp.equipment_gal * f.value))} tCO2e`);
  }

  // ───────────── Scope 2 ─────────────
  if (company.connections.utility.connected && company.utilityData.length > 0) {
    const residual = getF("residual.WECC.2024");
    const recPct = inp.has_recs ? Math.min(Math.max(inp.rec_coverage_pct ?? 0, 0), 100) : 0;
    for (const loc of company.locations) {
      const kwh = company.utilityData.filter((m) => m.locationId === loc.id).reduce((s, m) => s + m.kwh, 0);
      if (kwh <= 0) continue;
      const f = getF(loc.egridSubregion);
      const locBased = kwh * f.value;
      const mktBased = kwh * residual.value * (1 - recPct / 100);
      add(2, `Electricity — ${loc.city || loc.address}`, locBased, f.factor_id,
        `${fmt(kwh)} kWh × ${f.value} ${f.unit} (${f.factor_name}) = ${fmt(r2(locBased))} tCO2e location-based; ` +
        `market-based ${fmt(kwh)} kWh × ${residual.value} (residual mix)${recPct ? ` × ${100 - recPct}% non-REC` : ""} = ${fmt(r2(mktBased))} tCO2e`,
        "measured", mktBased);
    }
  }

  // ───────────── Scope 3 ─────────────
  if (company.connections.quickbooks.connected && company.qbTransactions.length > 0) {
    const byCategory: Record<string, number> = {};
    for (const t of company.qbTransactions) byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    const buckets: Record<string, { tons: number; spend: number; parts: string[] }> = {
      travel: { tons: 0, spend: 0, parts: [] },
      purchased: { tons: 0, spend: 0, parts: [] },
      freight: { tons: 0, spend: 0, parts: [] },
    };
    for (const [cat, spend] of Object.entries(byCategory)) {
      const map = QB_CATEGORY_TO_USEEIO[cat];
      if (!map) continue;
      const f = getF(map.factorId);
      const tons = spend * f.value;
      const b = buckets[map.bucket];
      b.tons += tons;
      b.spend += spend;
      b.parts.push(`$${fmt(spend)} ${cat} × ${f.value} ${f.unit}`);
    }
    if (buckets.travel.tons > 0)
      add(3, "Business travel", buckets.travel.tons, "useeio.air_travel.v2",
        `Spend-based (USEEIO): ${buckets.travel.parts.join(" + ")} = ${fmt(r2(buckets.travel.tons))} tCO2e`, "spend_based");
    if (buckets.purchased.tons > 0)
      add(3, "Purchased goods & services", buckets.purchased.tons, "useeio.materials.v2",
        `Spend-based (USEEIO): ${buckets.purchased.parts.join(" + ")} = ${fmt(r2(buckets.purchased.tons))} tCO2e`, "spend_based");
    if (buckets.freight.tons > 0)
      add(3, "Upstream freight", buckets.freight.tons, "useeio.freight.v2",
        `Spend-based (USEEIO): ${buckets.freight.parts.join(" + ")} = ${fmt(r2(buckets.freight.tons))} tCO2e`, "spend_based");
  }

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
      add(3, `Waste — ${name}`, tons * f.value, fid,
        `${fmt(tons)} short tons ${name} × ${f.value} ${f.unit} = ${fmt(r2(tons * f.value))} tCO2e`);
    }
  }

  for (const [cat, decision] of Object.entries(inp.scope3_other_categories ?? {})) {
    if (decision === "industry_average") {
      // flat low-confidence placeholder: 1% of current scope 3 subtotal or 5 t
      const s3 = results.filter((r) => r.scope === 3).reduce((s, r) => s + r.co2eTons, 0);
      const est = r2(Math.max(s3 * 0.01, 5));
      add(3, `${cat} (industry average estimate)`, est, null,
        `Estimated with industry average — flagged low-confidence in audit trail`, "estimated");
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

export function totals(company: Company): Totals {
  const s = (n: number[]) => r2(n.reduce((a, b) => a + b, 0));
  const scope1 = s(company.calcs.filter((c) => c.scope === 1).map((c) => c.co2eTons));
  const scope2Location = s(company.calcs.filter((c) => c.scope === 2).map((c) => c.co2eTons));
  const scope2Market = s(company.calcs.filter((c) => c.scope === 2).map((c) => c.marketBasedTons ?? c.co2eTons));
  const scope3 = s(company.calcs.filter((c) => c.scope === 3).map((c) => c.co2eTons));
  return { scope1, scope2Location, scope2Market, scope3, total: r2(scope1 + scope2Location + scope3) };
}
