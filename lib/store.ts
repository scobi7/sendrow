import fs from "fs";
import path from "path";
import { DB } from "./types";
import { SEED_FACTORS } from "./factors";

const g = globalThis as unknown as { __gtdb?: DB };

function emptyDB(): DB {
  return { users: [], companies: [], auditLog: [], factors: SEED_FACTORS, consultantClients: [], inviteTokens: [] };
}

// ─── Storage backend ───────────────────────────────────────────────────────
// Production: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Vercel.
// Dev: falls back to data/db.json.

const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const DB_KEY = "gt:db";
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

async function readStorage(): Promise<DB | null> {
  if (KV_URL && KV_TOKEN) {
    const res = await fetch(`${KV_URL}/get/${DB_KEY}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      cache: "no-store",
    });
    const json = (await res.json()) as { result: string | null };
    return json.result ? (JSON.parse(json.result) as DB) : null;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as DB;
  } catch {
    return null;
  }
}

async function writeStorage(db: DB): Promise<void> {
  if (KV_URL && KV_TOKEN) {
    await fetch(`${KV_URL}/set/${DB_KEY}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "text/plain" },
      body: JSON.stringify(db),
    });
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No KV store configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to Vercel environment variables."
    );
  }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Populate the in-memory cache from storage. Call once at the top of every
 * async Server Component, layout, server action, and route handler before
 * using any sync accessor (loadDB, getCompany, etc.).
 */
export async function ensureDB(): Promise<void> {
  if (g.__gtdb) return;
  const raw = await readStorage();
  const db = raw ?? emptyDB();
  if (!db.factors || db.factors.length === 0) db.factors = SEED_FACTORS;
  if (!db.consultantClients) db.consultantClients = [];
  if (!db.inviteTokens) db.inviteTokens = [];
  g.__gtdb = db;
}

/** Sync accessor — safe to call after ensureDB() has resolved. */
export function loadDB(): DB {
  return g.__gtdb ?? emptyDB();
}

/** Flush the in-memory DB back to storage. */
export async function saveDB(): Promise<void> {
  if (g.__gtdb) await writeStorage(g.__gtdb);
}

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function getFactor(factorId: string) {
  const f = loadDB().factors.find((f) => f.factor_id === factorId);
  if (!f) throw new Error(`Unknown emission factor: ${factorId}`);
  return f;
}

export function getCompany(companyId: string) {
  const c = loadDB().companies.find((c) => c.id === companyId);
  if (!c) throw new Error("Company not found");
  return c;
}
