import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export default async function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "consultant") redirect("/dashboard");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <aside
        className="no-print hidden w-56 flex-col px-4 py-6 sm:flex"
        style={{ borderRight: "1px solid var(--divider)", background: "var(--surface)" }}
      >
        <Logo />
        <nav className="mt-8 flex-1 space-y-0.5">
          <Link
            href="/consultant"
            className="nav-link block rounded-canopy-sm px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            My Clients
          </Link>
        </nav>
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
      <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
