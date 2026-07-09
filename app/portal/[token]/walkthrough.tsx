"use client";

import { useState } from "react";
import type { DataType } from "@/lib/ingestion/data-type-templates";

/** Guided walkthrough (Plan T5.3): the hybrid. TrackZero-style hand-holding,
 *  but scoped to ONE request — plain questions, one activity per step, skip
 *  anything you don't have. Minutes, not an onboarding journey. */

export type WalkStep = {
  key: string;
  question: string;
  help: string;
  activity_type: string;
  unit: string;
  unitLabel: string;
};

export const WALKTHROUGH_STEPS: Partial<Record<DataType, WalkStep[]>> = {
  utility_bills: [
    {
      key: "electricity",
      question: "How much electricity did you use?",
      help: "Grab the kWh number from each monthly bill — it's usually near the total.",
      activity_type: "electricity",
      unit: "kWh",
      unitLabel: "kWh",
    },
    {
      key: "natgas",
      question: "How much natural gas?",
      help: "Look for 'therms' on your gas bill. If your bill shows ccf, enter that — we convert.",
      activity_type: "natural gas",
      unit: "therms",
      unitLabel: "therms",
    },
    {
      key: "propane",
      question: "Any propane deliveries?",
      help: "Gallons per delivery or per month, from your supplier's invoices.",
      activity_type: "propane",
      unit: "gallon",
      unitLabel: "gallons",
    },
  ],
  fleet_fuel_dollar: [
    {
      key: "diesel",
      question: "How many gallons of diesel did your vehicles use?",
      help: "From fuel card summaries or receipts. Only have $ amounts? Enter those in 'Type it in' — your consultant converts them.",
      activity_type: "diesel",
      unit: "gallon",
      unitLabel: "gallons",
    },
    {
      key: "gasoline",
      question: "How many gallons of gasoline?",
      help: "Same idea — gallons if you have them.",
      activity_type: "gasoline",
      unit: "gallon",
      unitLabel: "gallons",
    },
  ],
  commute_survey: [
    {
      key: "commute",
      question: "How many total miles do employees commute?",
      help: "A monthly total across everyone is fine — estimates are okay and get labeled as such.",
      activity_type: "commute",
      unit: "mile",
      unitLabel: "miles",
    },
  ],
  custom: [
    {
      key: "electricity",
      question: "Electricity used?",
      help: "kWh from your utility bills. Skip if not relevant.",
      activity_type: "electricity",
      unit: "kWh",
      unitLabel: "kWh",
    },
    {
      key: "natgas",
      question: "Natural gas?",
      help: "Therms from your gas bill. Skip if not relevant.",
      activity_type: "natural gas",
      unit: "therms",
      unitLabel: "therms",
    },
    {
      key: "fuel",
      question: "Vehicle fuel?",
      help: "Gallons of diesel or gasoline. Skip if not relevant.",
      activity_type: "diesel",
      unit: "gallon",
      unitLabel: "gallons",
    },
  ],
};

type MonthAmount = { date: string; amount: string };

export function Walkthrough({
  dataType,
  busy,
  onSubmit,
}: {
  dataType: DataType;
  busy: boolean;
  onSubmit: (rows: Record<string, string>[]) => void;
}) {
  const steps = WALKTHROUGH_STEPS[dataType] ?? WALKTHROUGH_STEPS.custom!;
  const [stepIdx, setStepIdx] = useState(0);
  const [entries, setEntries] = useState<Record<string, MonthAmount[]>>({});
  const [review, setReview] = useState(false);

  const step = steps[stepIdx];
  const current = entries[step?.key ?? ""] ?? [{ date: "", amount: "" }];

  function setCurrent(rows: MonthAmount[]) {
    setEntries((e) => ({ ...e, [step.key]: rows }));
  }

  function collectRows(): Record<string, string>[] {
    const out: Record<string, string>[] = [];
    for (const s of steps) {
      for (const r of entries[s.key] ?? []) {
        if (r.amount.trim() === "") continue;
        out.push({ date: r.date, activity_type: s.activity_type, quantity: r.amount, unit: s.unit });
      }
    }
    return out;
  }

  function next() {
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1);
    else setReview(true);
  }

  if (review) {
    const rows = collectRows();
    return (
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Quick check — here&apos;s everything you entered:
        </p>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Nothing entered yet. Go back and fill in at least one amount, or try another way.
          </p>
        ) : (
          <div className="mt-3 space-y-1">
            {rows.map((r, i) => (
              <p key={i} className="text-sm" style={{ color: "var(--text-muted)" }}>
                {r.date || "no date"} · {r.activity_type} ·{" "}
                <span className="font-data" style={{ color: "var(--text)" }}>{r.quantity} {r.unit}</span>
              </p>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <button className="text-xs underline" style={{ color: "var(--text-muted)" }} onClick={() => setReview(false)} disabled={busy}>
            ← Back
          </button>
          <button className="btn btn-primary text-sm" disabled={busy || rows.length === 0} onClick={() => onSubmit(rows)}>
            {busy ? "Sending…" : `Submit ${rows.length} entr${rows.length === 1 ? "y" : "ies"}`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        Step {stepIdx + 1} of {steps.length}
      </p>
      <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>{step.question}</p>
      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{step.help}</p>

      <div className="mt-3 space-y-2">
        {current.map((r, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <input
              type="month"
              className="input text-sm"
              value={r.date}
              onChange={(e) => setCurrent(current.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))}
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Amount"
                className="input flex-1 text-sm"
                value={r.amount}
                onChange={(e) => setCurrent(current.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))}
              />
              <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>{step.unitLabel}</span>
            </div>
          </div>
        ))}
      </div>
      <button
        className="mt-2 text-xs underline"
        style={{ color: "var(--text-muted)" }}
        onClick={() => setCurrent([...current, { date: "", amount: "" }])}
      >
        + Add another month
      </button>

      <div className="mt-4 flex items-center justify-between">
        {stepIdx > 0 ? (
          <button className="text-xs underline" style={{ color: "var(--text-muted)" }} onClick={() => setStepIdx(stepIdx - 1)}>
            ← Back
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <button className="text-xs underline" style={{ color: "var(--text-muted)" }} onClick={next}>
            Skip — don&apos;t have this
          </button>
          <button className="btn btn-primary px-4 py-1.5 text-sm" onClick={next}>
            {stepIdx === steps.length - 1 ? "Review" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
