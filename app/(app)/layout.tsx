import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Logo } from "@/components/ui";
import { NavLinks } from "@/components/nav";
import { MobileNav } from "@/components/mobile-nav";
import { LogoutButton } from "@/components/logout-button";
import { getUserCompany, getCompany } from "@/lib/store";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const user = await getUserCompany(userId);
  if (!user) redirect("/setup");

  const company = await getCompany(user.companyId);
  if (!company.setupComplete) redirect("/setup");

  return (
    <div className="flex min-h-screen flex-col sm:flex-row" style={{ background: "var(--bg)" }}>
      <MobileNav companyName={company.name} email={user.email} />

      {/* Desktop sidebar */}
      <aside className="no-print hidden w-56 shrink-0 flex-col sm:flex"
        style={{ borderRight: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="flex h-14 items-center px-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <Logo />
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-3">
          <NavLinks />
        </div>
        <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
          <p className="truncate text-xs font-semibold" style={{ color: "var(--text-1)" }}>{company.name}</p>
          <p className="truncate text-xs" style={{ color: "var(--text-3)" }}>{user.email}</p>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto px-4 py-6 sm:px-10 sm:py-8">{children}</main>
    </div>
  );
}
