/** Signs in the two test consultants with Clerk sign-in tickets, finishes onboarding for each,
 *  and saves their sessions for the other tests (e2e/.auth/a.json and b.json). */
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { AUTH_DIR, USERS, assertSafeDatabase, type UserKey } from "./env";
import { ensureUser, signInToken } from "./clerk";
import { statePath } from "./fixtures";

declare global {
  interface Window {
    Clerk?: {
      loaded: boolean;
      client: { signIn: { create(p: { strategy: "ticket"; ticket: string }): Promise<{ status: string; createdSessionId: string }> } };
      setActive(p: { session: string }): Promise<void>;
    };
  }
}

for (const key of Object.keys(USERS) as UserKey[]) {
  test(`sign in consultant ${key}`, async ({ page }) => {
    mkdirSync(AUTH_DIR, { recursive: true });
    const u = USERS[key];
    const userId = await ensureUser(u.email, u.first, u.last);
    const ticket = await signInToken(userId);

    await page.goto("/login", { waitUntil: "load" });
    await page.waitForFunction(() => window.Clerk?.loaded === true);
    const status = await page.evaluate(async (t) => {
      const si = await window.Clerk!.client.signIn.create({ strategy: "ticket", ticket: t });
      await window.Clerk!.setActive({ session: si.createdSessionId });
      return si.status;
    }, ticket);
    expect(status).toBe("complete");

    // First visit: onboarding offers the consultant account; later runs redirect straight on.
    await page.goto("/onboarding");
    if (page.url().includes("/onboarding")) {
      await page.getByRole("button", { name: /set up consultant account/i }).click();
    }
    await page.waitForURL(/\/consultant/);
    await page.context().storageState({ path: statePath(key) });

    // Consultant A gets the demo workspace (three clients at three stages plus a multi-site one):
    // a fixed starting point for the review, snapshot and tenancy tests. B stays empty.
    if (key === "a") {
      execFileSync("npx", ["tsx", "scripts/reset-demo.ts", userId], {
        cwd: path.resolve(__dirname, ".."),
        env: { ...process.env, DATABASE_URL: assertSafeDatabase() },
        stdio: "pipe",
      });
    }
  });
}
