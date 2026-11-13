import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireOwnedClient } from "@/lib/guards";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { ClientTabs } from "@/components/client-tabs";

/** Shared header for every page under clients/[id]: breadcrumb and section tabs. */
export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOwnedClient(id);

  const company = await db.query.companies.findFirst({ where: eq(companies.id, id) });
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/consultant" className="transition-opacity hover:opacity-70" style={{ color: "var(--text-muted)" }}>
              Clients
            </Link>
          </li>
          <li aria-hidden="true" style={{ color: "var(--text-muted)" }}>
            /
          </li>
          <li aria-current="page" style={{ color: "var(--text)" }}>
            {company.name}
          </li>
        </ol>
      </nav>
      <ClientTabs companyId={id} />
      {children}
    </div>
  );
}
