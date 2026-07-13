import Link from "next/link";
import { BackLink } from "@/components/workflow";

/** Format Library (#35, list view): every shape data can leave Sendrow in.
 *  Formats are maintained centrally as configs — when a regulator changes
 *  their form, the update lands here and every export keeps working. */
const BUILT_IN_FORMATS: { name: string; meta: string; exportKey: string }[] = [
  { name: "SB 253 draft template", meta: "Built-in · CARB regulatory format", exportKey: "sb253" },
  { name: "Plain Excel export", meta: "Built-in · generic spreadsheet", exportKey: "excel" },
  { name: "Buyer questionnaire CSV", meta: "Built-in · question → answer rows", exportKey: "questionnaire" },
  { name: "PACT V3 draft", meta: "Built-in · interoperability JSON", exportKey: "pact" },
];

export default function FormatLibraryPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <BackLink />
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>Format library</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          How to output it — one approved snapshot in, any of these out. Available on every snapshot&apos;s
          Snapshot &amp; Share screen.
        </p>
      </div>

      <div className="mb-6 space-y-3">
        {BUILT_IN_FORMATS.map((f) => (
          <div key={f.exportKey} className="card flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold" style={{ color: "var(--text)" }}>{f.name}</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{f.meta}</p>
            </div>
            <span className="chip">snapshot export</span>
          </div>
        ))}
      </div>

      {/* The mapping builder is W3 (#35 builder) — until then the honest path */}
      <div className="card" style={{ border: "1px dashed var(--chip-border)" }}>
        <p className="font-semibold" style={{ color: "var(--text)" }}>+ Add a new format</p>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
          Got a buyer&apos;s custom questionnaire (PDF/Excel)? The self-serve mapping builder — upload it, connect each
          question to a data field once, reuse it forever — is the next build phase. Until it ships, send the
          questionnaire over and it gets added as a config, usually within a day. New formats are private to your
          practice until the mapping is confirmed with the buyer.
        </p>
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          To use a format now: open a client →{" "}
          <Link href="/consultant" className="underline" style={{ color: "var(--primary)" }}>
            approve their review
          </Link>{" "}
          → pick the format on Snapshot &amp; Share.
        </p>
      </div>
    </div>
  );
}
