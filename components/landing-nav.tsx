"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./ui";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--divider)",
        boxShadow: "0 1px 0 0 var(--divider)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/"><Logo /></Link>
        <nav className="hidden items-center gap-8 sm:flex">
          <Link
            href="/for-companies"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            For companies
          </Link>
          <Link
            href="/for-consultants"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            For consultants
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            Sign in
          </Link>
          <Link href="/demo" className="btn btn-primary text-sm px-4 py-2">
            Request a demo
          </Link>
        </nav>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors sm:hidden"
          style={{ color: "var(--text-muted)" }}
          aria-label="Toggle menu"
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
      {open && (
        <div
          className="px-6 py-5 sm:hidden"
          style={{ borderTop: "1px solid var(--divider)", background: "var(--surface)" }}
        >
          <nav className="flex flex-col gap-5">
            <Link href="/for-companies" onClick={() => setOpen(false)} className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              For companies
            </Link>
            <Link href="/for-consultants" onClick={() => setOpen(false)} className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              For consultants
            </Link>
            <Link href="/login" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              Sign in
            </Link>
            <Link href="/demo" className="btn btn-primary text-sm text-center px-4 py-2">
              Request a demo
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
