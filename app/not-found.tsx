import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      <header
        className="flex items-center px-8 py-5"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--divider)" }}
      >
        <Link href="/"><Logo /></Link>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-6xl font-black font-data" style={{ color: "var(--track-bg)" }}>404</p>
        <h1 className="mt-4 text-2xl font-bold font-display" style={{ color: "var(--text)" }}>Page not found</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          This page doesn&apos;t exist or was moved.
        </p>
        <Link href="/dashboard" className="btn btn-primary mt-8">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
