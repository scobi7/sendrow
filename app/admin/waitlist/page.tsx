export const dynamic = "force-dynamic";

import { getWaitlistStats } from "@/lib/waitlist";
import { PageHeader } from "@/components/ui";

const EVENT_LABELS: Record<string, string> = {
  page_view: "Homepage views",
  nav_how_it_works_click: "Clicked “How it works”",
  nav_signin_click: "Clicked “Sign in”",
};

/** Admin: homepage waitlist + engagement (Plan L) - the "how many signups,
 *  how many clicked through" measurement Malachi asked for, without a
 *  third-party analytics tool. */
export default async function AdminWaitlistPage() {
  const { total, designPartners, signups, eventCounts } = await getWaitlistStats();
  const pageViews = eventCounts.find((e) => e.eventName === "page_view")?.count ?? 0;
  const conversionRate = pageViews > 0 ? Math.round((total / pageViews) * 100) : null;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Waitlist"
        subtitle={`${total} signup${total !== 1 ? "s" : ""} · ${designPartners} interested in a design partner seat${
          conversionRate !== null ? ` · ${conversionRate}% of visitors signed up` : ""
        }`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card-inner">
          <small className="text-xs" style={{ color: "var(--text-muted)" }}>Total signups</small>
          <strong className="mt-2 block font-data text-2xl font-medium" style={{ color: "var(--text)" }}>{total}</strong>
        </div>
        <div className="card-inner">
          <small className="text-xs" style={{ color: "var(--text-muted)" }}>Design partner interest</small>
          <strong className="mt-2 block font-data text-2xl font-medium" style={{ color: "var(--text)" }}>{designPartners}</strong>
        </div>
        <div className="card-inner">
          <small className="text-xs" style={{ color: "var(--text-muted)" }}>Homepage views</small>
          <strong className="mt-2 block font-data text-2xl font-medium" style={{ color: "var(--text)" }}>{pageViews}</strong>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-bold" style={{ color: "var(--text)" }}>Engagement</h2>
      {eventCounts.length === 0 ? (
        <div className="card mb-8 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          No visits recorded yet.
        </div>
      ) : (
        <div className="glass-panel mb-8 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {eventCounts.map(({ eventName, count }) => (
                <tr key={eventName} style={{ borderBottom: "1px solid var(--divider)" }}>
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                    {EVENT_LABELS[eventName] ?? eventName}
                  </td>
                  <td className="px-4 py-3 text-right font-data text-xs" style={{ color: "var(--text-muted)" }}>
                    {count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mb-3 text-sm font-bold" style={{ color: "var(--text)" }}>Signups</h2>
      {signups.length === 0 ? (
        <div className="card py-12 text-center" style={{ color: "var(--text-muted)" }}>
          No signups yet - they appear here as soon as someone submits the homepage form.
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs font-semibold uppercase tracking-wide"
                style={{ borderBottom: "1px solid var(--divider)", color: "var(--text-muted)" }}
              >
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Design partner</th>
                <th className="px-4 py-3">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--divider)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>{s.email}</td>
                  <td className="px-4 py-3 text-xs capitalize" style={{ color: "var(--text-muted)" }}>{s.source}</td>
                  <td className="px-4 py-3">
                    {s.wantsDesignPartner ? (
                      <span className="chip">Yes</span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(s.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
