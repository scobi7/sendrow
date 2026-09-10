import { describe, it, expect } from "vitest";
import { normalizeEmail, isValidEmail } from "@/lib/waitlist-validation";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Kerri@Firm.COM  ")).toBe("kerri@firm.com");
  });
});

describe("isValidEmail", () => {
  it("accepts a plausible work email", () => {
    expect(isValidEmail("kerri@firm.com")).toBe(true);
    expect(isValidEmail("  Kerri@Firm.COM  ")).toBe(true);
  });

  it("rejects missing @ or domain", () => {
    expect(isValidEmail("kerri")).toBe(false);
    expect(isValidEmail("kerri@")).toBe(false);
    expect(isValidEmail("kerri@firm")).toBe(false);
  });

  it("rejects empty or whitespace-only input", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
  });

  it("rejects unreasonably long input", () => {
    expect(isValidEmail(`${"a".repeat(250)}@firm.com`)).toBe(false);
  });
});
