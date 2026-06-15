import { renderToBuffer, Document } from "@react-pdf/renderer";
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@/lib/auth";
import { loadCompany, loadFactors } from "@/lib/store";
import { GHGReportPDF } from "@/components/pdf/GHGReportPDF";
import React from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user?.companyId) return new Response("Unauthorized", { status: 401 });

  const [company, overrides] = await Promise.all([
    loadCompany(user.companyId),
    loadFactors(),
  ]);

  // Cast: GHGReportPDF renders a <Document>, which is what renderToBuffer expects
  const element = React.createElement(GHGReportPDF, {
    company,
    factorOverrides: overrides,
  }) as unknown as React.ReactElement<React.ComponentProps<typeof Document>>;

  const buffer = await renderToBuffer(element);

  const slug = company.name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const filename = `ghg-report-${slug}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
