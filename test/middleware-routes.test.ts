/** middleware.ts requires sign-in only on the app's own sections, so every other path is public.
 *  This test keeps that safe: each top-level folder in app/ must be listed below as protected or
 *  public, so a new section can't become public by accident. Classify a new folder here (and add
 *  protected ones to isProtectedRoute in middleware.ts). */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const middleware = readFileSync(path.join(root, "middleware.ts"), "utf8");

/** Behind sign-in in middleware.ts. */
const PROTECTED = ["consultant", "admin", "checkout", "api"];

/** Open to signed-out visitors (marketing, legal, auth screens, token-auth pages). */
const PUBLIC = [
  "demo", "dpa", "for-consultants", "get-matched", "how-it-works", "login", "onboarding",
  "portal", "pricing", "privacy", "security", "shared", "signup", "sso-callback", "terms",
];

/** API routes that skip sign-in because they check a token, secret or signature themselves. */
const PUBLIC_API = ["webhooks/stripe", "portal", "track", "cron"];

function folders(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
}

describe("middleware route classification", () => {
  it("every top-level app folder is classified as protected or public", () => {
    const unclassified = folders(path.join(root, "app")).filter((f) => !PROTECTED.includes(f) && !PUBLIC.includes(f));
    expect(unclassified, "classify these in test/middleware-routes.test.ts and middleware.ts").toEqual([]);
  });

  it("every protected section is in middleware.ts isProtectedRoute", () => {
    for (const p of PROTECTED) expect(middleware, `/${p}(.*) missing from middleware.ts`).toContain(`"/${p}(.*)"`);
  });

  it("no public page is protected by mistake", () => {
    for (const p of PUBLIC) expect(middleware).not.toContain(`"/${p}(.*)"`);
  });

  it("the public API exceptions exist and are the only ones", () => {
    for (const p of PUBLIC_API) {
      expect(existsSync(path.join(root, "app/api", p)), `app/api/${p} exists`).toBe(true);
      expect(middleware, `/api/${p}(.*) in isPublicApi`).toContain(`"/api/${p}(.*)"`);
    }
    const listed = [...middleware.matchAll(/"\/api\/([^"(]+)\(\.\*\)"/g)].map((m) => m[1]);
    expect(listed.sort()).toEqual([...PUBLIC_API].sort());
  });
});
