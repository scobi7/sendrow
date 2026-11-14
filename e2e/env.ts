/** End-to-end test settings. Tests never touch the production database: they run against a
 *  Neon branch whose URL lives in `.env.e2e.local` (gitignored) as E2E_DATABASE_URL, and every
 *  entry point calls `assertSafeDatabase()` first. */
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

function readEnvFile(file: string): Record<string, string> {
  try {
    const out: Record<string, string> = {};
    for (const line of readFileSync(path.join(root, file), "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) out[m[1]] = m[2].replace(/^"|"$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}

const e2eFile = readEnvFile(".env.e2e.local");
const localFile = readEnvFile(".env.local");

export const E2E_PORT = 3200;
export const BASE_URL = `http://localhost:${E2E_PORT}`;
export const CRON_SECRET = "e2e-cron-secret";
export const AUTH_DIR = path.join(root, "e2e", ".auth");
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL || e2eFile.E2E_DATABASE_URL || "";

function host(url: string): string {
  const m = url.match(/@([^/?]+)/);
  return m ? m[1] : "";
}

/** Throws unless E2E_DATABASE_URL is set and points somewhere other than `.env.local`'s database. */
export function assertSafeDatabase(): string {
  if (!E2E_DATABASE_URL) {
    throw new Error("E2E_DATABASE_URL is not set. Put a Neon branch URL in .env.e2e.local; tests never run on the main database.");
  }
  const prodHost = host(localFile.DATABASE_URL || "");
  if (prodHost && host(E2E_DATABASE_URL) === prodHost) {
    throw new Error(`E2E_DATABASE_URL points at the same host as .env.local (${prodHost}). Use a Neon branch.`);
  }
  return E2E_DATABASE_URL;
}

/** Clerk development keys: E2E_CLERK_SECRET_KEY / E2E_CLERK_PUBLISHABLE_KEY, else the local keyless instance. */
export function clerkKeys(): { secretKey: string; publishableKey: string } {
  let secretKey = process.env.E2E_CLERK_SECRET_KEY || e2eFile.E2E_CLERK_SECRET_KEY || "";
  let publishableKey = process.env.E2E_CLERK_PUBLISHABLE_KEY || e2eFile.E2E_CLERK_PUBLISHABLE_KEY || "";
  if (!secretKey || !publishableKey) {
    const keyless = JSON.parse(readFileSync(path.join(root, ".clerk", ".tmp", "keyless.json"), "utf8"));
    secretKey = keyless.secretKey;
    publishableKey = keyless.publishableKey;
  }
  if (!secretKey.startsWith("sk_test_")) throw new Error("E2E needs a Clerk development key (sk_test_), never a live one.");
  return { secretKey, publishableKey };
}

/** Test accounts. A is also the admin; B is a second, unrelated consultant for tenant checks. */
export const USERS = {
  a: { email: "qa-a+clerk_test@example.com", first: "QA", last: "Consultant A" },
  b: { email: "qa-b+clerk_test@example.com", first: "QA", last: "Consultant B" },
} as const;
export type UserKey = keyof typeof USERS;
