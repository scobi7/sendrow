"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Logo } from "@/components/ui";
import { LogoutButton } from "@/components/logout-button";

export type ConsultantNavItem = { href: string; label: string; hint?: string };

/** The Clients item (href /consultant) also covers every /consultant/clients/* page. */
function isActive(pathname: string, href: string): boolean {
  if (href === "/consultant") return pathname === "/consultant" || pathname.startsWith("/consultant/clients");
  return pathname.startsWith(href);
}

function NavLinks({ items, pathname, onNavigate }: { items: ConsultantNavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={`nav-link block rounded-canopy-sm px-3 py-2 text-sm transition-colors ${active ? "font-semibold" : "font-medium"}`}
            style={active ? { background: "var(--bg-subtle)", color: "var(--text)" } : { color: "var(--text-muted)" }}
          >
            {item.label}
            {item.hint && (
              <span className="mt-0.5 block font-data text-[10px] tracking-wide" style={{ color: "var(--neutral-muted)" }}>
                {item.hint}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}

/** Desktop sidebar link list with the current page highlighted. */
export function ConsultantNav({ items }: { items: ConsultantNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Consultant" className="mt-8 flex-1 space-y-0.5">
      <NavLinks items={items} pathname={pathname} />
    </nav>
  );
}

/** Phone top bar with a Menu button that opens the links and the two actions. Hidden at sm and up. */
export function MobileNav({ items }: { items: ConsultantNavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // Close the panel when the user lands on another page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="no-print sticky top-0 z-40 sm:hidden" style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}>
      <div
        className="flex items-center justify-between px-4 pb-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <Logo />
        <button
          type="button"
          className="btn btn-secondary"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </div>
      {open && (
        <div id={panelId} className="space-y-4 px-4 pb-4" style={{ borderTop: "1px solid var(--divider)" }}>
          <nav aria-label="Consultant" className="space-y-0.5 pt-3">
            <NavLinks items={items} pathname={pathname} onNavigate={() => setOpen(false)} />
          </nav>
          <div className="flex flex-col gap-2">
            <Link href="/consultant/requests/new" className="btn btn-primary w-full" onClick={() => setOpen(false)}>
              New request
            </Link>
            <Link href="/consultant/clients/new" className="btn btn-secondary w-full" onClick={() => setOpen(false)}>
              Add client
            </Link>
          </div>
          <div className="pt-3" style={{ borderTop: "1px solid var(--divider)" }}>
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
