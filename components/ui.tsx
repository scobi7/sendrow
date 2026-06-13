import Link from "next/link";
import { SectionStatus } from "@/lib/types";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`flex items-center gap-2 text-lg font-bold tracking-tight ${light ? "text-white" : "text-zinc-900"}`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-sm">G</span>
      GreenTrack
    </span>
  );
}

export function StatusDot({ status }: { status: SectionStatus }) {
  const color =
    status === "complete"
      ? "bg-brand-500"
      : status === "in_progress"
      ? "bg-amber-400"
      : "bg-zinc-300";
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />;
}

export function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-zinc-200 ${className}`}>
      <div
        className="h-full rounded-full bg-brand-500 transition-all duration-500"
        style={{ width: `${Math.max(percent, 2)}%` }}
      />
    </div>
  );
}

export function CO2eBox({ label, tons }: { label: string; tons: number }) {
  return (
    <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3 text-sm">
      <span className="font-medium text-brand-800">{label}</span>
      <span className="font-bold text-brand-700">
        {tons.toLocaleString("en-US", { maximumFractionDigits: 2 })} tCO2e
      </span>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-navy-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
    </div>
  );
}

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex cursor-help">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-500">
        i
      </span>
      <span className="invisible absolute bottom-5 left-1/2 z-10 w-64 -translate-x-1/2 rounded-lg bg-navy-900 p-3 text-xs text-white shadow-lg group-hover:visible">
        {text}
      </span>
    </span>
  );
}

export function BackLink({ href = "/dashboard", label = "Back to dashboard" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="mb-4 inline-block text-sm text-brand-700 hover:underline no-print">
      ← {label}
    </Link>
  );
}
