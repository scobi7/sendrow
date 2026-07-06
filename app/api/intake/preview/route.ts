import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fuzzyMatchHeaders } from "@/lib/ingestion/fuzzy-match";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const headers: string[] = body.headers ?? [];

  if (!Array.isArray(headers) || headers.length === 0) {
    return NextResponse.json({ error: "headers array required" }, { status: 400 });
  }

  const suggestions = fuzzyMatchHeaders(headers);
  return NextResponse.json({ suggestions });
}
