import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;
const g = globalThis as unknown as { __gtPool?: Pool; __gtDb?: DB };

export function getDb(): DB {
  if (!g.__gtDb) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set. See .env.example for setup instructions.");
    }
    if (!g.__gtPool) {
      g.__gtPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 3,
        ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? undefined : { rejectUnauthorized: false },
      });
    }
    g.__gtDb = drizzle(g.__gtPool, { schema });
  }
  return g.__gtDb;
}

export const db = new Proxy({} as DB, {
  get: (_, prop) => (getDb() as any)[prop],
});
