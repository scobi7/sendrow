/** Shared test fixtures. Every test fails if the page logs a console error, throws, or gets a
 *  5xx response, unless the test allows that message with `allowErrors`. */
import { test as base, expect, type Page, type Browser } from "@playwright/test";
import path from "node:path";
import { AUTH_DIR, type UserKey } from "./env";

type Problems = { list: string[]; allow: RegExp[] };

/** Console noise from the dev toolchain, not from the app. */
const DEV_NOISE = [/Download the React DevTools/, /\[Fast Refresh\]/, /Clerk: Clerk has been loaded with development keys/];

function watch(page: Page, problems: Problems) {
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (DEV_NOISE.some((r) => r.test(text))) return;
    problems.list.push(`console: ${text.slice(0, 400)}`);
  });
  page.on("pageerror", (e) => problems.list.push(`pageerror: ${e.message.slice(0, 400)}`));
  page.on("response", (r) => {
    if (r.status() >= 500) problems.list.push(`HTTP ${r.status()} ${r.request().method()} ${r.url()}`);
  });
  // Never send analytics from tests.
  void page.route("**/api/track", (r) => r.fulfill({ status: 204, body: "" }));
}

export function statePath(user: UserKey): string {
  return path.join(AUTH_DIR, `${user}.json`);
}

/** A fresh page signed in as `user`, with the same error checks. Close it when done. */
export async function pageAs(browser: Browser, user: UserKey, problems: Problems): Promise<Page> {
  const context = await browser.newContext({ storageState: statePath(user) });
  const page = await context.newPage();
  watch(page, problems);
  return page;
}

export const test = base.extend<{ problems: Problems; allowErrors: (...patterns: RegExp[]) => void }>({
  problems: async ({}, use) => {
    await use({ list: [], allow: [] });
  },
  page: async ({ page, problems }, use) => {
    watch(page, problems);
    await use(page);
    const real = problems.list.filter((p) => !problems.allow.some((r) => r.test(p)));
    expect(real, "console errors, page errors or 5xx responses").toEqual([]);
  },
  allowErrors: async ({ problems }, use) => {
    await use((...patterns) => problems.allow.push(...patterns));
  },
});

export { expect };
