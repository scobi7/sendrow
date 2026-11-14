import { defineConfig } from "@playwright/test";
import { BASE_URL, E2E_PORT } from "./e2e/env";

/** End-to-end tests. Run `npm run e2e`. They start their own dev server on port 3200 against the
 *  Neon test branch in .env.e2e.local (see e2e/serve.ts); stop any other `next dev` first. */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.e2e\.ts$/,
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/report" }]],
  outputDir: "e2e/results",
  use: {
    baseURL: BASE_URL,
    channel: "chrome",
    navigationTimeout: 90_000,
    actionTimeout: 20_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.e2e\.ts$/ },
    { name: "app", dependencies: ["setup"], testIgnore: /auth\.setup\.e2e\.ts$/ },
  ],
  webServer: {
    command: "npx tsx e2e/serve.ts",
    port: E2E_PORT,
    // E2E_REUSE_SERVER=1 reuses a server already started with `npm run e2e:serve` (same test database).
    reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
