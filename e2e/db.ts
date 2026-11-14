/** Direct SQL on the test database, for reading what the UI never shows (for example a portal
 *  token that only goes out by email). Never imported by app code. */
import { neon } from "@neondatabase/serverless";
import { assertSafeDatabase } from "./env";

let client: ReturnType<typeof neon> | null = null;

export async function sql<T = Record<string, unknown>>(query: string, params: unknown[] = []): Promise<T[]> {
  client ??= neon(assertSafeDatabase());
  // Driver 0.10: a plain call with a string and params runs a parameterized query.
  return (await client(query, params)) as unknown as T[];
}
