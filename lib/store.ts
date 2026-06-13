import fs from "fs";
import path from "path";
import { AuditRow, Company, User } from "./types";
import { SEED_FACTORS } from "./factors";

/**
 * Data access layer with two backends:
 *  - Postgres (when DATABASE_URL is set) — production / Vercel + Neon
 *  - JSON file (otherwise) — zero-config local development
 *
 * All accessors are scoped by id. Production hardening step: move row-level
 * security into Postgres policies keyed to company_id.
 */

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Emission factors are a versioned in-code table (see lib/factors.ts). */
export function getFactor(factorId: string) {
  const f = SEED_FACTORS.find((f) => f.factor_id === factorId);
  if (!f) throw new Error(`Unknown emission factor: ${factorId}`);
  return f;
}

const usePg = !!process.env.DATABASE_URL;

// ───────────────────────── Postgres backend ─────────────────────────

type PgPool = import("pg").Pool;

const g = globalThis as unknown as {
  __gtPool?: PgPool;
  __gtSchemaReady?: Promise<void>;
  __gtJson?: { users: User[]; companies: Company[]; auditLog: AuditRow[] };
};

function getPool(): PgPool {
  if (!g.__gtPool) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Pool } = require("pg") as typeof import("pg");
    const connectionString = process.env.DATABASE_URL!;
    const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
    g.__gtPool = new Pool({
      connectionString,
      max: 3,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });
  }
  return g.__gtPool;
}

function ensureSchema(): Promise<void> {
  if (!g.__gtSchemaReady) {
    g.__gtSchemaReady = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS gt_users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          data JSONB NOT NULL
        );
        CREATE TABLE IF NOT EXISTS gt_companies (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL
        );
        CREATE TABLE IF NOT EXISTS gt_audit_log (
          id TEXT PRIMARY KEY,
          company_id TEXT NOT NULL,
          ts TIMESTAMPTZ NOT NULL,
          data JSONB NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_gt_audit_company ON gt_audit_log (company_id, ts DESC);
      `);
    })();
  }
  return g.__gtSchemaReady;
}

async function pg() {
  await ensureSchema();
  return getPool();
}

// ───────────────────────── JSON file backend ─────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function jsonDB() {
  if (!g.__gtJson) {
    try {
      g.__gtJson = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    } catch {
      g.__gtJson = { users: [], companies: [], auditLog: [] };
    }
  }
  return g.__gtJson!;
}

function jsonSave() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(jsonDB(), null, 2));
}

// ───────────────────────── Public async API ─────────────────────────

export async function getUserById(id: string): Promise<User | null> {
  if (usePg) {
    const db = await pg();
    const r = await db.query("SELECT data FROM gt_users WHERE id = $1", [id]);
    return r.rows[0]?.data ?? null;
  }
  return jsonDB().users.find((u) => u.id === id) ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (usePg) {
    const db = await pg();
    const r = await db.query("SELECT data FROM gt_users WHERE email = $1", [email]);
    return r.rows[0]?.data ?? null;
  }
  return jsonDB().users.find((u) => u.email === email) ?? null;
}

export async function createUser(user: User): Promise<void> {
  if (usePg) {
    const db = await pg();
    await db.query("INSERT INTO gt_users (id, email, data) VALUES ($1, $2, $3)", [
      user.id,
      user.email,
      JSON.stringify(user),
    ]);
    return;
  }
  jsonDB().users.push(user);
  jsonSave();
}

export async function updateUser(user: User): Promise<void> {
  if (usePg) {
    const db = await pg();
    await db.query("UPDATE gt_users SET email = $2, data = $3 WHERE id = $1", [
      user.id,
      user.email,
      JSON.stringify(user),
    ]);
    return;
  }
  const all = jsonDB().users;
  const i = all.findIndex((u) => u.id === user.id);
  if (i >= 0) all[i] = user;
  jsonSave();
}

export async function getCompany(companyId: string): Promise<Company> {
  if (usePg) {
    const db = await pg();
    const r = await db.query("SELECT data FROM gt_companies WHERE id = $1", [companyId]);
    if (!r.rows[0]) throw new Error("Company not found");
    return r.rows[0].data;
  }
  const c = jsonDB().companies.find((c) => c.id === companyId);
  if (!c) throw new Error("Company not found");
  return c;
}

export async function saveCompany(company: Company): Promise<void> {
  if (usePg) {
    const db = await pg();
    await db.query(
      "INSERT INTO gt_companies (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2",
      [company.id, JSON.stringify(company)]
    );
    return;
  }
  const all = jsonDB().companies;
  const i = all.findIndex((c) => c.id === company.id);
  if (i >= 0) all[i] = company;
  else all.push(company);
  jsonSave();
}

export async function appendAudit(row: AuditRow): Promise<void> {
  if (usePg) {
    const db = await pg();
    await db.query("INSERT INTO gt_audit_log (id, company_id, ts, data) VALUES ($1, $2, $3, $4)", [
      row.id,
      row.companyId,
      row.ts,
      JSON.stringify(row),
    ]);
    return;
  }
  jsonDB().auditLog.push(row);
  jsonSave();
}

export async function auditForCompany(companyId: string): Promise<AuditRow[]> {
  if (usePg) {
    const db = await pg();
    const r = await db.query(
      "SELECT data FROM gt_audit_log WHERE company_id = $1 ORDER BY ts DESC LIMIT 1000",
      [companyId]
    );
    return r.rows.map((row: { data: AuditRow }) => row.data);
  }
  return jsonDB()
    .auditLog.filter((r) => r.companyId === companyId)
    .sort((a, b) => b.ts.localeCompare(a.ts));
}
