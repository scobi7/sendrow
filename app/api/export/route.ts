import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/store";
import { auditForCompany } from "@/lib/audit";

export async function GET() {
  const user = currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const company = getCompany(user.companyId);
  const payload = {
    exportedAt: new Date().toISOString(),
    company,
    auditLog: auditForCompany(company.id),
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="greentrack-export-${company.id}.json"`,
    },
  });
}
