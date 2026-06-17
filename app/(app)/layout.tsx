import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Logo } from "@/components/ui";
import { NavLinks } from "@/components/nav";
import { MobileNav } from "@/components/mobile-nav";
import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { LogoutButton } from "@/components/logout-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const user = await currentUser();
  if (!user) redirect("/onboarding");
  if (user.role === "consultant") redirect("/consultant");
  if (!user.companyId) redirect("/onboarding");
  const company = await loadCompany(user.companyId);
  if (!company.setupComplete) redirect("/setup");

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <MobileNav companyName={company.name} email={user.email} />
      <div className="flex min-h-screen">
        <aside
          className="no-print hidden w-56 flex-col px-4 py-6 sm:flex"
          style={{
            borderRight: "1px solid var(--divider)",
            background: "var(--surface)",
          }}
        >
          <Logo />
          <div className="mt-8 flex-1">
            <NavLinks />
          </div>
          <div className="pt-4" style={{ borderTop: "1px solid var(--divider)" }}>
            <p className="truncate text-xs font-semibold" style={{ color: "var(--text)" }}>{company.name}</p>
            <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{user.email}</p>
            <LogoutButton />
          </div>
        </aside>
        <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
      </div>
    </div>
  );
}
