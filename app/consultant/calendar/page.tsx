import { fmtShortDateYear } from "@/lib/format";
import Link from "next/link";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, consultantClients, dataRequests } from "@/lib/db/schema";
import { BackLink } from "@/components/workflow";
import { REGULATORY_DATES, STATUS_LABEL } from "@/lib/regulatory-dates";

/** Compliance Calendar (#44): regulatory dates come from lib/regulatory-dates
 *  (one config shared with the dashboard), consultant deadlines are pulled
 *  live from open requests. Deadlines set each request's chasing cadence
 *  (7/2/day-of/overdue). */

type Entry = {
  date: string | null;
  dateLabel: string;
  title: string;
  note: string;
  companyId: string | null;
  source?: string;
};

export default async function ComplianceCalendarPage() {
  const user = (await currentUser())!;

  const links = await db
    .select({ companyId: consultantClients.companyId })
    .from(consultantClients)
    .where(and(eq(consultantClients.consultantId, user.id), isNull(consultantClients.archivedAt)));
  const ids = links.map((l) => l.companyId);

  const [clientRows, openRequests] = ids.length
    ? await Promise.all([
        db.select({ id: companies.id, name: companies.name }).from(companies).where(inArray(companies.id, ids)),
        db
          .select({ companyId: dataRequests.companyId, description: dataRequests.description, dueDate: dataRequests.dueDate })
          .from(dataRequests)
          .where(and(inArray(dataRequests.companyId, ids), eq(dataRequests.status, "open"))),
      ])
    : [[], []];

  const nameOf = new Map(clientRows.map((c) => [c.id, c.name]));
  const clientDeadlines: Entry[] = openRequests
    .filter((r) => r.dueDate)
    .map((r) => ({
      date: r.dueDate!,
      dateLabel: fmtShortDateYear(new Date(r.dueDate! + "T12:00:00")),
      title: `${nameOf.get(r.companyId) ?? "Client"} - ${r.description}`,
      note: "Set by consultant",
      companyId: r.companyId,
    }));

  const regulatoryEntries: Entry[] = REGULATORY_DATES.map((r) => ({
    date: r.date,
    dateLabel: r.dateLabel,
    title: `${r.regulation}: ${r.title}`,
    note: `${STATUS_LABEL[r.status]}. Checked ${fmtShortDateYear(new Date(r.checkedOn + "T12:00:00"))}`,
    companyId: null,
    source: r.source,
  }));

  // Undated entries have no date and sort after dated ones (stable sort keeps
  // config order, so tbd comes before paused).
  const entries = [...regulatoryEntries, ...clientDeadlines].sort((a, b) =>
    (a.date ?? "9999-12-31").localeCompare(b.date ?? "9999-12-31")
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink />
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>Compliance calendar</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Deadlines here automatically set the reminder cadence in each request&apos;s chasing schedule.
        </p>
      </div>

      <div className="glass-panel divide-y" style={{ borderColor: "var(--divider)" }}>
        {entries.map((e, i) => {
          const past = e.date !== null && e.date < today;
          return (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <span
                className="chip shrink-0"
                style={past ? { opacity: 0.55 } : undefined}
              >
                {e.dateLabel}
              </span>
              <div className="min-w-0 flex-1">
                {e.companyId ? (
                  <Link href={`/consultant/clients/${e.companyId}`} className="block truncate text-sm font-medium underline-offset-2 hover:underline" style={{ color: "var(--text)" }}>
                    {e.title}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>{e.title}</p>
                )}
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{e.note}</p>
                {e.source?.startsWith("http") && (
                  <a
                    href={e.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline"
                    style={{ color: "var(--primary)" }}
                  >
                    Source
                  </a>
                )}
              </div>
              {past && (
                <span className="shrink-0 font-data text-[11px]" style={{ color: "var(--danger)" }}>past</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
        Regulatory dates are maintained centrally. Client deadlines come from open requests - set one on the{" "}
        <Link href="/consultant/requests/new" className="underline" style={{ color: "var(--primary)" }}>
          New request
        </Link>{" "}
        form.
      </p>
    </div>
  );
}
