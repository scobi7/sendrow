"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
    router.push("/setup/complete");
  }

  const STEP_LABELS = ["Industry", "Employees", "Locations", "Fiscal Year"];

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col bg-white px-6 py-10">
      <div className="mb-8 flex justify-center"><Logo /></div>

      <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-400">
        <span>Step {step} of 4 — {STEP_LABELS[step - 1]}</span>
        <span>{companyName}</span>
      </div>
      <ProgressBar percent={(step / 4) * 100} className="mb-10" />

      {step === 1 && (
        <div className="card">
          <h1 className="text-lg font-bold text-navy-900">What industry is your company in?</h1>
          <p className="mt-1 text-sm text-zinc-500">This determines which emissions categories matter most for you.</p>
          <select className="input mt-4" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            <option value="">Select an industry…</option>
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </select>
          <div className="mt-6 flex justify-end">
            <button className="btn-primary" disabled={!industry} onClick={() => setStep(2)}>Next →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h1 className="text-lg font-bold text-navy-900">How many employees does your company have?</h1>
          <p className="mt-1 text-sm text-zinc-500">Governance requirements scale with company size.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {HEADCOUNTS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setHeadcount(value)}
                className={`rounded-xl border-2 px-4 py-5 text-sm font-semibold transition-all ${
                  headcount === value
                    ? "border-brand-500 bg-brand-50 text-brand-800 shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-brand-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-primary" disabled={!headcount} onClick={() => setStep(3)}>Next →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h1 className="text-lg font-bold text-navy-900">How many physical locations does your company operate?</h1>
          <p className="mt-1 text-sm text-zinc-500">Each location needs its own electricity and gas data. Different grid regions have different emission factors.</p>
          <input type="number" min={1} max={20} className="input mt-4 w-28" value={locCount}
            onChange={(e) => updateLocCount(Number(e.target.value))} />
          <div className="mt-4 space-y-4">
            {locations.map((l, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Location {i + 1}</p>
                <div className="grid grid-cols-2 gap-3">
                  <input className="input col-span-2 bg-white" placeholder="Street address" value={l.address} onChange={(e) => setLocField(i, "address", e.target.value)} />
                  <input className="input bg-white" placeholder="City" value={l.city} onChange={(e) => setLocField(i, "city", e.target.value)} />
                  <div className="flex gap-2">
                    <input className="input w-14 bg-white" placeholder="CA" maxLength={2} value={l.state} onChange={(e) => setLocField(i, "state", e.target.value.toUpperCase())} />
                    <input className="input bg-white" placeholder="ZIP" value={l.zip} onChange={(e) => setLocField(i, "zip", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
            <button className="btn-primary" disabled={locations.some((l) => !l.city || !l.state)} onClick={() => setStep(4)}>Next →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <h1 className="text-lg font-bold text-navy-900">When does your fiscal year end?</h1>
          <p className="mt-1 text-sm text-zinc-500">All data collection and calculations cover the 12 months ending on this month.</p>
          <select className="input mt-4" value={fyEnd} onChange={(e) => setFyEnd(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <div className="mt-6 flex justify-between">
            <button className="btn-secondary" onClick={() => setStep(3)}>← Back</button>
            <button className="btn-primary" disabled={submitting} onClick={finish}>
              {submitting ? "Saving…" : "Finish Setup ✓"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
