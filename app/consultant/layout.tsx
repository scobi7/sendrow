import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const user = await currentUser();
  if (!user) redirect("/onboarding");
  if (user.role !== "consultant") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="no-print hidden w-56 flex-col border-r border-slate-200 bg-white px-4 py-6 sm:flex">
        <Logo />
        <nav className="mt-8 flex-1 space-y-1">
          <Link
            href="/consultant"
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
          >
            My Clients
          </Link>
        </nav>
        <div className="border-t border-slate-100 pt-4">
          <p className="truncate text-xs font-semibold text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-400">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
