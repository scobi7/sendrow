import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";
import { NavLinks } from "@/components/nav";
import { MobileNav } from "@/components/mobile-nav";
import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/store";
import { logout } from "@/lib/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const company = await getCompany(user!.companyId);
  if (!company.setupComplete) redirect("/setup");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 sm:flex-row">
      {/* Mobile top bar + drawer */}
      <MobileNav companyName={company.name} email={user!.email} />

      {/* Desktop sidebar */}
      <aside className="no-print hidden w-56 shrink-0 flex-col border-r border-zinc-200 bg-white sm:flex">
        <div className="flex h-14 items-center border-b border-zinc-100 px-4">
          <Logo />
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-3">
          <NavLinks />
        </div>
        <div className="border-t border-zinc-100 px-4 py-3">
          <p className="truncate text-xs font-semibold text-zinc-900">{company.name}</p>
          <p className="truncate text-xs text-zinc-400">{user!.email}</p>
          <form action={logout}>
            <button className="mt-2 text-xs text-zinc-400 hover:text-red-600 transition-colors">Log out</button>
          </form>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-auto px-4 py-6 sm:px-10 sm:py-8">{children}</main>
    </div>
  );
}
