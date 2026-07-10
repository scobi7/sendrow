import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/** Client separation is absolute (#20 / pipeline Ground Rule 4): any query
 *  that could return another client's data is a company-ending bug. These
 *  contract tests assert every consultant-facing entry point verifies the
 *  consultantClients link (or delegates to a guard that does) before touching
 *  company data. Static by design — they fail the moment someone adds an
 *  unguarded action or route. */

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

function functionBody(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}`);
  if (start === -1) return "";
  const rest = source.slice(start);
  const next = rest.slice(1).search(/\nexport (async )?function |\n\/\/ ─/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

describe("client separation walls (#20)", () => {
  const GUARDS = ["consultantClients", "ledgerGuard(", "ownsClient("];

  it("every consultant action verifies ownership before touching company data", () => {
    const src = read("lib/consultant-actions.ts");
    const actions = [
      "approveSession", "flagSession", "rejectSession", "createDataRequest", "resendPortalEmail",
      "renewPortalLink", "confirmVendorMapping", "lockPipeline", "convertDollarFuel",
      "recategorizeLineItem", "editLineItemQuantity", "excludeLineItemAction", "restoreLineItem",
      "addLineItemComment", "markLineItemActual", "attachEvidenceToItem",
      "createSnapshot", "shareSnapshot", "revokeShareLink", "createShareLink",
      "toggleRequestReminders",
    ];
    for (const name of actions) {
      const body = functionBody(src, name);
      expect(body, `${name} is missing from consultant-actions.ts`).not.toBe("");
      expect(
        GUARDS.some((g) => body.includes(g)),
        `${name} has no ownership guard (consultantClients check or ledgerGuard)`
      ).toBe(true);
    }
    // the shared guards themselves must check the link
    expect(src).toContain("async function ownsClient");
    expect(functionBody(src.replace("async function ownsClient", "export async function ownsClient"), "ownsClient")).toContain("consultantClients");
    expect(src).toContain("async function ledgerGuard");
    expect(functionBody(src.replace("async function ledgerGuard", "export async function ledgerGuard"), "ledgerGuard")).toContain("consultantClients");
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

  it("every consultant page verifies the client link before rendering", () => {
    for (const page of [
      "app/consultant/clients/[id]/page.tsx",
      "app/consultant/clients/[id]/ledger/page.tsx",
      "app/consultant/clients/[id]/activity/page.tsx",
    ]) {
      const src = read(page);
      expect(src, `${page} missing consultantClients guard`).toContain("consultantClients.consultantId");
      expect(src, `${page} must 404 on missing link`).toContain("notFound()");
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
