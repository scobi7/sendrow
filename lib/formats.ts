import * as XLSX from "xlsx";
import type { SnapshotTotals } from "./snapshots";

/** The reshaping engine (Plan T4): one approved snapshot in, any output
 *  format out. Formats are maintained centrally - when a regulator changes
 *  their form, we update it here and every export keeps working. */

export type FrozenLineItem = {
  sourceRef: string;
  scope: number;
  category: string;
  rawValue: string;
  rawUnit: string;
  co2eKg: string;
  period: string | null;
  factorId: string | null;
  calcLog: unknown;
  origin?: "line_item" | "manual";
  locationId?: string | null;
  factorSource?: string;
  factorSourceUrl?: string;
  locationName?: string | null;
  evidenceFilename?: string | null;
};

export type SnapshotForExport = {
  id: string;
  label: string;
  createdAt: string;
  sha256: string;
  itemCount: number;
  totals: SnapshotTotals;
  lineItems: FrozenLineItem[];
};

export type CompanyForExport = {
  name: string;
  industry: string | null;
  headcountRange: string | null;
};

export type ExportFile = { filename: string; mime: string; content: Buffer };

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

function factorVintages(items: FrozenLineItem[]): string[] {
  return [...new Set(items.map((i) => i.factorId).filter((f): f is string => Boolean(f)))].sort();
}

function safe(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

const LINE_ITEM_COLUMNS = [
  "Origin",
  "Source / vendor",
  "Scope",
  "Category",
  "Quantity",
  "Unit",
  "kg CO2e",
  "Period",
  "Location",
  "Factor ID",
  "Factor name",
  "Factor value",
  "Factor unit",
  "Factor year",
  "Factor source",
  "Source URL",
  "Method / formula",
  "Evidence file",
];

/** Reads a calcLog field defensively: calcLog is stored JSON, so any key may be missing. */
function logValue(log: unknown, key: string): unknown {
  if (!log || typeof log !== "object") return undefined;
  const v = (log as Record<string, unknown>)[key];
  return v === null ? undefined : v;
}

function logNumber(log: unknown, key: string): number | "" {
  const v = logValue(log, key);
  const n = typeof v === "number" || typeof v === "string" ? Number(v) : NaN;
  return v === "" || !Number.isFinite(n) ? "" : n;
}

function logString(log: unknown, key: string): string {
  const v = logValue(log, key);
  return typeof v === "string" ? v : "";
}

function methodFor(i: FrozenLineItem): string {
  const formula = logString(i.calcLog, "formula");
  if (i.origin !== "manual") return formula;
  const basis = logString(i.calcLog, "basis");
  if (!formula) return basis;
  return basis ? `${basis}: ${formula}` : formula;
}

/** Line items as an Excel workbook - the "just give me the data" format. */
export function toExcel(snapshot: SnapshotForExport, company: CompanyForExport): ExportFile {
  const rows = snapshot.lineItems.map((i) => ({
    Origin: i.origin === "manual" ? "Manual entry" : "Imported",
    "Source / vendor": i.sourceRef,
    Scope: i.scope,
    Category: i.category.replace(/_/g, " "),
    Quantity: i.rawValue === "" ? "" : Number(i.rawValue),
    Unit: i.rawUnit,
    "kg CO2e": Number(i.co2eKg),
    Period: i.period ?? "",
    Location: i.locationName ?? "",
    "Factor ID": i.factorId ?? "",
    "Factor name": logString(i.calcLog, "factor_name"),
    "Factor value": logNumber(i.calcLog, "factor_value"),
    "Factor unit": logString(i.calcLog, "factor_unit"),
    "Factor year": logNumber(i.calcLog, "factor_vintage"),
    "Factor source": i.factorSource ?? "",
    "Source URL": i.factorSourceUrl ?? "",
    "Method / formula": methodFor(i),
    "Evidence file": i.evidenceFilename ?? "",
  }));
  const kgSum = snapshot.lineItems.reduce((sum, i) => sum + Number(i.co2eKg), 0);
  const summary = [
    { Figure: "Scope 1", "t CO2e": snapshot.totals.scope1 },
    { Figure: "Scope 2 (location-based)", "t CO2e": snapshot.totals.scope2Location },
    { Figure: "Scope 2 (market-based)", "t CO2e": snapshot.totals.scope2Market },
    { Figure: "Scope 3", "t CO2e": snapshot.totals.scope3 },
    { Figure: "Total", "t CO2e": snapshot.totals.total },
    { Figure: "Line items sum (location-based)", "t CO2e": Math.round((kgSum / 1000) * 100) / 100 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Summary");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows, { header: LINE_ITEM_COLUMNS }), "Line items");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return {
    filename: `${safe(company.name)}-${safe(snapshot.label)}.xlsx`,
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    content: buf,
  };
}

/** SB 253-style disclosure draft: scope totals, methodology, factor vintages. */
export function toSB253(snapshot: SnapshotForExport, company: CompanyForExport): ExportFile {
  const t = snapshot.totals;
  const text = `# GHG Emissions Disclosure (SB 253-style draft)

**Reporting entity:** ${company.name}
**Industry:** ${company.industry ?? "Not stated"}
**Snapshot:** ${snapshot.label} - frozen ${new Date(snapshot.createdAt).toLocaleDateString("en-US")}
**Integrity hash:** ${snapshot.sha256}

## Emissions summary (metric tons CO2e)

| Scope | Emissions |
|---|---|
| Scope 1 - direct | ${fmt(t.scope1)} |
| Scope 2 - location-based | ${fmt(t.scope2Location)} |
| Scope 2 - market-based | ${fmt(t.scope2Market)} |
| Scope 3 - value chain | ${fmt(t.scope3)} |
| **Total (Scopes 1+2 location +3)** | **${fmt(t.total)}** |

## Methodology

Calculated in conformance with the GHG Protocol Corporate Standard.
Activity data: ${snapshot.itemCount} line items, each traceable to its source
document and calculation log. Both activity-based and spend-based methods are
used and labeled per line item.

**Emission factor sets used:** ${factorVintages(snapshot.lineItems).join(", ") || "n/a"}

## Statement of preparation

This disclosure was prepared from a frozen data snapshot that cannot be
altered after approval. Any subsequent correction is issued as a new,
separately identified version with a change notice to all recipients.

*Draft for consultant review - verify against the current CARB regulation
text before filing.*
`;
  return {
    filename: `${safe(company.name)}-sb253-draft.md`,
    mime: "text/markdown",
    content: Buffer.from(text, "utf8"),
  };
}

/** Generic buyer questionnaire: the questions every survey asks, answered from the snapshot. */
export function toQuestionnaire(snapshot: SnapshotForExport, company: CompanyForExport): ExportFile {
  const t = snapshot.totals;
  const rows: [string, string][] = [
    ["Company name", company.name],
    ["Industry / sector", company.industry ?? ""],
    ["Employee count range", company.headcountRange?.replace("under_", "under ").replace(/_/g, " to ") ?? ""],
    ["Do you measure your greenhouse gas emissions?", "Yes"],
    ["Methodology / standard used", "GHG Protocol Corporate Standard"],
    ["Scope 1 emissions (tCO2e)", fmt(t.scope1)],
    ["Scope 2 emissions, location-based (tCO2e)", fmt(t.scope2Location)],
    ["Scope 2 emissions, market-based (tCO2e)", fmt(t.scope2Market)],
    ["Scope 3 emissions (tCO2e)", fmt(t.scope3)],
    ["Total emissions (tCO2e)", fmt(t.total)],
    ["Reporting period / version", `${snapshot.label} (frozen ${new Date(snapshot.createdAt).toLocaleDateString("en-US")})`],
    ["Is your data third-party reviewed?", "Consultant-reviewed; every figure traceable to source documentation"],
    ["Data integrity reference", snapshot.sha256],
  ];
  const csv = ["Question,Answer", ...rows.map(([q, a]) => `"${q.replace(/"/g, '""')}","${a.replace(/"/g, '""')}"`)].join("\n");
  return {
    filename: `${safe(company.name)}-questionnaire-answers.csv`,
    mime: "text/csv",
    content: Buffer.from(csv, "utf8"),
  };
}

/** PACT-compatible JSON draft - basic product-carbon-footprint envelope fields. */
export function toPACT(snapshot: SnapshotForExport, company: CompanyForExport): ExportFile {
  const t = snapshot.totals;
  const doc = {
    specVersion: "2.0.0-draft",
    _note: "PACT-compatible draft export. Company-level footprint; PCF allocation is future work.",
    id: snapshot.id,
    created: snapshot.createdAt,
    status: "Active",
    companyName: company.name,
    companyIds: [],
    reportingPeriod: snapshot.label,
    pcf: {
      declaredUnit: "company-total",
      unitaryProductAmount: 1,
      fossilGhgEmissions: t.total,
      biogenicEmissions: null,
      breakdown: {
        scope1_tCO2e: t.scope1,
        scope2_locationBased_tCO2e: t.scope2Location,
        scope2_marketBased_tCO2e: t.scope2Market,
        scope3_tCO2e: t.scope3,
      },
      crossSectoralStandardsUsed: ["GHG Protocol Corporate Standard"],
      emissionFactorSets: factorVintages(snapshot.lineItems),
    },
    integrity: { sha256: snapshot.sha256, lineItemCount: snapshot.itemCount },
  };
  return {
    filename: `${safe(company.name)}-pact-draft.json`,
    mime: "application/json",
    content: Buffer.from(JSON.stringify(doc, null, 2), "utf8"),
  };
}

export const FORMATS: Record<string, { label: string; build: (s: SnapshotForExport, c: CompanyForExport) => ExportFile }> = {
  excel: { label: "Excel", build: toExcel },
  sb253: { label: "SB 253 draft", build: toSB253 },
  questionnaire: { label: "Questionnaire", build: toQuestionnaire },
  pact: { label: "PACT JSON", build: toPACT },
};
