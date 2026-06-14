"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "./ui";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />
        <nav className="hidden items-center gap-8 sm:flex">
          <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            How it works
          </a>
          <a href="#about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            About
          </a>
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary text-sm px-4 py-2">
            Get started
          </Link>
        </nav>
        <button
          onClick={() => setOpen(!open)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 transition-colors sm:hidden"
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
        <div className="border-t border-slate-100 bg-white px-6 py-5 sm:hidden">
          <nav className="flex flex-col gap-5">
            <a href="#how-it-works" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-600">
              How it works
            </a>
            <a href="#about" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-600">
              About
            </a>
            <Link href="/login" className="text-sm font-medium text-slate-600">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary text-sm text-center px-4 py-2">
              Get started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
