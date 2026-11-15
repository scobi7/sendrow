"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/#how", label: "How it works" },
  { href: "/#deadlines", label: "Deadlines" },
  { href: "/login", label: "Sign in" },
];

/** Sendrow mark and wordmark, drawn in the 4c nav style (ink square, page-colour bars). */
export function LandingBrand() {
  return (
    <span className="inline-flex items-center gap-2.5 font-display text-xl font-extrabold tracking-[-0.015em] sm:text-[22px]">
      <svg aria-hidden="true" width={28} height={28} viewBox="0 0 100 100" className="block shrink-0">
        <rect width="100" height="100" rx="36" style={{ fill: "var(--text)" }} />
        <path d="M33,23 L67,23 L67,35 L19,35 L19,32 A14,9 0 0 1 33,23 Z" style={{ fill: "var(--bg)" }} />
        <circle cx="79" cy="29" r="6" style={{ fill: "var(--bg)" }} />
        <path d="M19,44 L67,44 A14,9 0 0 1 81,53 L81,56 L33,56 A14,9 0 0 1 19,47 L19,44 Z" style={{ fill: "var(--bg)" }} />
        <circle cx="21" cy="71" r="6" style={{ fill: "var(--bg)" }} />
        <path d="M33,65 L81,65 L81,68 A14,9 0 0 1 67,77 L33,77 L33,65 Z" style={{ fill: "var(--bg)" }} />
      </svg>
      Sendrow
    </span>
  );
}

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Escape closes the menu and returns focus to the Menu button.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: "var(--bg)", borderBottom: "1px solid var(--divider)", color: "var(--text)" }}
    >
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:h-[72px] sm:px-10">
        <Link href="/" aria-label="Sendrow, home">
          <LandingBrand />
        </Link>
        <div className="flex items-center">
          <nav aria-label="Main" className="hidden items-center gap-7 sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-base font-medium hover:underline hover:underline-offset-4"
                style={{ color: "var(--text)" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link href="/request-access" className="btn btn-primary px-4 py-2 text-sm sm:ml-7 sm:text-base">
            Request access
          </Link>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={menuId}
            className="ml-2 inline-flex min-h-11 items-center rounded-lg border px-3.5 text-base font-semibold sm:hidden"
            style={{ borderColor: "var(--text)", color: "var(--text)", background: "transparent" }}
          >
            Menu
          </button>
        </div>
      </div>
      <div
        id={menuId}
        hidden={!open}
        className="absolute inset-x-0 top-full sm:hidden"
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--divider)", boxShadow: "var(--shadow-card)" }}
      >
        <nav aria-label="Mobile" className="flex flex-col">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex min-h-[52px] items-center px-4 text-base font-medium"
              style={{ color: "var(--text)", borderTop: "1px solid var(--divider)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
