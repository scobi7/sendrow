const BASE = "https://utilityapi.com/api/v2";

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.UTILITYAPI_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function createAuthorization(
  email: string,
  utility: string,
  redirectUri?: string
): Promise<{ uid: string; authUrl: string }> {
  const body: Record<string, unknown> = {
    utility,
    email,
    scope: ["bills"],
    real_name: "GreenTrack",
  };
  if (redirectUri) body.redirect_uri = redirectUri;

  const res = await fetch(`${BASE}/authorizations`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UtilityAPI ${res.status}: ${text}`);
  }
  const data = await res.json();
  return { uid: data.uid as string, authUrl: data.auth_url as string };
}

export interface UtilityMeter {
  uid: string;
  base_type: "ELECTRIC" | "GAS" | string;
  service_address: string;
}

export async function getMeters(authUid: string): Promise<UtilityMeter[]> {
  const res = await fetch(`${BASE}/meters?authorizations=${authUid}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`UtilityAPI ${res.status}`);
  const data = await res.json();
  return (data.meters ?? []) as UtilityMeter[];
}

export interface UtilityBill {
  meter_uid: string;
  base: {
    bill_start_date: string;
    kwh?: number;
    therms?: number;
  };
}

export async function getBills(meterUids: string[]): Promise<UtilityBill[]> {
  if (meterUids.length === 0) return [];
  const res = await fetch(`${BASE}/bills?meters=${meterUids.join(",")}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`UtilityAPI ${res.status}`);
  const data = await res.json();
  return (data.bills ?? []) as UtilityBill[];
}
