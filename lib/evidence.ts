import { createHash } from "crypto";
import { put } from "@vercel/blob";
import { db } from "./db";
import { evidence } from "./db/schema";

export function sha256Hex(bytes: Buffer | Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function newId() {
  return "ev_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Stores an original source document (Plan N3). The hash and metadata are
 *  always recorded; the bytes only persist when blob storage is configured,
 *  so imports never fail because storage isn't set up. */
export async function storeEvidence(params: {
  bytes: Buffer;
  filename: string;
  companyId: string;
  dataRequestId?: string | null;
  checklistItemId?: string | null;
  uploadedVia: "portal_upload" | "consultant_upload";
}): Promise<string> {
  const id = newId();

  let blobUrl: string | null = null;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`evidence/${params.companyId}/${id}/${params.filename}`, params.bytes, {
        access: "public", // unguessable URL; served to consultants via the authed /api/evidence route
        addRandomSuffix: true,
      });
      blobUrl = blob.url;
    } catch {
      // storage failure degrades to hash-only provenance, never blocks the import
    }
  }

  await db.insert(evidence).values({
    id,
    companyId: params.companyId,
    dataRequestId: params.dataRequestId ?? null,
    checklistItemId: params.checklistItemId ?? null,
    filename: params.filename,
    sha256: sha256Hex(params.bytes),
    sizeBytes: params.bytes.length,
    blobUrl,
    uploadedVia: params.uploadedVia,
    createdAt: new Date().toISOString(),
  });

  return id;
}
