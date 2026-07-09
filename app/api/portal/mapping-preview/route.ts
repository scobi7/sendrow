import { NextRequest, NextResponse } from "next/server";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { dataRequests, mappingProfiles } from "@/lib/db/schema";
import { portalTokenValid } from "@/lib/portal";
import type { ChecklistItem } from "@/lib/portal";
import { fuzzyMatchHeaders } from "@/lib/ingestion/fuzzy-match";
import { applyTemplate } from "@/lib/ingestion/data-type-templates";
import { headerFingerprint } from "@/lib/ingestion/fingerprint";

/** Mapping suggestions for the portal's confirm screen (Plan T2).
 *  Memory first: if this company has confirmed the same file shape before,
 *  that mapping wins outright. Otherwise template + fuzzy word bank suggests
 *  and the supplier confirms. Token is the auth. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const token: string = body.token ?? "";
  const itemId: string = body.itemId ?? "";
  const headers: string[] = Array.isArray(body.headers) ? body.headers.map(String) : [];

  if (!token) return NextResponse.json({ error: "Missing link token" }, { status: 401 });
  if (!headers.length) return NextResponse.json({ error: "No headers provided" }, { status: 400 });

  const [dataRequest] = await db.select().from(dataRequests).where(eq(dataRequests.token, token));
  if (!dataRequest || !portalTokenValid({ token: dataRequest.token, expiresAt: dataRequest.expiresAt, status: dataRequest.status })) {
    return NextResponse.json({ error: "This link has expired" }, { status: 401 });
  }

  const checklist = (dataRequest.checklist as ChecklistItem[] | null) ?? [];
  const item = checklist.find((i) => i.id === itemId);
  if (!item) return NextResponse.json({ error: "Unknown checklist item" }, { status: 400 });

  const fingerprint = headerFingerprint(headers);

  // Format memory: same company, same file shape → the confirmed map, zero clicks
  const remembered = await db
    .select()
    .from(mappingProfiles)
    .where(and(eq(mappingProfiles.companyId, dataRequest.companyId), eq(mappingProfiles.headerFingerprint, fingerprint)))
    .orderBy(desc(mappingProfiles.createdAt))
    .limit(1);

  if (remembered[0]) {
    const stored = remembered[0].columnMap as Record<string, string | null>;
    const map: Record<string, string | null> = {};
    for (const h of headers) map[h] = stored[h] ?? null;
    return NextResponse.json({ source: "memory", fingerprint, map });
  }

  const fuzzy = fuzzyMatchHeaders(headers);
  const templated = applyTemplate(headers, item.dataType, fuzzy) as Record<string, string | null>;
  const map: Record<string, string | null> = {};
  for (const h of headers) map[h] = templated[h] ?? null;
  return NextResponse.json({ source: "suggested", fingerprint, map });
}
