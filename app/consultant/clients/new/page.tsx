import Link from "next/link";
import { consultantAddClient } from "@/lib/actions";
import { PageHeader } from "@/components/ui";

const INDUSTRIES = [
  "Logistics",
  "Manufacturing",
  "Food and Beverage",
  "Retail",
  "Construction",
  "Professional Services",
  "Other",
];

const HEADCOUNTS = [
  { value: "under_50", label: "Under 50" },
  { value: "50_150", label: "50–150" },
  { value: "150_350", label: "150–350" },
  { value: "350_500", label: "350–500" },
];

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/consultant" className="mb-4 inline-block text-sm text-emerald-700 hover:underline">
        ← Back to clients
      </Link>
      <PageHeader title="Add New Client" subtitle="Create a client profile and generate an invite link." />

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={consultantAddClient} className="card space-y-4">
        <div>
          <label className="label">Company name</label>
          <input name="name" required className="input" placeholder="Acme Corp" />
        </div>
        <div>
          <label className="label">Industry</label>
          <select name="industry" className="input">
            <option value="">Select industry…</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Headcount</label>
          <select name="headcount" className="input">
            <option value="">Select range…</option>
            {HEADCOUNTS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-400">
          After adding the client, you'll be able to generate an invite link for them to connect their account.
        </p>
        <div className="flex justify-end gap-3">
          <Link href="/consultant" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary">
            Add Client
          </button>
        </div>
      </form>
    </div>
  );
}
