import Link from "next/link";
import styles from "@/app/home.module.css";
import { REGULATORY_DATES, STATUS_LABEL, regulatoryTimeline } from "@/lib/regulatory-dates";

/** Deadline strip at the very top of the homepage: the next date for each regulation. Scrolls inside its own box on phones. */
export function DeadlineBar({ today }: { today: string }) {
  const groups = regulatoryTimeline(today);
  return (
    <div className={styles.deadlineBar}>
      <div className={styles.wrap}>
        <div className={styles.deadlineRow} data-scroll-x>
          <span className={styles.deadlineLabel}>Regulatory deadlines</span>
          {groups.map((g) => {
            const first = g.entries[0];
            if (!first) return null;
            return (
              <span key={g.regulation} className={styles.deadlineItem}>
                {g.regulation}: {first.short}
                {first.date && ` ${first.dateLabel}`}
                {first.date && first.status !== "confirmed" && ` (${STATUS_LABEL[first.status].toLowerCase()})`}
              </span>
            );
          })}
          <Link href="/#deadlines" className={styles.deadlineLink}>
            All deadlines
          </Link>
        </div>
      </div>
    </div>
  );
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "Dates to plan around": every upcoming or on-hold entry, one row each, with its source. Data comes from lib/regulatory-dates.ts. */
export function DeadlinesSection({ today }: { today: string }) {
  const rows = regulatoryTimeline(today).flatMap((g) => g.entries);
  const checkedOn = REGULATORY_DATES.reduce((latest, d) => (d.checkedOn > latest ? d.checkedOn : latest), "");
  return (
    <section id="deadlines" className={styles.sec} aria-labelledby="dl-h2" style={{ scrollMarginTop: 24 }}>
      <div className={styles.wrap}>
        <h2 id="dl-h2" className={styles.h2}>
          Dates to plan around
        </h2>
        <div className={styles.dlWrap} data-scroll-x>
          <table className={styles.dl}>
            <caption className={styles.srOnly}>Reporting deadlines and their status</caption>
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">What</th>
                <th scope="col">Status</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className={styles.when}>{e.dateLabel}</td>
                  <td>{e.title}</td>
                  <td>{STATUS_LABEL[e.status]}</td>
                  <td>
                    {e.source.startsWith("http") && (
                      <a href={e.source} target="_blank" rel="noopener noreferrer" className={styles.srcLink}>
                        Source
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              <tr>
                <td className={styles.when}>No fixed date</td>
                <td>EcoVadis: assessments run all year</td>
                <td />
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <p className={styles.fnNote}>Checked {shortDate(checkedOn)}.</p>
      </div>
    </section>
  );
}
