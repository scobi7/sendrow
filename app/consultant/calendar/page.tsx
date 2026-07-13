import Link from "next/link";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, consultantClients, dataRequests } from "@/lib/db/schema";
import { BackLink } from "@/components/workflow";

/** Compliance Calendar (#44): regulatory dates preloaded (Masao maintains
 *  them), consultant deadlines pulled live from open requests. Deadlines set
 *  each request's chasing cadence (7/2/day-of/overdue). */
const REGULATORY_DATES: { date: string; dateLabel: string; title: string; note: string }[] = [
  // Source: docs/build-pipeline-2026-07-10.pdf — corrections in force
  { date: "2026-08-10", dateLabel: "Aug 10, 2026", title: "SB 253 — Scope 1/2 disclosure", note: "Regulatory, preloaded · all clients" },
  { date: "2026-09-14", dateLabel: "Sep 14, 2026", title: "CDP submission window closes", note: "Regulatory, preloaded" },
  { date: "2027-01-01", dateLabel: "2027 cycle", title: "SB 253 — Scope 3 disclosure begins", note: "Regulatory, preloaded" },
];

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
  const clientDeadlines = openRequests
    .filter((r) => r.dueDate)
    .map((r) => ({
      date: r.dueDate!,
      dateLabel: new Date(r.dueDate! + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      title: `${nameOf.get(r.companyId) ?? "Client"} — ${r.description}`,
      note: "Set by consultant",
      companyId: r.companyId,
    }));

  const entries = [
    ...REGULATORY_DATES.map((r) => ({ ...r, companyId: null as string | null })),
    ...clientDeadlines,
  ].sort((a, b) => a.date.localeCompare(b.date));

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
          const past = e.date < today;
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
              </div>
              {past && (
                <span className="shrink-0 font-data text-[11px]" style={{ color: "var(--danger)" }}>past</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs" style={{ color: "var(--text-muted)" }}>
        Regulatory dates are maintained centrally. Client deadlines come from open requests — set one on the{" "}
        <Link href="/consultant/requests/new" className="underline" style={{ color: "var(--primary)" }}>
          New request
        </Link>{" "}
        form.
      </p>
    </div>
  );
}
