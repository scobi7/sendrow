import { createHash } from "crypto";

/** Fingerprint of a file's shape (Plan T2 format memory): normalized, sorted
 *  headers hashed — order and casing don't matter, the column set does. */
export function headerFingerprint(headers: string[]): string {
  const normalized = headers
    .map((h) => h.toLowerCase().replace(/[_\-\/]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .sort();
  return createHash("sha256").update(normalized.join("|")).digest("hex");
}
