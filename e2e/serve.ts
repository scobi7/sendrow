/** Starts the app for end-to-end tests on port 3200 (a production build by default), pointed at the test database,
 *  with email, file storage and Stripe switched off. Playwright runs this (see playwright.config.ts);
 *  run it by hand with `npx tsx e2e/serve.ts` to click around the test data yourself. */
import { spawn, spawnSync } from "node:child_process";
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

  const cwd = path.resolve(__dirname, "..");
  // Default: a production build (fast and stable under a full test run; `next dev` compiles each
  // route on demand and falls over with several browsers). E2E_DEV=1 runs `next dev` instead.
  // `next build` here never touches the database schema; only `npm run build` runs drizzle-kit.
  if (process.env.E2E_DEV !== "1") {
    const build = spawnSync("npx", ["next", "build"], { cwd, env, stdio: "inherit" });
    if (build.status !== 0) process.exit(build.status ?? 1);
  }
  const args = process.env.E2E_DEV === "1" ? ["next", "dev", "-p", String(E2E_PORT)] : ["next", "start", "-p", String(E2E_PORT)];
  const child = spawn("npx", args, { cwd, env, stdio: "inherit" });
  const stop = () => child.kill("SIGTERM");
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
