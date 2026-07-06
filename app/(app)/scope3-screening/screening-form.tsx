"use client";

import { useState, useTransition } from "react";
import { saveScreening } from "@/lib/actions";
import type { Scope3Category } from "./categories";

type Category = Scope3Category;
type SavedRow = { categoryNumber: number; status: string; reason: string | null; notes: string | null };

const REASONS = [
  "Not applicable to our operations",
  "Below materiality threshold",
  "Data unavailable",
  "Included in another category",
];

export function ScreeningForm({
  companyId,
  categories,
  savedMap,
}: {
  companyId: string;
  categories: readonly Category[];
  savedMap: Record<number, SavedRow>;
}) {
  type Decision = { status: "included" | "excluded"; reason: string; notes: string };
  const initial: Record<number, Decision> = Object.fromEntries(
    categories.map((c) => {
      const saved = savedMap[c.number];
      return [c.number, {
        status: (saved?.status as "included" | "excluded") ?? "excluded",
        reason: saved?.reason ?? "",
        notes: saved?.notes ?? "",
      }];
    })
  );

  const [decisions, setDecisions] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function update(num: number, patch: Partial<Decision>) {
    setSaved(false);
    setDecisions((prev) => ({ ...prev, [num]: { ...prev[num], ...patch } }));
  }

  function submit() {
    startTransition(async () => {
      const payload = Object.entries(decisions).map(([num, d]) => ({
        categoryNumber: Number(num),
        ...d,
      }));
      await saveScreening(companyId, payload);
      setSaved(true);
    });
  }

  const includedCount = Object.values(decisions).filter((d) => d.status === "included").length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {includedCount} of 15 included
        </p>
        <button
          onClick={submit}
          disabled={pending}
          className="btn btn-primary text-sm px-5 py-2"
        >
          {pending ? "Saving…" : saved ? "✓ Saved" : "Save screening"}
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => {
          const d = decisions[cat.number];
          const included = d.status === "included";
          return (
            <div
              key={cat.number}
              className="rounded-xl px-4 py-3 transition-colors"
              style={{
                border: `1px solid ${included ? "var(--primary)" : "var(--divider)"}`,
                background: included ? "var(--primary-tint)" : "var(--card)",
              }}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => update(cat.number, { status: included ? "excluded" : "included" })}
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                  style={{
                    borderColor: included ? "var(--primary)" : "var(--divider)",
                    background: included ? "var(--primary)" : "transparent",
                  }}
                  aria-label={included ? "Exclude" : "Include"}
                >
                  {included && (
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Cat {cat.number}</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{cat.name}</span>
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{cat.example}</p>

                  {!included && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {REASONS.map((r) => (
                        <button
                          key={r}
                          onClick={() => update(cat.number, { reason: d.reason === r ? "" : r })}
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors"
                          style={
                            d.reason === r
                              ? { background: "var(--divider)", color: "var(--text)" }
                              : { background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--divider)" }
                          }
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={submit}
          disabled={pending}
          className="btn btn-primary px-6"
        >
          {pending ? "Saving…" : saved ? "✓ Saved" : "Save screening"}
        </button>
      </div>
    </div>
  );
}
