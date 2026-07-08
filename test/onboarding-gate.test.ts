import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Source-contract smoke tests for the Plan I onboarding gates. These guard the
 * acceptance criterion "a new company cannot reach first upload without
 * boundary + screening recorded" against accidental removal — the flow itself
 * is exercised in manual QA (it spans Clerk auth + DB).
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("onboarding gates (Plan I Phase 0)", () => {
  it("setup wizard requires a boundary approach before advancing", () => {
    const wizard = read("app/setup/wizard.tsx");
    expect(wizard).toContain('fd.set("boundary_approach", boundary)');
    expect(wizard).toContain("disabled={!boundary}");
    expect(wizard).toContain("equity_share");
    expect(wizard).toContain("financial_control");
    expect(wizard).toContain("operational_control");
  });

  it("saveSetup persists the boundary approach", () => {
    const actions = read("lib/actions.ts");
    expect(actions).toContain('formData.get("boundary_approach")');
    expect(actions).toContain("set({ boundaryApproach })");
  });

  it("intake landing soft-gates on missing Scope 3 screening", () => {
    const page = read("app/(app)/intake/page.tsx");
    expect(page).toContain('redirect("/scope3-screening?from=intake")');
  });

  it("intake upload soft-gates on missing Scope 3 screening", () => {
    const page = read("app/(app)/intake/upload/page.tsx");
    expect(page).toContain('redirect("/scope3-screening?from=intake")');
  });
});
