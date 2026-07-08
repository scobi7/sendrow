import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, and, isNull, count } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantClients, companies, intakeSessions, dataRequests } from "@/lib/db/schema";

export default async function ConsultantClientsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "consultant") redirect("/dashboard");

  const links = await db
    .select({ companyId: consultantClients.companyId })
    .from(consultantClients)
    .where(and(eq(consultantClients.consultantId, user.id), isNull(consultantClients.archivedAt)));

  const companyIds = links.map((c) => c.companyId);

  if (companyIds.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-extrabold font-display" style={{ color: "var(--text)" }}>Clients</h1>
        <div className="rounded-2xl p-10 text-center" style={{ background: "var(--card)", border: "1px solid var(--divider)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No clients yet. Use your invite link to onboard a company.</p>
        </div>
      </div>
    );
  }

  const [companyRows, pendingByCompany, openByCompany] = await Promise.all([
    db.select({ id: companies.id, name: companies.name }).from(companies)
      .then(rows => rows.filter(r => companyIds.includes(r.id))),
    db.select({ companyId: intakeSessions.companyId, cnt: count() })
      .from(intakeSessions)
      .where(eq(intakeSessions.status, "pending_review"))
      .groupBy(intakeSessions.companyId)
      .then(rows => Object.fromEntries(rows.filter(r => companyIds.includes(r.companyId)).map(r => [r.companyId, Number(r.cnt)]))),
    db.select({ companyId: dataRequests.companyId, cnt: count() })
      .from(dataRequests)
      .where(eq(dataRequests.status, "open"))
      .groupBy(dataRequests.companyId)
      .then(rows => Object.fromEntries(rows.filter(r => companyIds.includes(r.companyId)).map(r => [r.companyId, Number(r.cnt)]))),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold font-display" style={{ color: "var(--text)" }}>Clients</h1>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--divider)" }}>
        <div className="divide-y" style={{ borderColor: "var(--divider)" }}>
          {companyRows.map((company) => {
            const pendingCount = pendingByCompany[company.id] ?? 0;
            const openCount = openByCompany[company.id] ?? 0;
            return (
              <Link
                key={company.id}
                href={`/consultant/clients/${company.id}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:opacity-80"
                style={{ background: "var(--card)" }}
              >
                <div>
                  <p className="font-semibold" style={{ color: "var(--text)" }}>{company.name}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {openCount > 0 ? `${openCount} open request${openCount !== 1 ? "s" : ""}` : "No open requests"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {pendingCount > 0 && (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: "#fef9c3", color: "#92400e" }}>
                      {pendingCount} pending
                    </span>
                  )}
                  <svg className="h-4 w-4" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
