import crypto from "crypto";
import { DATA_TYPE_CONFIGS } from "./ingestion/data-type-templates";
import type { DataType } from "./ingestion/data-type-templates";

export type ChecklistItem = {
  id: string;
  dataType: DataType;
  label: string;
  instructions: string;
  status: "pending" | "received";
  /** Set when the client hit "I'm stuck" — the consultant sees and clears it. */
  stuckNote?: string;
};

export const PORTAL_TOKEN_TTL_DAYS = 30;

export function generatePortalToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function portalExpiry(from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + PORTAL_TOKEN_TTL_DAYS);
  return d.toISOString();
}

export function portalTokenValid(request: { token: string | null; expiresAt: string | null; status: string }): boolean {
  if (!request.token) return false;
  if (request.status === "cancelled") return false;
  if (request.expiresAt && new Date(request.expiresAt) < new Date()) return false;
  return true;
}

/** Client-facing instructions per data type — plain language, no jargon. */
const ITEM_INSTRUCTIONS: Record<DataType, string> = {
  utility_bills: "Upload your monthly utility statements (PDF or spreadsheet export), or type in the kWh and therms from each bill.",
  fleet_fuel_dollar: "Upload your fuel card statement or expense export showing total $ spent on fuel per month.",
  vendor_invoices: "Upload an accounts-payable or expense export from your accounting system (vendor, category, amount, date).",
  commute_survey: "Upload your employee commute survey results (mode of travel and one-way miles per employee).",
  business_travel: "Upload your travel expense report or a list of flights taken (origin, destination, traveler).",
  custom: "Upload the file described in the request, or enter the values directly.",
};

export function buildChecklist(dataTypes: DataType[], fallbackDescription: string): ChecklistItem[] {
  if (dataTypes.length === 0) {
    return [{
      id: "item_1",
      dataType: "custom",
      label: fallbackDescription,
      instructions: ITEM_INSTRUCTIONS.custom,
      status: "pending",
    }];
  }
  return dataTypes.map((dt, i) => ({
    id: `item_${i + 1}`,
    dataType: dt,
    label: DATA_TYPE_CONFIGS[dt].label,
    instructions: ITEM_INSTRUCTIONS[dt],
    status: "pending",
  }));
}

export function checklistComplete(checklist: ChecklistItem[]): boolean {
  return checklist.length > 0 && checklist.every((i) => i.status === "received");
}
