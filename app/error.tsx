"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center" style={{ background: "var(--bg)" }}>
      <p className="text-5xl font-black font-data" style={{ color: "var(--track-bg)" }}>500</p>
      <h1 className="mt-4 text-2xl font-bold font-display" style={{ color: "var(--text)" }}>Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--text-muted)" }}>
        An unexpected error occurred. If this keeps happening, please contact support.
        {error.digest && (
          <span className="mt-1 block text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="btn btn-primary">Try again</button>
        <Link href="/dashboard" className="btn btn-secondary">Go to dashboard</Link>
      </div>
    </main>
  );
}
