import { fmtShortDate, fmtShortDateYear } from "@/lib/format";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireOwnedClient } from "@/lib/guards";
import { db } from "@/lib/db";
import { companies, dataRequests } from "@/lib/db/schema";
import { toggleRequestReminders } from "@/lib/consultant-actions";

/** Automatic Chasing (#21): configured per-request, runs automatically after.
 *  Cadence is deadline-relative (7 / 2 / day-of / overdue); requests without
 *  a due date fall back to the age-based 3/7/14 schedule. */
export default async function ChasingSchedulePage({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;

  await requireOwnedClient(id);

  const [company, req] = await Promise.all([
    db.query.companies.findFirst({ where: eq(companies.id, id) }),
    db.query.dataRequests.findFirst({ where: eq(dataRequests.id, requestId) }),
  ]);
  if (!company || !req || req.companyId !== id) notFound();

  const sent = (req.remindersSentAt as Record<string, string> | null) ?? {};

  type Touch = { key: string; label: string; detail: string };
  let schedule: Touch[];
  if (req.dueDate) {
    const due = new Date(req.dueDate + "T12:00:00");
    const offset = (days: number) => {
      const d = new Date(due);
      d.setDate(d.getDate() - days);
      return d;
    };
    schedule = [
      { key: "due-7", label: "7 days before due", detail: `Scheduled: ${fmtShortDate(offset(7))}` },
      { key: "due-2", label: "2 days before due", detail: `Scheduled: ${fmtShortDate(offset(2))}` },
      { key: "due-0", label: "Day of deadline", detail: `Scheduled: ${fmtShortDate(due)}` },
      { key: "overdue", label: "If overdue", detail: "3 days after due (you're CC'd)" },
    ];
  } else {
    schedule = [
      { key: "3", label: "3 days after sending", detail: "No due date: age-based fallback" },
      { key: "7", label: "7 days after sending", detail: "Age-based fallback" },
      { key: "14", label: "14 days after sending", detail: "Age-based fallback (you're CC'd)" },
    ];
  }

  const log = Object.entries(sent).sort((a, b) => a[1].localeCompare(b[1]));
  const closed = req.status !== "open";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>
            Reminder schedule: {company.name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {req.description}
            {req.dueDate && ` · due ${fmtShortDateYear(req.dueDate + "T12:00:00")}`}
          </p>
        </div>
        {!closed && (
          <form action={toggleRequestReminders.bind(null, requestId, id)}>
            <button
              className="rounded px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
              style={
                req.remindersEnabled
                  ? { background: "var(--primary-tint)", color: "var(--primary)", border: "1px solid var(--chip-border)" }
                  : { background: "var(--warning-tint)", color: "var(--warning-strong)", border: "1px solid var(--warning-border)" }
              }
            >
              {req.remindersEnabled ? "Pause chasing" : "Resume chasing"}
            </button>
          </form>
        )}
      </div>

      {closed && (
        <div className="mb-4 rounded-xl px-4 py-3 text-xs" style={{ background: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success-text)" }}>
          This request is {req.status}. Submission stops all reminders instantly.
        </div>
      )}

      <div className="card mb-6">
        <h2 className="mb-3 text-lg font-bold" style={{ color: "var(--text)" }}>Cadence</h2>
        <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
          {schedule.map((t) => {
            const sentAt = sent[t.key];
            return (
              <div key={t.key} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{t.label}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {sentAt ? `Sent: ${fmtShortDateYear(sentAt)}` : t.detail}
                  </p>
                </div>
                <span
                  className="font-data text-xs"
                  style={{ color: sentAt ? "var(--success-text)" : req.remindersEnabled && !closed ? "var(--text-muted)" : "var(--neutral-muted)" }}
                >
                  {sentAt ? "sent" : req.remindersEnabled && !closed ? "scheduled" : "paused"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
          Cadence is set from the due date (compliance calendar drives it). Each tier fires once; a submission stops
          everything instantly.
        </p>
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold" style={{ color: "var(--text)" }}>Reminder log</h2>
        {log.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No reminders sent yet.</p>
        ) : (
          <div className="space-y-2">
            {log.map(([tier, ts]) => (
              <p key={tier} className="text-sm" style={{ color: "var(--text)" }}>
                <span className="font-data text-xs" style={{ color: "var(--text-muted)" }}>{fmtShortDateYear(ts)}</span>: reminder
                sent ({tierLabel(tier)}) · polite tone, includes the direct magic link
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function tierLabel(tier: string): string {
  switch (tier) {
    case "due-7": return "7 days out";
    case "due-2": return "2 days out";
    case "due-0": return "day of deadline";
    case "overdue": return "overdue";
    default: return `day ${tier}`;
  }
}
