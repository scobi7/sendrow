import { describe, it, expect } from "vitest";
import { scoreSession } from "@/lib/ingestion/session-score";
import type { MatchResult } from "@/lib/ingestion/fuzzy-match";

const highMatch = (field: string): MatchResult => ({
  header: field,
  field: field as never,
  confidence: "high",
});

const lowMatch = (header: string): MatchResult => ({
  header,
  field: null,
  confidence: "low",
});

describe("scoreSession", () => {
  it("auto-approves known template with all required fields", () => {
    const matches: MatchResult[] = [
      highMatch("date"),
      highMatch("quantity"),
      highMatch("unit"),
      highMatch("activity_type"),
    ];
    const result = scoreSession("utility_bills", matches);
    expect(result.autoApproved).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.85);
  });

  it("does not auto-approve custom type even with all fields matched", () => {
    const matches: MatchResult[] = [
      highMatch("date"),
      highMatch("quantity"),
      highMatch("unit"),
    ];
    const result = scoreSession("custom", matches);
    expect(result.autoApproved).toBe(false);
    expect(result.score).toBeLessThan(0.85);
  });

  it("does not auto-approve known template missing required fields", () => {
    const matches: MatchResult[] = [
      highMatch("unit"),
      highMatch("activity_type"),
      lowMatch("unknown_col"),
    ];
    const result = scoreSession("fleet_fuel_dollar", matches);
    expect(result.autoApproved).toBe(false);
  });

  it("returns score between 0 and 1", () => {
    const result = scoreSession("custom", [lowMatch("col1"), lowMatch("col2")]);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it("includes reasons in result", () => {
    const result = scoreSession("utility_bills", [highMatch("date"), highMatch("quantity")]);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("score is capped at 1.0", () => {
    const matches: MatchResult[] = [
      highMatch("date"),
      highMatch("quantity"),
      highMatch("unit"),
      highMatch("activity_type"),
      highMatch("scope"),
      highMatch("category"),
    ];
    const result = scoreSession("utility_bills", matches);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
