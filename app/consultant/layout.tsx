import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

/** Sidebar per wireframe (#19): the consultant's whole world in six links.
 *  "Request templates" = what to ask for · "Format library" = how to output it. */
const NAV: { href: string; label: string; hint?: string }[] = [
  { href: "/consultant", label: "Dashboard" },
  { href: "/consultant/requests/new", label: "New request" },
  { href: "/consultant/templates", label: "Request templates", hint: "what to ask for" },
  { href: "/consultant/formats", label: "Format library", hint: "how to output it" },
  { href: "/consultant/calendar", label: "Compliance calendar" },
  { href: "/consultant/settings", label: "Settings" },
];

export default async function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "consultant") redirect("/onboarding");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <aside
        className="no-print hidden w-60 flex-col px-4 py-6 sm:flex"
        style={{ borderRight: "1px solid var(--divider)", background: "var(--surface)", backdropFilter: "blur(18px)" }}
      >
        <Logo />
        <nav className="mt-8 flex-1 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link block rounded-canopy-sm px-3 py-2 text-sm font-medium transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              {item.label}
              {item.hint && (
                <span className="mt-0.5 block font-data text-[10px] tracking-wide" style={{ color: "var(--neutral-muted)" }}>
                  {item.hint}
                </span>
              )}
            </Link>
          ))}
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
