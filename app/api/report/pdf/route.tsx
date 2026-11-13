import { NextRequest } from "next/server";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultantClients, emissionLineItems } from "@/lib/db/schema";
import { currentUser } from "@/lib/auth";
import { loadCompany, loadFactors } from "@/lib/store";
import { combinedTotals } from "@/lib/calc";
import { GHGReportPDF } from "@/components/pdf/GHGReportPDF";
import { getScreeningDecisions } from "@/lib/report-totals";
import { getBrandForCompany } from "@/lib/branding";
import React from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_ACCENT = "#1D5A36";
const LOGO_TIMEOUT_MS = 3000;

/** Fetches the brand logo for react-pdf. react-pdf cannot draw SVG and a failed
 *  remote image can crash rendering, so anything other than a PNG or JPEG that
 *  loads within the timeout is dropped (null). Never throws. */
async function fetchLogo(logoUrl: string | null): Promise<{ data: Buffer; format: "png" | "jpg" } | null> {
  if (!logoUrl || logoUrl.toLowerCase().endsWith(".svg")) return null;
  // Logos only ever come from our own Blob uploads; never fetch anything else server-side.
  try {
    const u = new URL(logoUrl);
    if (u.protocol !== "https:" || !u.hostname.endsWith(".blob.vercel-storage.com")) return null;
  } catch {
    return null;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOGO_TIMEOUT_MS);
  try {
    const res = await fetch(logoUrl, { signal: controller.signal });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (type !== "image/png" && type !== "image/jpeg") return null;
    const data = Buffer.from(await res.arrayBuffer());
    return { data, format: type === "image/png" ? "png" : "jpg" };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Consultant-only GHG report PDF for one client. The consultant page sends
 *  `?companyId=` (the client's id); the consultant must hold an active
 *  consultantClients link to that company, same guard as the client export. */
export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user || user.role !== "consultant") {
    return new Response("Unauthorized", { status: 401 });
  }

  const companyId = request.nextUrl.searchParams.get("companyId") ?? "";
  if (!companyId) return new Response("Not found", { status: 404 });

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user.id),
      eq(consultantClients.companyId, companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) return new Response("Not found", { status: 404 });

  const [company, overrides, brand, mappedItems] = await Promise.all([
    loadCompany(companyId),
    loadFactors(),
    getBrandForCompany(companyId),
    db
      .select()
      .from(emissionLineItems)
      .where(and(eq(emissionLineItems.companyId, companyId), eq(emissionLineItems.status, "mapped"))),
  ]);
  // Same totals createSnapshot freezes (lib/consultant-actions.ts), so the PDF
  // matches a snapshot taken at the same moment.
  const totals = combinedTotals(
    company,
    mappedItems.map((i) => ({ scope: i.scope, category: i.category, co2eKg: i.co2eKg, rawValue: i.rawValue, rawUnit: i.rawUnit, status: i.status }))
  );
  const lineItemFactorIds = [...new Set(mappedItems.map((i) => i.factorId).filter((f): f is string => Boolean(f)))];

  const [screeningDecisions, logo] = await Promise.all([
    getScreeningDecisions(companyId),
    fetchLogo(brand?.logoUrl ?? null),
  ]);

  const accent = brand?.accentColor && /^#[0-9a-fA-F]{6}$/.test(brand.accentColor) ? brand.accentColor : DEFAULT_ACCENT;

  const element = React.createElement(GHGReportPDF, {
    company,
    factorOverrides: overrides,
    totals,
    lineItemCount: mappedItems.length,
    lineItemFactorIds,
    screeningDecisions,
    brand: brand ? { name: brand.brandName, accent, logo } : null,
  }) as unknown as React.ReactElement<React.ComponentProps<typeof Document>>;

  const buffer = await renderToBuffer(element);
  const slug = company.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ghg-report-${slug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
