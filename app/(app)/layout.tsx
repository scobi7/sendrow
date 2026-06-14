import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { loadCompany } from "@/lib/store";
import { LogoutButton } from "@/components/logout-button";

const NAV: [string, string][] = [
  ["/dashboard", "Dashboard"],
  ["/connections", "Connections"],
  ["/scope1", "Scope 1"],
  ["/scope2", "Scope 2"],
  ["/scope3", "Scope 3"],
  ["/social", "Social"],
  ["/governance", "Governance"],
  ["/reports", "Reports"],
  ["/gaps", "Gap Analysis"],
  ["/settings", "Settings"],
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");           // not signed in with Clerk at all
  const user = await currentUser();
  if (!user) redirect("/onboarding");        // signed in with Clerk but no DB record yet
  if (user.role === "consultant") redirect("/consultant");
  if (!user.companyId) redirect("/onboarding");
  const company = await loadCompany(user.companyId);
  if (!company.setupComplete) redirect("/setup");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="no-print hidden w-56 flex-col border-r border-slate-200 bg-white px-4 py-6 sm:flex">
        <Logo />
        <nav className="mt-8 flex-1 space-y-1">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors">
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 pt-4">
          <p className="truncate text-xs font-semibold text-slate-900">{company.name}</p>
          <p className="truncate text-xs text-slate-400">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
