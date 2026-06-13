"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./ui";
import { NavLinks } from "./nav";
import { logout } from "@/lib/actions";

interface Props {
  companyName: string;
  email: string;
}

export function MobileNav({ companyName, email }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* Mobile top bar — only visible on small screens */}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 sm:hidden no-print">
        <Logo />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Slide-in drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl transition-transform duration-200 sm:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-4">
          <Logo />
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-3 py-3">
          <NavLinks />
        </div>

        <div className="border-t border-zinc-100 px-4 py-3">
          <p className="truncate text-xs font-semibold text-zinc-900">{companyName}</p>
          <p className="truncate text-xs text-zinc-400">{email}</p>
          <form action={logout}>
            <button className="mt-2 text-xs text-zinc-400 hover:text-red-600 transition-colors">Log out</button>
          </form>
        </div>
      </div>
    </>
  );
}
