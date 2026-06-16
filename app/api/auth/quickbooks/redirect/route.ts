import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { currentUser } from "@/lib/auth";
import { buildAuthUrl, generateState } from "@/lib/quickbooks";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/login", process.env.QUICKBOOKS_REDIRECT_URI!).origin);

  const user = await currentUser();
  if (!user?.companyId) return NextResponse.redirect(new URL("/login", process.env.QUICKBOOKS_REDIRECT_URI!).origin);

  const state = generateState();
  const cookieStore = await cookies();
  cookieStore.set("qb_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600 });
  cookieStore.set("qb_company_id", user.companyId, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600 });

  return NextResponse.redirect(buildAuthUrl(state));
}
