import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { getCompany } from "@/lib/store";
import { logout } from "@/lib/actions";

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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = currentUser();
  if (!user) redirect("/login");
  if (user.role === "consultant") redirect("/consultant");
  const company = getCompany(user.companyId);
  if (!company.setupComplete) redirect("/setup");

  return (
    <div className="flex min-h-screen">
      <aside className="no-print hidden w-56 flex-col border-r border-slate-200 bg-white px-4 py-6 sm:flex">
        <Logo />
        <nav className="mt-8 flex-1 space-y-1">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-800">
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 pt-4">
          <p className="truncate text-xs font-semibold text-navy-900">{company.name}</p>
          <p className="truncate text-xs text-slate-400">{user.email}</p>
          <form action={logout}>
            <button className="mt-2 text-xs text-slate-500 hover:text-red-600">Log out</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
