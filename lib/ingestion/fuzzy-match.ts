export const STANDARD_FIELDS = [
  "date",
  "activity_type",
  "quantity",
  "unit",
  "scope",
  "category",
  "source_ref",
  "confidence",
  "notes",
] as const;

export type StandardField = (typeof STANDARD_FIELDS)[number];

export type MatchResult = {
  header: string;
  field: StandardField | null;
  confidence: "high" | "low";
};

/** Known aliases per standard field - lowercase, trimmed. */
const ALIASES: Record<StandardField, string[]> = {
  date: ["date", "bill date", "invoice date", "period", "month", "billing period", "service date", "activity date"],
  activity_type: ["activity type", "activity", "fuel type", "fuel", "energy type", "source", "type", "commodity"],
  quantity: ["quantity", "amount", "volume", "kwh", "kilowatt hours", "therms", "gallons", "gallons used", "usage", "consumption", "value", "units used", "total"],
  unit: ["unit", "units", "uom", "unit of measure", "measurement unit"],
  scope: ["scope", "ghg scope", "emission scope"],
  category: ["category", "ghg category", "emission category", "sector"],
  source_ref: ["source ref", "reference", "invoice", "invoice #", "invoice number", "bill number", "account", "account number", "meter", "meter id"],
  confidence: ["confidence", "data quality", "quality", "basis", "actual or estimated"],
  notes: ["notes", "note", "description", "comment", "comments", "memo"],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[_\-\/]/g, " ").trim();
}

export function fuzzyMatchHeaders(headers: string[]): MatchResult[] {
  return headers.map((header) => {
    const norm = normalize(header);

    for (const [field, aliases] of Object.entries(ALIASES) as [StandardField, string[]][]) {
      if (aliases.includes(norm)) {
        return { header, field, confidence: "high" };
      }
    }

    for (const [field, aliases] of Object.entries(ALIASES) as [StandardField, string[]][]) {
      if (aliases.some((a) => norm.includes(a) || a.includes(norm))) {
        return { header, field, confidence: "low" };
      }
    }

    return { header, field: null, confidence: "low" };
  });
}
