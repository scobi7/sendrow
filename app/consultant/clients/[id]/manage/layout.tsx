import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { findOwnedLink } from "@/lib/guards";
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

  const link = await findOwnedLink(user.id, id);
  if (!link) notFound();

  const company = await loadCompany(id);
  const pct = progressPercent(company);
  const base = `/consultant/clients/${id}/manage`;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Banner */}
      <div className="mb-6 rounded-xl px-5 py-3" style={{ background: "var(--primary-tint)", border: "1px solid var(--divider)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
          Managing as {company.name}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {pct}% complete. Changes here are visible to the client
        </p>
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
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--primary-tint)]"
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
