import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { CommandMenu } from "@/components/command-menu";
import { ConsultantNav, MobileNav } from "@/components/consultant-nav";
import { db } from "@/lib/db";
import { companies, consultantClients } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

/** Sidebar pages in order. "Request templates" = what to ask for, "Format library" = how to output it.
 *  "New request" and "Add client" are the two actions above this list (desktop) and in the phone menu. */
const NAV: { href: string; label: string; hint?: string }[] = [
  { href: "/consultant", label: "Clients" },
  { href: "/consultant/calendar", label: "Compliance calendar" },
  { href: "/consultant/templates", label: "Request templates", hint: "what to ask for" },
  { href: "/consultant/formats", label: "Format library", hint: "how to output it" },
  { href: "/consultant/settings", label: "Settings" },
];

export default async function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "consultant") redirect("/onboarding");

  const clients = await db
    .select({ id: companies.id, name: companies.name })
    .from(consultantClients)
    .innerJoin(companies, eq(companies.id, consultantClients.companyId))
    .where(and(eq(consultantClients.consultantId, user.id), isNull(consultantClients.archivedAt)))
    .orderBy(companies.name);

  const items: { label: string; href: string; group: "Pages" | "Clients" }[] = [
    ...NAV.map((item) => ({ label: item.label, href: item.href, group: "Pages" as const })),
    { label: "New request", href: "/consultant/requests/new", group: "Pages" },
    { label: "Add client", href: "/consultant/clients/new", group: "Pages" },
    ...clients.map((c) => ({ label: c.name, href: `/consultant/clients/${c.id}`, group: "Clients" as const })),
  ];

  return (
    <div className="flex min-h-screen flex-col sm:flex-row" style={{ background: "var(--bg)" }}>
      <MobileNav items={NAV} />
      <aside
        className="no-print sticky top-0 hidden h-screen w-60 flex-col overflow-y-auto px-4 py-6 sm:flex"
        style={{ borderRight: "1px solid var(--divider)", background: "var(--surface)" }}
      >
        <Logo />
        <CommandMenu items={items} />
        <div className="mt-3 flex flex-col gap-2">
          <Link href="/consultant/requests/new" className="btn btn-primary w-full">
            New request
          </Link>
          <Link href="/consultant/clients/new" className="btn btn-secondary w-full">
            Add client
          </Link>
        </div>
        <ConsultantNav items={NAV} />
        <div className="pt-4" style={{ borderTop: "1px solid var(--divider)" }}>
          <p className="truncate text-xs font-semibold" style={{ color: "var(--text)" }}>{user.name}</p>
          <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{user.email}</p>
          <Link
            href="/onboarding"
            className="mt-2 block text-xs transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            Switch account type
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-10 sm:py-8">{children}</main>
    </div>
  );
}
