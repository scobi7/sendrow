import fs from "fs";
import path from "path";
import { DB } from "./types";
import { SEED_FACTORS } from "./factors";

/**
 * Demo persistence layer: a single JSON file with an in-memory cache.
 * Production: swap for Postgres with row-level security keyed to company_id
 * (see README — every accessor here already takes a companyId).
 */
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const g = globalThis as unknown as { __gtdb?: DB };

function emptyDB(): DB {
  return { users: [], companies: [], auditLog: [], factors: SEED_FACTORS };
}

export function loadDB(): DB {
  if (g.__gtdb) return g.__gtdb;
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(raw) as DB;
    if (!db.factors || db.factors.length === 0) db.factors = SEED_FACTORS;
    g.__gtdb = db;
  } catch {
    g.__gtdb = emptyDB();
  }
  return g.__gtdb!;
}

export function saveDB(): void {
  const db = loadDB();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
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
