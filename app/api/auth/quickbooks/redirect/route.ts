import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { buildAuthUrl, generateState } from "@/lib/quickbooks";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  const origin = new URL(req.url).origin;
  if (!userId) return NextResponse.redirect(`${origin}/login`);

  const forCompanyId = new URL(req.url).searchParams.get("for");
  const user = await currentUser();

  let companyId: string;

  if (forCompanyId && user?.role === "consultant") {
    // Consultant initiating QB connect on behalf of a client — verify access
    const link = await db.query.consultantClients.findFirst({
      where: and(
        eq(consultantClients.consultantId, userId),
        eq(consultantClients.companyId, forCompanyId),
        isNull(consultantClients.archivedAt)
      ),
    });
    if (!link) return NextResponse.redirect(`${origin}/consultant`);
    companyId = forCompanyId;
  } else {
    if (!user?.companyId) return NextResponse.redirect(`${origin}/onboarding`);
    companyId = user.companyId;
  }

  const state = generateState();
  const cookieStore = await cookies();
  cookieStore.set("qb_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600 });
  cookieStore.set("qb_company_id", companyId, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600 });

  return NextResponse.redirect(buildAuthUrl(state));
}
