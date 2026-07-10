import Link from "next/link";
import { consultantAddClient } from "@/lib/actions";
import { PageHeader } from "@/components/ui";
import { NAICS_SECTORS } from "@/lib/naics";

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
      <Link
        href="/consultant"
        className="mb-4 inline-block text-sm font-medium transition-opacity hover:opacity-70"
        style={{ color: "var(--primary)" }}
      >
        ← Back to clients
      </Link>
      <PageHeader title="Add New Client" subtitle="Create a client profile — data requests and portal links go to the contact you set here." />

      {error && (
        <p
          className="mb-4 rounded-lg px-4 py-2 text-sm"
          style={{ background: "var(--danger-tint)", color: "var(--danger)" }}
        >
          {error}
        </p>
      )}

      <form action={consultantAddClient} className="card space-y-4">
        <div>
          <label className="label">Company name</label>
          <input name="name" required className="input" placeholder="Acme Corp" />
        </div>
        <div>
          <label className="label">Contact name</label>
          <input name="contact_name" className="input" placeholder="Jane Doe" />
        </div>
        <div>
          <label className="label">Contact email</label>
          <input name="contact_email" type="email" className="input" placeholder="jane@acme.com" />
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Portal links and reminders are emailed here. You can add it later, but requests won&apos;t be delivered until you do.
          </p>
        </div>
        <div>
          <label className="label">Industry sector (NAICS)</label>
          <select name="naics" className="input">
            <option value="">Select sector…</option>
            {NAICS_SECTORS.map((s) => (
              <option key={s.code} value={s.code}>{s.code} — {s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Industry</label>
          <select name="industry" className="input">
            <option value="">Select industry…</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Headcount</label>
          <select name="headcount" className="input">
            <option value="">Select range…</option>
            {HEADCOUNTS.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          After adding the client, you'll be able to generate an invite link for them to connect their account.
        </p>
        <div className="flex justify-end gap-3">
          <Link href="/consultant" className="btn btn-secondary">Cancel</Link>
          <button type="submit" className="btn btn-primary">Add Client</button>
        </div>
      </form>
    </div>
  );
}
