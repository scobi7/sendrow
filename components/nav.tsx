"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="mt-6 flex-1 space-y-0.5">
      {NAV.map(([href, label]) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-50 text-brand-700 font-semibold"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
