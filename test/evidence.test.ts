import { describe, it, expect } from "vitest";
import { sha256Hex } from "@/lib/evidence";

describe("evidence locker (Plan N3)", () => {
  it("sha256Hex produces a stable hex digest", () => {
    const a = sha256Hex(Buffer.from("utility bill jan 2026"));
    expect(a).toBe(sha256Hex(Buffer.from("utility bill jan 2026")));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Hex(Buffer.from("different"))).not.toBe(a);
  });
});
