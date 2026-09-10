import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingEvents } from "@/lib/db/schema";
import { uid } from "@/lib/store";
import { clientIp, checkRateLimit } from "@/lib/ratelimit";

/** Homepage engagement capture (Plan L). Public, unauthenticated, and
 *  deliberately narrow: only these three signals are ever recorded, so a
 *  malformed or malicious payload can't write arbitrary event names. */
const ALLOWED_EVENTS = new Set(["page_view", "nav_how_it_works_click", "nav_signin_click"]);

export async function POST(request: NextRequest) {
  const ip = await clientIp();
  if (!checkRateLimit(`track:${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { eventName, path, sessionId } = (body ?? {}) as Record<string, unknown>;
  if (typeof eventName !== "string" || !ALLOWED_EVENTS.has(eventName)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (typeof path !== "string" || path.length > 200) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await db.insert(marketingEvents).values({
    id: uid("mev_"),
    eventName,
    path,
    sessionId: typeof sessionId === "string" ? sessionId.slice(0, 64) : null,
    meta: null,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
