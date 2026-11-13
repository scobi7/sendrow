import Link from "next/link";
import { Logo } from "@/components/ui";

const ADMIN_NAV = [
  { href: "/admin/factors", label: "Emission Factors" },
  { href: "/admin/referrals", label: "Referral Leads" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/waitlist", label: "Waitlist" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header
        className="flex items-center gap-6 px-8 py-4"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}
      >
        <Logo />
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Admin
        </span>
        <nav className="ml-4 flex gap-4">
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
      <main className="mx-auto max-w-5xl px-8 py-10">{children}</main>
    </div>
  );
}
