import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { evidence, consultantClients } from "@/lib/db/schema";
import { currentUser } from "@/lib/auth";

/** Source-document download (evidence locker). Only the consultant managing
 *  the client may fetch it - blob URLs never appear in any UI directly. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || user.role !== "consultant") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await db.query.evidence.findFirst({ where: eq(evidence.id, id) });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user.id),
      eq(consultantClients.companyId, row.companyId),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!row.blobUrl) {
    // Provenance exists (hash + metadata) but the bytes were never stored -     // render that honestly instead of a raw 404 the consultant can't act on.
    const html = `<!doctype html><meta charset="utf-8"><title>File not stored - Sendrow</title>
<body style="font-family:system-ui,sans-serif;max-width:34rem;margin:15vh auto;padding:0 1.5rem;color:#1a2e24">
<h1 style="font-size:1.2rem">This file's proof is on record - the file itself wasn't stored</h1>
<p style="color:#5c7268;line-height:1.6">When <strong>${row.filename}</strong> was uploaded, file storage wasn't configured,
so Sendrow kept its fingerprint but not its bytes. The original can be re-uploaded any time and will match this fingerprint.</p>
<p style="font-family:ui-monospace,monospace;font-size:0.8rem;background:#f2faf6;padding:0.75rem;border-radius:8px;word-break:break-all">
SHA-256&nbsp;·&nbsp;${row.sha256}</p>
<p style="color:#5c7268;font-size:0.85rem">To store files going forward: Vercel → Storage → Blob → set <code>BLOB_READ_WRITE_TOKEN</code>.</p>
</body>`;
    return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  return NextResponse.redirect(row.blobUrl);
}
