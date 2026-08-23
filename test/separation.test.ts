import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";

/** Client separation is absolute (#20 / pipeline Ground Rule 4): any query
 *  that could return another client's data is a company-ending bug. These
 *  contract tests assert every consultant-facing entry point verifies the
 *  consultantClients link (or delegates to a guard that does) before touching
 *  company data. Discovery-based by design (not a hand-maintained allowlist)
 *  — they fail the moment someone adds an unguarded action, route, or page,
 *  without needing to remember to add it to a list first. */

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

function functionBody(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}`);
  if (start === -1) return "";
  const rest = source.slice(start);
  const next = rest.slice(1).search(/\nexport (async )?function |\n\/\/ ─/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

function findFiles(dir: string, filename: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) findFiles(full, filename, out);
    else if (entry === filename) out.push(full);
  }
  return out;
}

const GUARDS = ["consultantClients", "ledgerGuard(", "ownsClient(", "asConsultantFor("];

describe("client separation walls (#20)", () => {
  it("every exported action that takes a companyId verifies ownership", () => {
    const src = read("lib/consultant-actions.ts");
    const names = new Set<string>();
    const re = /^export async function (\w+)\(/gm;
    let m;
    while ((m = re.exec(src))) names.add(m[1]);

    let checked = 0;
    for (const name of names) {
      const body = functionBody(src, name);
      const signature = body.slice(0, body.indexOf(")") + 1);
      if (!/companyId\s*:\s*string/.test(signature)) continue; // not company-scoped
      checked++;
      expect(
        GUARDS.some((g) => body.includes(g)),
        `${name} takes companyId but has no ownership guard`
      ).toBe(true);
    }
    // Sanity: discovery must actually find company-scoped actions, so a
    // refactor that changes the export pattern can't silently zero out coverage.
    expect(checked).toBeGreaterThan(20);

    // The shared guards themselves must check the link.
    for (const guard of ["ownsClient", "ledgerGuard", "asConsultantFor"]) {
      expect(src).toContain(`async function ${guard}`);
      expect(
        functionBody(src.replace(`async function ${guard}`, `export async function ${guard}`), guard)
      ).toContain("consultantClients");
    }
  });

  it("every consultant-facing API route verifies ownership", () => {
    for (const route of [
      "app/api/evidence/[id]/route.ts",
      "app/api/snapshots/[id]/export/route.ts",
      "app/api/events/export/route.ts",
    ]) {
      const src = read(route);
      expect(src, `${route} missing consultantClients guard`).toContain("consultantClients");
      expect(src, `${route} missing role check`).toContain('role !== "consultant"');
    }
  });

  it("every page under clients/[id] is guarded by itself or an ancestor layout", () => {
    const root = join(process.cwd(), "app/consultant/clients/[id]");
    const pages = findFiles(root, "page.tsx");
    // Sanity: discovery must actually find pages, so a directory rename
    // can't silently make this test check nothing.
    expect(pages.length).toBeGreaterThan(5);

    for (const pagePath of pages) {
      const rel = pagePath.replace(process.cwd() + "/", "");
      const sources = [readFileSync(pagePath, "utf8")];
      let dir = dirname(pagePath);
      while (dir.includes("clients/[id]")) {
        try {
          sources.push(readFileSync(join(dir, "layout.tsx"), "utf8"));
        } catch {
          // no layout at this level - fine, keep walking up
        }
        if (dir.endsWith("clients/[id]")) break;
        dir = dirname(dir);
      }
      const combined = sources.join("\n");
      expect(combined, `${rel}: neither the page nor an ancestor layout guards this client's data`).toContain(
        "consultantClients.consultantId"
      );
      expect(combined, `${rel}: neither the page nor an ancestor layout 404s an unauthorized visitor`).toContain(
        "notFound()"
      );
    }
  });

  it("portal routes never accept a companyId from the client — the token IS the scope", () => {
    for (const route of [
      "app/api/portal/import/route.ts",
      "app/api/portal/mapping-preview/route.ts",
      "app/api/portal/stuck/route.ts",
      "app/api/portal/request-new-link/route.ts",
    ]) {
      const src = read(route);
      expect(src, `${route} must derive company from the token's request`).toContain("dataRequest");
      expect(src, `${route} must not read companyId from the request body`).not.toMatch(/body\.companyId/);
    }
  });
});
