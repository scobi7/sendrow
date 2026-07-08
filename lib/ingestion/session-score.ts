import type { MatchResult } from "./fuzzy-match";
import type { DataType } from "./data-type-templates";

export type SessionScoreResult = {
  score: number;
  autoApproved: boolean;
  reasons: string[];
};

const AUTO_APPROVE_THRESHOLD = 0.85;
const REQUIRED_FIELDS = ["quantity", "date"] as const;

export function scoreSession(
  dataType: DataType,
  matchResults: MatchResult[],
): SessionScoreResult {
  const reasons: string[] = [];
  let score = 0;

  // +0.50 for known template
  if (dataType !== "custom") {
    score += 0.5;
    reasons.push(`known template (${dataType})`);
  } else {
    reasons.push("custom format — no template bonus");
  }

  // +0.30 × required fields matched at high confidence
  const highFields = new Set(
    matchResults.filter((r) => r.confidence === "high" && r.field !== null).map((r) => r.field)
  );
  const requiredMatched = REQUIRED_FIELDS.filter((f) => highFields.has(f)).length;
  const requiredScore = requiredMatched / REQUIRED_FIELDS.length;
  score += 0.3 * requiredScore;
  reasons.push(`${requiredMatched}/${REQUIRED_FIELDS.length} required fields matched (quantity, date)`);

  // +0.20 × overall column match rate
  const matched = matchResults.filter((r) => r.field !== null).length;
  const matchRate = matched / Math.max(matchResults.length, 1);
  score += 0.2 * matchRate;
  reasons.push(`${matched}/${matchResults.length} columns mapped`);

  const finalScore = Math.min(1, score);

  return {
    score: parseFloat(finalScore.toFixed(3)),
    autoApproved: finalScore >= AUTO_APPROVE_THRESHOLD,
    reasons,
  };
}
