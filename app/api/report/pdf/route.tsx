import { NextRequest } from "next/server";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";
import { currentUser } from "@/lib/auth";
import { loadCompany, loadFactors } from "@/lib/store";
import { recContextFor } from "@/lib/calc";
import { GHGReportPDF } from "@/components/pdf/GHGReportPDF";
import { getLineItemTotals, getScreeningDecisions } from "@/lib/report-totals";
import React from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const [company, overrides] = await Promise.all([loadCompany(companyId), loadFactors()]);
  // recContextFor needs company.inputs, so this pair can't join the batch above.
  const [lineItemTotals, screeningDecisions] = await Promise.all([
    getLineItemTotals(companyId, recContextFor(company), company.inputs?.scope2_market_override_tons),
    getScreeningDecisions(companyId),
  ]);

  const element = React.createElement(GHGReportPDF, {
    company,
    factorOverrides: overrides,
    lineItemTotals,
    screeningDecisions,
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
