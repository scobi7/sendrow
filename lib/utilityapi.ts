const BASE = "https://utilityapi.com/api/v2";

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.UTILITYAPI_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function findAuthorizationByEmail(email: string): Promise<string | null> {
  const res = await fetch(`${BASE}/authorizations`, { headers: authHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  const match = (data.authorizations ?? []).find(
    (a: { email?: string; uid?: string | number }) => a.email?.toLowerCase() === email.toLowerCase()
  );
  return match?.uid != null ? String(match.uid) : null;
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
