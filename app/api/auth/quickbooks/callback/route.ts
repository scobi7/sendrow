import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, fetchPurchases } from "@/lib/quickbooks";
import { loadCompany, loadFactors, persistCompany, saveQBTransactions } from "@/lib/store";
import { recalcCompany } from "@/lib/calc";
import { refreshSectionStatus } from "@/lib/progress";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const realmId = searchParams.get("realmId");
  const error = searchParams.get("error");

  if (error) return NextResponse.redirect(`${BASE_URL}/connections?error=qb_denied`);
  if (!code || !state || !realmId) return NextResponse.redirect(`${BASE_URL}/connections?error=qb_missing_params`);

  const cookieStore = await cookies();
  const savedState = cookieStore.get("qb_oauth_state")?.value;
  const companyId = cookieStore.get("qb_company_id")?.value;

  cookieStore.delete("qb_oauth_state");
  cookieStore.delete("qb_company_id");

  if (!savedState || savedState !== state || !companyId) {
    return NextResponse.redirect(`${BASE_URL}/connections?error=qb_invalid_state`);
  }

  try {
    const tokens = await exchangeCode(code, realmId);
    const purchases = await fetchPurchases(tokens.accessToken, realmId);

    const [company, overrides] = await Promise.all([loadCompany(companyId), loadFactors()]);

    company.connections.quickbooks = {
      connected: true,
      lastSynced: new Date().toISOString(),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.tokenExpiresAt,
      realmId,
    };

    company.qbTransactions = purchases.map((p, i) => ({
      id: `qb-${Date.now()}-${i}`,
      vendor: p.vendor,
      category: p.category,
      amount: p.amount,
      date: p.date,
    }));

    recalcCompany(company, overrides);
    refreshSectionStatus(company);

    await saveQBTransactions(companyId, company.qbTransactions);
    await persistCompany(company);

    return NextResponse.redirect(`${BASE_URL}/connections`);
  } catch (e) {
    console.error("QB OAuth callback error:", e);
    return NextResponse.redirect(`${BASE_URL}/connections?error=qb_oauth_failed`);
  }
}
