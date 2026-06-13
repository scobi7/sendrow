import Link from "next/link";
import { SectionStatus } from "@/lib/types";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-lg font-bold tracking-tight"
      style={{ color: light ? "#fff" : "var(--text-1)" }}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
        style={{ background: "var(--brand)" }}>
        G
      </span>
      GreenTrack
    </span>
  );
}

export function StatusDot({ status }: { status: SectionStatus }) {
  const color =
    status === "complete"    ? "var(--brand)" :
    status === "in_progress" ? "#d97706" :
                               "var(--border)";
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />;
}

export function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${className}`} style={{ background: "var(--border)" }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(percent, 2)}%`, background: "var(--brand)" }} />
    </div>
  );
}

export function CO2eBox({ label, tons }: { label: string; tons: number }) {
  return (
    <div className="mt-4 flex items-center justify-between rounded-lg px-4 py-3 text-sm"
      style={{ background: "var(--brand-light)" }}>
      <span className="font-medium" style={{ color: "var(--brand-text)" }}>{label}</span>
      <span className="font-bold" style={{ color: "var(--brand)" }}>
        {tons.toLocaleString("en-US", { maximumFractionDigits: 2 })} tCO2e
      </span>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>{title}</h1>
      {subtitle && <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>{subtitle}</p>}
    </div>
  );
}

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex cursor-help">
      <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ background: "var(--border)", color: "var(--text-2)" }}>i</span>
      <span className="invisible absolute bottom-5 left-1/2 z-10 w-64 -translate-x-1/2 rounded-lg p-3 text-xs text-white shadow-lg group-hover:visible"
        style={{ background: "var(--text-1)" }}>
        {text}
      </span>
    </span>
  );
}

export function BackLink({ href = "/dashboard", label = "Back to dashboard" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="mb-4 inline-block text-sm hover:underline no-print"
      style={{ color: "var(--brand)" }}>
      ← {label}
    </Link>
  );
}
