"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createRequestFromPage } from "@/lib/workflow-actions";
import { SubmitButton } from "@/components/submit-button";

/** Common reporting windows — same pick-don't-type pattern as the due date. */
const PERIOD_PRESETS = [
  "Calendar year 2025",
  "Calendar year 2026 to date",
  "Last 12 months",
  "Q1 2026",
  "Q2 2026",
];

const DATA_TYPE_CHIPS: { key: string; label: string }[] = [
  { key: "utility_bills", label: "Electricity & gas" },
  { key: "fleet_fuel_dollar", label: "Fleet fuel" },
  { key: "vendor_invoices", label: "Spend data" },
  { key: "business_travel", label: "Business travel" },
  { key: "commute_survey", label: "Commute survey" },
];

type TemplateOption = {
  id: string;
  name: string;
  description: string;
  dataTypes: string[];
  periodLabel: string | null;
  dueInDays: number | null;
};

type ClientOption = { id: string; name: string; contactEmail: string | null };

export function NewRequestForm({
  clients,
  templates,
  preselectedClient,
  preselectedTemplate,
}: {
  clients: ClientOption[];
  templates: TemplateOption[];
  preselectedClient: string | null;
  preselectedTemplate: string | null;
}) {
  const initialTemplate = templates.find((t) => t.id === preselectedTemplate) ?? null;
  const [templateId, setTemplateId] = useState(initialTemplate?.id ?? "");
  const [companyId, setCompanyId] = useState(
    preselectedClient && clients.some((c) => c.id === preselectedClient) ? preselectedClient : ""
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialTemplate?.dataTypes ?? []);
  const [period, setPeriod] = useState(initialTemplate?.periodLabel ?? "");
  const [customPeriod, setCustomPeriod] = useState(
    Boolean(initialTemplate?.periodLabel && !PERIOD_PRESETS.includes(initialTemplate.periodLabel))
  );
  const [description, setDescription] = useState(initialTemplate?.description ?? "");
  const [dueDate, setDueDate] = useState(() => (initialTemplate?.dueInDays ? inDays(initialTemplate.dueInDays) : ""));
  const [contactEmail, setContactEmail] = useState(
    clients.find((c) => c.id === (preselectedClient ?? ""))?.contactEmail ?? ""
  );

  const selectedClient = useMemo(() => clients.find((c) => c.id === companyId) ?? null, [clients, companyId]);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setSelectedTypes(t.dataTypes);
    setPeriod(t.periodLabel ?? "");
    setDescription(t.description);
    if (t.dueInDays) setDueDate(inDays(t.dueInDays));
  }

  function pickClient(id: string) {
    setCompanyId(id);
    const c = clients.find((x) => x.id === id);
    setContactEmail(c?.contactEmail ?? "");
  }

  function toggleType(key: string) {
    setSelectedTypes((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  return (
    <form action={createRequestFromPage} className="card space-y-5">
      {templates.length > 0 && (
        <div>
          <label className="label">Start from a template <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(skips steps below)</span></label>
          <select className="input" value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
            <option value="">None — build from scratch</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label">Company</label>
        <select name="company_id" required className="input" value={companyId} onChange={(e) => pickClient(e.target.value)}>
          <option value="">Search or select a supplier...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Not on the list?{" "}
          <Link href="/consultant/clients/new" className="underline" style={{ color: "var(--primary)" }}>
            Add a new client
          </Link>
        </p>
      </div>

      <div>
        <label className="label">Supplier contact email</label>
        <input
          name="contact_email"
          type="email"
          className="input"
          placeholder="priya@bluewaterlogistics.com"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Data types requested</label>
        <div className="flex flex-wrap gap-2">
          {DATA_TYPE_CHIPS.map(({ key, label }) => {
            const active = selectedTypes.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleType(key)}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
                style={
                  active
                    ? { background: "var(--primary-tint)", color: "var(--primary)", border: "1px solid var(--emerald)" }
                    : { background: "var(--card-strong)", color: "var(--text-muted)", border: "1px solid var(--chip-border)" }
                }
              >
                {active ? "✓ " : ""}{label}
              </button>
            );
          })}
        </div>
        {selectedTypes.map((t) => (
          <input key={t} type="hidden" name={`type_${t}`} value="on" />
        ))}
        {selectedTypes.length === 0 && (
          <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Nothing selected — the request goes out as one custom item described below.
          </p>
        )}
      </div>

      <div>
        <label className="label">Request name</label>
        <input
          name="description"
          className="input"
          placeholder="Q1 2026 emissions data"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Data covers</label>
          <select
            className="input"
            value={customPeriod ? "__custom" : period}
            onChange={(e) => {
              if (e.target.value === "__custom") {
                setCustomPeriod(true);
                setPeriod("");
              } else {
                setCustomPeriod(false);
                setPeriod(e.target.value);
              }
            }}
          >
            <option value="">Choose a period…</option>
            {PERIOD_PRESETS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
            <option value="__custom">Custom range…</option>
          </select>
          {customPeriod ? (
            <input
              name="period_label"
              className="input mt-2"
              placeholder="Jan 1, 2026 – Jun 30, 2026"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              autoFocus
            />
          ) : (
            <input type="hidden" name="period_label" value={period} />
          )}
        </div>
        <div>
          <label className="label">Due date</label>
          <input name="due_date" type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      <div
        className="flex items-center justify-between rounded-xl px-4 py-3 text-xs"
        style={{ background: "var(--primary-tint)", border: "1px solid var(--chip-border)" }}
      >
        <span style={{ color: "var(--text)" }}>
          Automatic reminders go out <strong>7 days before</strong>, <strong>2 days before</strong>, <strong>on the due
          date</strong>, and <strong>when overdue</strong> — no chasing by hand.
        </span>
        <span className="shrink-0" style={{ color: "var(--text-muted)" }}>Pausable per request</span>
      </div>

      <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
        <input type="checkbox" name="save_as_template" className="h-4 w-4 accent-emerald-600" />
        Save this setup as a template
      </label>

      {selectedClient && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {selectedClient.name} will get a magic link by email — no account needed to respond.
          {!contactEmail && " Add a contact email above (or share the link manually after sending)."}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-1">
        <Link href="/consultant" className="btn btn-secondary">Cancel</Link>
        <SubmitButton className="btn btn-primary" pendingText="Sending…">Send request</SubmitButton>
      </div>
    </form>
  );
}

function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
