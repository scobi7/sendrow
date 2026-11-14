/** Starts the app for end-to-end tests: `next dev` on port 3200, pointed at the test database,
 *  with email, file storage and Stripe switched off. Playwright runs this (see playwright.config.ts);
 *  run it by hand with `npx tsx e2e/serve.ts` to click around the test data yourself. */
import { spawn } from "node:child_process";
import path from "node:path";
import { assertSafeDatabase, clerkKeys, CRON_SECRET, E2E_PORT, BASE_URL, USERS } from "./env";
import { ensureUser } from "./clerk";

async function portAnswers(port: number): Promise<boolean> {
  try {
    await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const databaseUrl = assertSafeDatabase();
  // A second `next dev` in this folder would share .next with this one and corrupt both.
  for (const port of [3000, 3100]) {
    if (await portAnswers(port)) throw new Error(`A dev server is running on port ${port}. Stop it first; it shares .next with the test server.`);
  }
  const { secretKey, publishableKey } = clerkKeys();
  const adminId = await ensureUser(USERS.a.email, USERS.a.first, USERS.a.last);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    CLERK_SECRET_KEY: secretKey,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishableKey,
    ADMIN_CLERK_ID: adminId,
    NEXT_PUBLIC_APP_URL: BASE_URL,
    CRON_SECRET,
    RESEND_API_KEY: "",
    STRIPE_SECRET_KEY: "",
    NEXT_PUBLIC_CALENDLY_URL: "",
    E2E: "1",
  };
  delete env.BLOB_READ_WRITE_TOKEN;

  const child = spawn("npx", ["next", "dev", "-p", String(E2E_PORT)], {
    cwd: path.resolve(__dirname, ".."),
    env,
    stdio: "inherit",
  });
  const stop = () => child.kill("SIGTERM");
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
