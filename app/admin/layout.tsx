import Link from "next/link";
import { Logo } from "@/components/ui";

const ADMIN_NAV = [
  { href: "/admin/factors", label: "Emission factors" },
  { href: "/admin/referrals", label: "Referral leads" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/waitlist", label: "Waitlist" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header
        className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-8"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}
      >
        <Logo />
        <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          Admin
        </span>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 sm:ml-4">
          {ADMIN_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
