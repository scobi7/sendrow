"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Overview", path: "" },
  { label: "Data ledger", path: "/ledger" },
  { label: "Review", path: "/review" },
  { label: "Activity", path: "/activity" },
  { label: "Enter data", path: "/manage" },
];

/** Section tabs shared by every client page. Overview also covers request and snapshot detail pages. */
export function ClientTabs({ companyId }: { companyId: string }) {
  const pathname = usePathname();
  const root = `/consultant/clients/${companyId}`;

  function isActive(path: string): boolean {
    if (path === "") {
      return pathname === root || pathname.startsWith(`${root}/requests/`) || pathname.startsWith(`${root}/snapshots/`);
    }
    return pathname.startsWith(`${root}${path}`);
  }

  return (
    <nav
      aria-label="Client sections"
      className="mb-6 flex gap-5 overflow-x-auto whitespace-nowrap"
      style={{ borderBottom: "1px solid var(--divider)" }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.path);
        return (
          <Link
            key={tab.path}
            href={`${root}${tab.path}`}
            aria-current={active ? "page" : undefined}
            className={`py-2.5 text-sm transition-colors ${active ? "font-semibold" : "font-medium"}`}
            style={{
              color: active ? "var(--text)" : "var(--text-muted)",
              borderBottom: `2px solid ${active ? "var(--primary)" : "transparent"}`,
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
