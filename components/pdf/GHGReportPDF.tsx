import React from "react";
import fs from "fs";
import path from "path";
import { fmtNum2 } from "@/lib/format";
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { Company, EmissionFactor } from "@/lib/types";
import type { Totals } from "@/lib/calc";
import { fiscalPeriodLabel } from "@/lib/mapping";
import { SEED_FACTORS } from "@/lib/factors";
import type { ScreeningDecision } from "@/lib/report-totals";
import type { BreakdownRow } from "@/lib/report-breakdown";

function lookupFactor(id: string, overrides: EmissionFactor[]): EmissionFactor | undefined {
  return overrides.find((f) => f.factor_id === id) ?? SEED_FACTORS.find((f) => f.factor_id === id);
}

const DEFAULT_ACCENT = "#0A7346";
// 4c theme (DESIGN.md): ink, muted, tertiary, lines, light fill. The consultant's accent stays the accent.
const INK = "#0D2A1E";
const MUTED = "#3D5A4C";
const TERTIARY = "#5B7266";
const LINE = "#C8DCCF";
const LIGHT_FILL = "#EEF4F0";

// Archivo (OFL) is bundled in components/pdf/fonts. If a file is missing, fall back to
// Helvetica: the PDF must never fail because of a font.
const FONT_DIR = path.join(process.cwd(), "components/pdf/fonts");
const FONT_FILES: Record<400 | 600 | 700, string> = {
  400: "Archivo-Regular.ttf",
  600: "Archivo-SemiBold.ttf",
  700: "Archivo-Bold.ttf",
};
const archivoReady = Object.values(FONT_FILES).every((f) => fs.existsSync(path.join(FONT_DIR, f)));
if (archivoReady) {
  Font.register({
    family: "Archivo",
    fonts: (Object.entries(FONT_FILES) as [string, string][]).map(([weight, file]) => ({
      src: path.join(FONT_DIR, file),
      fontWeight: Number(weight) as 400 | 600 | 700,
    })),
  });
}
// Word-splitting in narrow table cells looks wrong on a report; keep words whole.
Font.registerHyphenationCallback((word) => [word]);

const SANS = archivoReady ? "Archivo" : "Helvetica";
const sans = { fontFamily: SANS, fontWeight: 400 as const };
const semi = archivoReady ? { fontFamily: "Archivo", fontWeight: 600 as const } : { fontFamily: "Helvetica-Bold" };
const bold = archivoReady ? { fontFamily: "Archivo", fontWeight: 700 as const } : { fontFamily: "Helvetica-Bold" };

const s = StyleSheet.create({
  page: { paddingHorizontal: 50, paddingTop: 45, paddingBottom: 68, /* room for the fixed two-line footer */ ...sans, fontSize: 10, color: MUTED, lineHeight: 1.6 },
  logo: { height: 32, maxWidth: 180, objectFit: "contain", marginBottom: 8 },
  badge: { fontSize: 8, ...semi, marginBottom: 8 },
  h1: { fontSize: 22, ...bold, color: INK, lineHeight: 1.25, marginBottom: 6 },
  meta: { fontSize: 10, color: MUTED, marginBottom: 2 },
  metaSmall: { fontSize: 8, color: TERTIARY },
  headerRule: { borderBottomWidth: 3, borderBottomStyle: "solid", paddingBottom: 12, marginBottom: 18 },
  section: { marginTop: 18 },
  h2: { fontSize: 12, ...bold, color: INK, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: LINE, borderBottomStyle: "solid", paddingBottom: 4 },
  h3: { fontSize: 10, ...bold, color: INK, marginTop: 10, marginBottom: 4 },
  tblHead: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: LINE, borderBottomStyle: "solid", paddingBottom: 4, marginBottom: 2 },
  tblHeadCell: { flex: 1, fontSize: 8, ...semi, color: TERTIARY },
  tblHeadRight: { width: 80, fontSize: 8, ...semi, color: TERTIARY, textAlign: "right" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINE, borderBottomStyle: "solid", paddingVertical: 4 },
  cell: { flex: 1, fontSize: 10, color: MUTED },
  cellRight: { width: 80, fontSize: 10, ...semi, color: INK, textAlign: "right" },
  totalRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, marginTop: 4, backgroundColor: LIGHT_FILL },
  totalLabel: { flex: 1, ...bold, fontSize: 11, color: INK },
  totalValue: { width: 80, ...bold, fontSize: 12, textAlign: "right" },
  para: { fontSize: 10, color: MUTED, lineHeight: 1.7, marginTop: 4 },
  bullet: { fontSize: 9, color: MUTED, marginTop: 3, lineHeight: 1.5 },
  empty: { fontSize: 9, color: TERTIARY, marginTop: 4 },
  footer: { position: "absolute", bottom: 20, left: 50, right: 50, fontSize: 7, color: TERTIARY, textAlign: "center", borderTopWidth: 0.5, borderTopColor: LINE, borderTopStyle: "solid", paddingTop: 6 },
});

export interface GHGReportPDFProps {
  company: Company;
  factorOverrides?: EmissionFactor[];
  /** Shared totals from combinedTotals() (same as the snapshot). */
  totals: Totals;
  /** Per-scope rows (manual calcs and mapped line items) that add up to `totals`. */
  breakdown?: BreakdownRow[];
  /** Count of mapped line items included in `totals`. */
  lineItemCount?: number;
  /** Factor ids used by the mapped line items (resolved alongside company.calcs). */
  lineItemFactorIds?: string[];
  screeningDecisions?: ScreeningDecision[];
  brand?: { name: string; accent: string; logo: { data: Buffer; format: "png" | "jpg" } | null } | null;
}

export function GHGReportPDF({
  company,
  factorOverrides = [],
  totals: t,
  breakdown = [],
  lineItemCount = 0,
  lineItemFactorIds = [],
  screeningDecisions = [],
  brand = null,
}: GHGReportPDFProps) {
  const accent = brand?.accent ?? DEFAULT_ACCENT;
  const dataSource = lineItemCount > 0 ? "line_items" : "calcs";
  const period = fiscalPeriodLabel(company);
  const genDate = company.reportGeneratedAt
    ? new Date(company.reportGeneratedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const hasSpendBased = breakdown.some((r) => r.basis === "spend_based");
  const estimates = company.calcs.filter((c) => c.basis !== "measured");
  const factorIds = Array.from(
    new Set([...company.calcs.map((c) => c.factorId), ...lineItemFactorIds].filter((f): f is string => Boolean(f)))
  ).sort();

  const scopeSections: [string, BreakdownRow[], boolean][] = [
    ["Scope 1: direct emissions by source", breakdown.filter((r) => r.scope === 1), false],
    ["Scope 2: electricity by location (dual reporting)", breakdown.filter((r) => r.scope === 2), true],
    ["Scope 3: value chain by category", breakdown.filter((r) => r.scope === 3), false],
  ];

  return (
    <Document title={`GHG Inventory: ${company.name}`}>
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={[s.headerRule, { borderBottomColor: accent }]}>
          {brand?.logo && (
            <Image src={brand.logo} style={s.logo} />
          )}
          <Text style={[s.badge, { color: accent }]}>Greenhouse gas inventory report</Text>
          <Text style={s.h1}>{company.name}</Text>
          {brand && <Text style={s.meta}>Prepared by {brand.name}</Text>}
          <Text style={s.meta}>Reporting period: {period}  ·  Industry: {company.industry ?? "None"}</Text>
          <Text style={s.metaSmall}>
            Generated {genDate}
            {company.reportingFramework ? `  ·  Purpose: ${company.reportingFramework.replace(/_/g, " ")}` : ""}
            {lineItemCount > 0 ? `  ·  ${lineItemCount} imported line items` : ""}
          </Text>
        </View>

        {/* Summary table */}
        <View style={s.section}>
          <Text style={s.h2}>Summary of emissions</Text>
          {(
            [
              ["Scope 1: Direct emissions", t.scope1],
              ["Scope 2: Electricity (location-based)", t.scope2Location],
              ["Scope 2: Electricity (market-based)", t.scope2Market],
              ["Scope 3: Value chain", t.scope3],
            ] as [string, number][]
          ).map(([label, val]) => (
            <View key={label} style={s.row}>
              <Text style={s.cell}>{label}</Text>
              <Text style={s.cellRight}>{fmtNum2(val)} tCO2e</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total (Scope 1 + 2 location-based + 3)</Text>
            <Text style={[s.totalValue, { color: accent }]}>{fmtNum2(t.total)} tCO2e</Text>
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
                  <Text style={s.tblHeadCell}>Source</Text>
                  <Text style={s.tblHeadRight}>tCO2e</Text>
                  {isDual && <Text style={s.tblHeadRight}>Market-based</Text>}
                </View>
                {rows.map((r, idx) => (
                  <View key={`${r.origin}-${idx}`} style={s.row}>
                    <Text style={s.cell}>
                      {r.source}
                      {r.supplierCalculated
                        ? "  [Supplier calculated]"
                        : r.basis !== "measured" ? `  [${r.basis === "spend_based" ? "Spend-based" : "Estimate"}]` : ""}
                    </Text>
                    <Text style={s.cellRight}>{fmtNum2(r.tons)}</Text>
                    {isDual && <Text style={s.cellRight}>{fmtNum2(r.marketTons ?? 0)}</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Methodology */}
        <View style={s.section}>
          <Text style={s.h2}>Methodology statement</Text>
          <Text style={s.para}>
            This inventory was prepared in accordance with the GHG Protocol Corporate Accounting and Reporting Standard.
            {dataSource === "line_items"
              ? " Emission totals are derived from imported activity data line items, each traceable to its source, factor, and calculation log."
              : " Scope 2 emissions are reported using both the location-based and market-based methods per the GHG Protocol Scope 2 Guidance."}
            {hasSpendBased
              ? " Scope 3 categories derived from financial records use the spend-based method with USEEIO sector emission intensities."
              : ""}
            {" "}Activity data came from bills, invoices and records the client uploaded, and from figures entered by hand where noted.
          </Text>
          {screeningDecisions.length > 0 && (
            <View>
              <Text style={s.h3}>Scope 3 materiality screening</Text>
              {screeningDecisions.filter((d) => d.status === "excluded").map((d) => (
                <Text key={d.categoryNumber} style={s.bullet}>
                  Cat {d.categoryNumber}, {d.categoryName || `Category ${d.categoryNumber}`}: excluded
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
                {f.factor_name}: {f.value} {f.unit}, {f.source} ({f.year_effective})
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
                {c.category}:{" "}
                {c.basis === "spend_based"
                  ? "calculated from financial spend using USEEIO sector averages. This is a recognized estimation method for first-time reporters."
                  : "estimated; flagged low-confidence. Replacing with measured data is recommended next cycle."}
              </Text>
            ))
          )}
        </View>

        {/* Repeating page footer */}
        <Text style={s.footer} fixed>
          {company.name}  ·  GHG Inventory  ·  {period}  ·  Powered by Sendrow  ·  Emission factors are representative published values; verify against cited sources before external submission.
        </Text>
      </Page>
    </Document>
  );
}
