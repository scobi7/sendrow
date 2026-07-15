import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { Company, EmissionFactor } from "@/lib/types";
import { totals } from "@/lib/calc";
import { fiscalPeriodLabel } from "@/lib/mapping";
import { SEED_FACTORS } from "@/lib/factors";
import type { ReportTotals, ScreeningDecision } from "@/lib/report-totals";

function lookupFactor(id: string, overrides: EmissionFactor[]): EmissionFactor | undefined {
  return overrides.find((f) => f.factor_id === id) ?? SEED_FACTORS.find((f) => f.factor_id === id);
}

const green = "#059669";
const slate900 = "#0f172a";
const slate600 = "#475569";
const slate400 = "#94a3b8";

const s = StyleSheet.create({
  page: { paddingHorizontal: 50, paddingVertical: 45, fontFamily: "Helvetica", fontSize: 10, color: slate600, lineHeight: 1.6 },
  badge: { fontSize: 8, fontFamily: "Helvetica-Bold", color: green, letterSpacing: 1.5, marginBottom: 8 },
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", color: slate900, marginBottom: 4 },
  meta: { fontSize: 10, color: slate600, marginBottom: 2 },
  metaSmall: { fontSize: 8, color: slate400 },
  headerRule: { borderBottomWidth: 3, borderBottomColor: green, borderBottomStyle: "solid", paddingBottom: 12, marginBottom: 18 },
  section: { marginTop: 18 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", color: slate900, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", borderBottomStyle: "solid", paddingBottom: 4 },
  h3: { fontSize: 10, fontFamily: "Helvetica-Bold", color: slate900, marginTop: 10, marginBottom: 4 },
  tblHead: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#cbd5e1", borderBottomStyle: "solid", paddingBottom: 4, marginBottom: 2 },
  tblHeadCell: { flex: 1, fontSize: 7, fontFamily: "Helvetica-Bold", color: slate400, letterSpacing: 0.5 },
  tblHeadRight: { width: 80, fontSize: 7, fontFamily: "Helvetica-Bold", color: slate400, letterSpacing: 0.5, textAlign: "right" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f1f5f9", borderBottomStyle: "solid", paddingVertical: 4 },
  cell: { flex: 1, fontSize: 10, color: slate600 },
  cellRight: { width: 80, fontSize: 10, fontFamily: "Helvetica-Bold", color: slate900, textAlign: "right" },
  totalRow: { flexDirection: "row", paddingTop: 8, marginTop: 2 },
  totalLabel: { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 11, color: slate900 },
  totalValue: { width: 80, fontFamily: "Helvetica-Bold", fontSize: 12, color: green, textAlign: "right" },
  para: { fontSize: 10, color: slate600, lineHeight: 1.7, marginTop: 4 },
  bullet: { fontSize: 9, color: slate400, marginTop: 3, lineHeight: 1.5 },
  empty: { fontSize: 9, color: slate400, marginTop: 4, fontStyle: "italic" },
  footer: { position: "absolute", bottom: 20, left: 50, right: 50, fontSize: 7, color: slate400, textAlign: "center", borderTopWidth: 0.5, borderTopColor: "#e2e8f0", borderTopStyle: "solid", paddingTop: 6 },
});

export interface GHGReportPDFProps {
  company: Company;
  factorOverrides?: EmissionFactor[];
  lineItemTotals?: ReportTotals | null;
  screeningDecisions?: ScreeningDecision[];
}

export function GHGReportPDF({ company, factorOverrides = [], lineItemTotals, screeningDecisions = [] }: GHGReportPDFProps) {
  const legacyTotals = totals(company);
  const t = lineItemTotals ?? legacyTotals;
  const dataSource = lineItemTotals ? "line_items" : "calcs";
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const period = fiscalPeriodLabel(company);
  const genDate = company.reportGeneratedAt
    ? new Date(company.reportGeneratedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const s1 = company.calcs.filter((c) => c.scope === 1);
  const s2 = company.calcs.filter((c) => c.scope === 2);
  const s3 = company.calcs.filter((c) => c.scope === 3);
  const estimates = company.calcs.filter((c) => c.basis !== "measured");
  const factorIds = Array.from(new Set(company.calcs.map((c) => c.factorId).filter(Boolean))) as string[];

  const scopeSections: [string, typeof s1, boolean][] = [
    ["SCOPE 1 - DIRECT EMISSIONS BY SOURCE", s1, false],
    ["SCOPE 2 - ELECTRICITY BY LOCATION (DUAL REPORTING)", s2, true],
    ["SCOPE 3 - VALUE CHAIN BY CATEGORY", s3, false],
  ];

  return (
    <Document title={`GHG Inventory - ${company.name}`}>
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.headerRule}>
          <Text style={s.badge}>GREENHOUSE GAS INVENTORY REPORT</Text>
          <Text style={s.h1}>{company.name}</Text>
          <Text style={s.meta}>Reporting period: {period}  ·  Industry: {company.industry ?? " - "}</Text>
          <Text style={s.metaSmall}>
            Prepared with Sendrow  ·  Generated {genDate}
            {company.reportingFramework ? `  ·  Purpose: ${company.reportingFramework.replace(/_/g, " ")}` : ""}
            {lineItemTotals ? `  ·  ${lineItemTotals.lineItemCount} imported line items` : ""}
          </Text>
        </View>

        {/* Summary table */}
        <View style={s.section}>
          <Text style={s.h2}>Summary of Emissions</Text>
          {(
            [
              ["Scope 1 - Direct emissions", t.scope1],
              ["Scope 2 - Electricity (location-based)", t.scope2Location],
              ["Scope 2 - Electricity (market-based)", t.scope2Market],
              ["Scope 3 - Value chain", t.scope3],
            ] as [string, number][]
          ).map(([label, val]) => (
            <View key={label} style={s.row}>
              <Text style={s.cell}>{label}</Text>
              <Text style={s.cellRight}>{fmt(val)} tCO2e</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total (Scope 1 + 2 location-based + 3)</Text>
            <Text style={s.totalValue}>{fmt(t.total)} tCO2e</Text>
          </View>
        </View>

        {/* Per-scope detail */}
        {scopeSections.map(([title, rows, isDual]) => (
          <View key={title} style={s.section} wrap={false}>
            <Text style={s.h2}>{title}</Text>
            {rows.length === 0 ? (
              <Text style={s.empty}>No emissions recorded in this scope.</Text>
            ) : (
              <View>
                <View style={s.tblHead}>
                  <Text style={s.tblHeadCell}>SOURCE</Text>
                  <Text style={s.tblHeadRight}>tCO2e</Text>
                  {isDual && <Text style={s.tblHeadRight}>MARKET-BASED</Text>}
                </View>
                {rows.map((c) => (
                  <View key={c.id} style={s.row}>
                    <Text style={s.cell}>
                      {c.category}{c.basis !== "measured" ? `  [${c.basis === "spend_based" ? "Spend-based" : "Estimate"}]` : ""}
                    </Text>
                    <Text style={s.cellRight}>{fmt(c.co2eTons)}</Text>
                    {isDual && <Text style={s.cellRight}>{fmt(c.marketBasedTons ?? 0)}</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Methodology */}
        <View style={s.section}>
          <Text style={s.h2}>Methodology Statement</Text>
          <Text style={s.para}>
            This inventory was prepared in accordance with the GHG Protocol Corporate Accounting and Reporting Standard.
            {dataSource === "line_items"
              ? " Emission totals are derived from imported activity data line items, each traceable to its source, factor, and calculation log."
              : " Scope 2 emissions are reported using both the location-based and market-based methods per the GHG Protocol Scope 2 Guidance."}
            {" "}Scope 3 categories derived from financial records use the spend-based method with USEEIO sector emission intensities.
            Activity data was sourced from utility records, accounting system exports, and management estimates as noted.
          </Text>
          {screeningDecisions.length > 0 && (
            <View>
              <Text style={s.h3}>Scope 3 materiality screening</Text>
              {screeningDecisions.filter((d) => d.status === "excluded").map((d) => (
                <Text key={d.categoryNumber} style={s.bullet}>
                  {"• "}Cat {d.categoryNumber} - {d.categoryName || `Category ${d.categoryNumber}`}: excluded
                  {d.reason ? ` (${d.reason})` : ""}
                </Text>
              ))}
              {screeningDecisions.filter((d) => d.status === "excluded").length === 0 && (
                <Text style={s.bullet}>All 15 Scope 3 categories assessed as material.</Text>
              )}
            </View>
          )}
          <Text style={s.h3}>Emission factors used</Text>
          {factorIds.map((fid) => {
            const f = lookupFactor(fid, factorOverrides);
            if (!f) return null;
            return (
              <Text key={fid} style={s.bullet}>
                {"• "}{f.factor_name}: {f.value} {f.unit} - {f.source} ({f.year_effective})
              </Text>
            );
          })}
        </View>

        {/* Data quality */}
        <View style={s.section}>
          <Text style={s.h2}>Data Quality Notes</Text>
          {estimates.length === 0 ? (
            <Text style={s.para}>All reported values are based on measured activity data.</Text>
          ) : (
            estimates.map((c) => (
              <Text key={c.id} style={s.bullet}>
                {"• "}{c.category}:{" "}
                {c.basis === "spend_based"
                  ? "calculated from financial spend using USEEIO sector averages - a recognized estimation method for first-time reporters."
                  : "estimated; flagged low-confidence. Replacing with measured data is recommended next cycle."}
              </Text>
            ))
          )}
        </View>

        {/* Repeating page footer */}
        <Text style={s.footer} fixed>
          {company.name} - GHG Inventory - {period} - Generated by Sendrow  ·  Emission factors are representative published values; verify against cited sources before external submission.
        </Text>
      </Page>
    </Document>
  );
}
