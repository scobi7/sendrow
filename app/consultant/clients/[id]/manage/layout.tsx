import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consultantClients } from "@/lib/db/schema";
import { loadCompany } from "@/lib/store";
import { progressPercent } from "@/lib/progress";

const NAV = [
  { label: "Scope 1", href: "scope1" },
  { label: "Scope 2", href: "scope2" },
  { label: "Scope 3", href: "scope3" },
  { label: "Reports", href: "reports" },
];

export default async function ManageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || user.role !== "consultant") redirect("/login");

  const link = await db.query.consultantClients.findFirst({
    where: and(
      eq(consultantClients.consultantId, user.id),
      eq(consultantClients.companyId, id),
      isNull(consultantClients.archivedAt)
    ),
  });
  if (!link) notFound();

  const company = await loadCompany(id);
  const pct = progressPercent(company);
  const base = `/consultant/clients/${id}/manage`;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Banner */}
      <div
        className="mb-6 flex items-center justify-between rounded-xl px-5 py-3"
        style={{ background: "var(--primary-tint)", border: "1px solid rgba(34,168,84,0.25)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            M
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
              Managing as {company.name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {pct}% complete - changes here are visible to the client
            </p>
          </div>
        </div>
        <Link
          href={`/consultant/clients/${id}`}
          className="text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          &larr; Back to client
        </Link>
      </div>

      {/* Section tabs */}
      <div
        className="mb-6 flex flex-wrap gap-1 rounded-xl p-1"
        style={{ background: "var(--card)", border: "1px solid var(--divider)" }}
      >
        {NAV.map(({ label, href }) => {
          const sectionKey = href as keyof typeof company.sectionStatus;
          const status = company.sectionStatus[sectionKey];
          return (
            <Link
              key={href}
              href={`${base}/${href}`}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
              {status === "complete" && (
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--status-green)" }} />
              )}
              {status === "in_progress" && (
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--warning)" }} />
              )}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
