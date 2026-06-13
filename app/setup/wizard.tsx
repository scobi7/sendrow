"use client";

import { useState } from "react";
import { Logo, ProgressBar } from "@/components/ui";
import { saveSetup } from "@/lib/actions";

const INDUSTRIES = ["Logistics", "Manufacturing", "Food and Beverage", "Retail", "Construction", "Professional Services", "Other"];
const HEADCOUNTS: [string, string][] = [
  ["under_50", "Under 50"],
  ["50_150", "50 to 150"],
  ["150_350", "150 to 350"],
  ["350_500", "350 to 500"],
];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface Loc { address: string; city: string; state: string; zip: string }

export default function SetupWizard({ companyName }: { companyName: string }) {
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [locCount, setLocCount] = useState(1);
  const [locations, setLocations] = useState<Loc[]>([{ address: "", city: "", state: "CA", zip: "" }]);
  const [fyEnd, setFyEnd] = useState(12);
  const [submitting, setSubmitting] = useState(false);

  const setLocField = (i: number, k: keyof Loc, v: string) =>
    setLocations((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  const updateLocCount = (n: number) => {
    const count = Math.min(Math.max(n, 1), 20);
    setLocCount(count);
    setLocations((ls) => {
      const next = ls.slice(0, count);
      while (next.length < count) next.push({ address: "", city: "", state: "CA", zip: "" });
      return next;
    });
  };

  async function finish() {
    setSubmitting(true);
    const fd = new FormData();
    fd.set("industry", industry);
    fd.set("headcount", headcount);
    fd.set("fiscal_year_end", String(fyEnd));
    fd.set("location_count", String(locCount));
    locations.forEach((l, i) => {
      fd.set(`loc_${i}_address`, l.address);
      fd.set(`loc_${i}_city`, l.city);
      fd.set(`loc_${i}_state`, l.state);
      fd.set(`loc_${i}_zip`, l.zip);
    });
    await saveSetup(fd);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-10">
      <div className="mb-8 flex justify-center"><Logo /></div>
      <p className="mb-2 text-center text-sm text-slate-500">Step {step} of 4 — {companyName}</p>
      <ProgressBar percent={(step / 4) * 100} className="mb-10" />

      {step === 1 && (
        <div className="card">
          <h1 className="text-lg font-bold text-navy-900">What industry is your company in?</h1>
          <p className="mt-1 text-sm text-slate-500">This determines which emissions categories matter most for you.</p>
          <select className="input mt-4" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="">Select an industry…</option>
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </select>
          <div className="mt-6 flex justify-end">
            <button className="btn-primary" disabled={!industry} onClick={() => setStep(2)}>Next</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h1 className="text-lg font-bold text-navy-900">How many employees does your company have?</h1>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {HEADCOUNTS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setHeadcount(value)}
                className={`rounded-lg border px-4 py-4 text-sm font-medium transition ${
                  headcount === value ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-300 bg-white text-slate-700 hover:border-brand-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn-primary" disabled={!headcount} onClick={() => setStep(3)}>Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h1 className="text-lg font-bold text-navy-900">How many physical locations does your company operate?</h1>
          <p className="mt-1 text-sm text-slate-500">Each location will need its own electricity and gas data. Different grid regions have different emission factors.</p>
          <input type="number" min={1} max={20} className="input mt-4 w-28" value={locCount}
            onChange={(e) => updateLocCount(Number(e.target.value))} />
          <div className="mt-4 space-y-4">
            {locations.map((l, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Location {i + 1}</p>
                <div className="grid grid-cols-2 gap-3">
                  <input className="input col-span-2" placeholder="Street address" value={l.address} onChange={(e) => setLocField(i, "address", e.target.value)} />
                  <input className="input" placeholder="City" value={l.city} onChange={(e) => setLocField(i, "city", e.target.value)} />
                  <div className="flex gap-3">
                    <input className="input w-16" placeholder="CA" maxLength={2} value={l.state} onChange={(e) => setLocField(i, "state", e.target.value.toUpperCase())} />
                    <input className="input" placeholder="ZIP" value={l.zip} onChange={(e) => setLocField(i, "zip", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button className="btn-primary" disabled={locations.some((l) => !l.city || !l.state)} onClick={() => setStep(4)}>Next</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <h1 className="text-lg font-bold text-navy-900">When does your fiscal year end?</h1>
          <p className="mt-1 text-sm text-slate-500">All data collection and calculations cover the 12 months ending on this month.</p>
          <select className="input mt-4" value={fyEnd} onChange={(e) => setFyEnd(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <div className="mt-6 flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(3)}>Back</button>
            <button className="btn-primary" disabled={submitting} onClick={finish}>
              {submitting ? "Saving…" : "Finish Setup"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
