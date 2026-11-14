import Link from "next/link";
import { STATUS_LABEL, upcomingRegulatoryDates } from "@/lib/regulatory-dates";

/** Next regulatory deadlines, shown at the top of the consultant dashboard. */
export function DeadlineStrip({ today }: { today: string }) {
  const items = upcomingRegulatoryDates(today);
  if (items.length === 0) return null;

  return (
    <section className="glass-panel mb-6 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          Upcoming deadlines
        </h2>
        <Link href="/consultant/calendar" className="text-xs underline" style={{ color: "var(--primary)" }}>
          Full calendar
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((r) => (
          <div key={r.id} className="min-w-0">
            <p className="font-data text-sm font-semibold" style={{ color: "var(--text)" }}>{r.dateLabel}</p>
            <p className="text-sm" style={{ color: "var(--text)" }}>
              {r.regulation}: {r.title}
            </p>
            {r.status !== "confirmed" && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{STATUS_LABEL[r.status]}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
