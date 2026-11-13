import Link from "next/link";
import { regulatoryTimeline, STATUS_LABEL } from "@/lib/regulatory-dates";

/** Slim band above the site header: the next date for each regulation, swipeable on phones. */
export function DeadlineBar({ today }: { today: string }) {
  const groups = regulatoryTimeline(today);
  return (
    <div className="py-2 text-xs" style={{ background: "var(--ink-band)", color: "var(--ink-band-text)" }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex gap-6 overflow-x-auto whitespace-nowrap">
          <span className="font-semibold">Regulatory deadlines</span>
          {groups.map((g) => {
            const first = g.entries[0];
            if (!first) return null;
            return (
              <span key={g.regulation}>
                {g.regulation}: {first.short}
                {first.date && ` ${first.dateLabel}`}
                {first.date && first.status !== "confirmed" && ` (${STATUS_LABEL[first.status].toLowerCase()})`}
              </span>
            );
          })}
          <Link href="/#deadlines" className="underline">
            All deadlines
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Full calendar of regulatory dates, one card per regulation, each entry with its source. */
export function DeadlinesSection({ today }: { today: string }) {
  const groups = regulatoryTimeline(today);
  return (
    <section id="deadlines" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-16">
      <h2 className="font-display text-2xl font-bold" style={{ color: "var(--text)" }}>
        Regulatory deadlines in one place
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        SB 253, SB 261 and CDP run on different timelines. Here they are side by side, each with its source.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {groups.map((g) => (
          <div key={g.regulation} className="card">
            <h3 className="text-[15px] font-bold" style={{ color: "var(--text)" }}>
              {g.regulation}
            </h3>
            <ul className="mt-4 space-y-5">
              {g.entries.map((e) => (
                <li key={e.id}>
                  <p className="font-data text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {e.dateLabel}
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--text)" }}>
                    {e.title}
                  </p>
                  {e.status !== "confirmed" && (
                    <p className="mt-0.5 text-xs" style={{ color: "var(--warning)" }}>
                      {STATUS_LABEL[e.status]}
                    </p>
                  )}
                  {e.source.startsWith("http") && (
                    <a
                      href={e.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs underline"
                      style={{ color: "var(--primary)" }}
                    >
                      Source
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
        EcoVadis has no fixed annual deadline: assessments run when a buyer requests one. Dates change, so confirm
        with the regulator before filing.
      </p>
    </section>
  );
}
