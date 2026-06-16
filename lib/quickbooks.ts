import crypto from "crypto";

const IS_SANDBOX = (process.env.QUICKBOOKS_ENV ?? "sandbox") !== "production";
const CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID!;
const CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET!;
const REDIRECT_URI = process.env.QUICKBOOKS_REDIRECT_URI!;
const SCOPE = "com.intuit.quickbooks.accounting";
const AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const API_BASE = IS_SANDBOX
  ? "https://sandbox-quickbooks.api.intuit.com/v3/company"
  : "https://quickbooks.api.intuit.com/v3/company";

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
    state,
  });
  return `${AUTH_URL}?${params}`;
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export interface QBTokens {
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  realmId: string;
}

function basicAuth() {
  return Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
}

export async function exchangeCode(code: string, realmId: string): Promise<QBTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }),
  });
  if (!res.ok) throw new Error(`QB token exchange ${res.status}: ${await res.text()}`);
  const d = await res.json();
  return {
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    tokenExpiresAt: new Date(Date.now() + d.expires_in * 1000).toISOString(),
    realmId,
  };
}

export async function refreshTokens(refreshToken: string, realmId: string): Promise<QBTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`QB token refresh ${res.status}: ${await res.text()}`);
  const d = await res.json();
  return {
    accessToken: d.access_token,
    refreshToken: d.refresh_token ?? refreshToken,
    tokenExpiresAt: new Date(Date.now() + d.expires_in * 1000).toISOString(),
    realmId,
  };
}

export interface QBPurchase {
  vendor: string;
  category: string;
  amount: number;
  date: string;
}

export async function fetchPurchases(accessToken: string, realmId: string): Promise<QBPurchase[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - 18);
  const sinceStr = since.toISOString().substring(0, 10);
  const query = `SELECT * FROM Purchase WHERE TxnDate >= '${sinceStr}' MAXRESULTS 1000`;

  const res = await fetch(
    `${API_BASE}/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=65`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`QB API ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const purchases: QBPurchase[] = [];
  for (const p of data.QueryResponse?.Purchase ?? []) {
    const vendor = (p.EntityRef?.name as string) ?? "Unknown Vendor";
    const date = p.TxnDate as string;
    for (const line of p.Line ?? []) {
      if (line.DetailType === "AccountBasedExpenseLineDetail") {
        const category = (line.AccountBasedExpenseLineDetail?.AccountRef?.name as string) ?? "Other";
        const amount = Number(line.Amount ?? 0);
        if (amount > 0) purchases.push({ vendor, category, amount, date });
      }
    }
  }
  return purchases;
}

export async function getValidTokens(
  accessToken: string,
  refreshToken: string,
  tokenExpiresAt: string,
  realmId: string
): Promise<QBTokens> {
  // Refresh if within 5 minutes of expiry
  if (new Date(tokenExpiresAt).getTime() - Date.now() < 5 * 60 * 1000) {
    return refreshTokens(refreshToken, realmId);
  }
  return { accessToken, refreshToken, tokenExpiresAt, realmId };
}
