import Link from "next/link";
import { SectionStatus } from "@/lib/types";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span
      className="flex items-center gap-2 text-lg font-bold font-display"
      style={{ color: light ? "#fff" : "var(--text)" }}
    >
      <span
        className="flex h-8 w-8 items-center justify-center text-sm font-bold text-white"
        style={{ background: "var(--primary)", borderRadius: "var(--radius-sm)" }}
      >
        G
      </span>
      GreenTrack
    </span>
  );
}

export function StatusDot({ status }: { status: SectionStatus }) {
  const bg =
    status === "complete"
      ? "var(--status-green)"
      : status === "in_progress"
      ? "#F59E0B"
      : "var(--track-bg)";
  return (
    <span
      className="inline-block h-3 w-3 rounded-full shrink-0"
      style={{ background: bg }}
    />
  );
}

export function ProgressBar({ percent, className = "" }: { percent: number; className?: string }) {
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full ${className}`}
      style={{ background: "var(--track-bg)" }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.max(percent, 2)}%`,
          background: "var(--primary)",
        }}
      />
    </div>
  );
}

export function KpiCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div
      className="p-5"
      style={{
        background: "var(--primary-tint)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-semibold font-data"
        style={{ color: "var(--text)" }}
      >
        {value}
      </p>
      {caption && (
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
          {caption}
        </p>
      )}
    </div>
  );
}

export function IntegrationCard({
  name,
  initials,
  connected,
  lastSynced,
}: {
  name: string;
  initials: string;
  connected: boolean;
  lastSynced?: string | null;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ background: "var(--primary)" }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          {name}
        </p>
        {connected ? (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: "var(--status-green)" }}>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--status-green)" }}
            />
            Connected{lastSynced ? ` · synced ${new Date(lastSynced).toLocaleDateString()}` : ""}
          </p>
        ) : (
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Not connected
          </p>
        )}
      </div>
    </div>
  );
}

export function ScopeBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  return (
    <div className="space-y-4">
      {data.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {label}
          </span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--track-bg)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(value / max) * 100}%`,
                background: "var(--primary)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span
            className="w-20 shrink-0 text-right text-xs font-medium font-data"
            style={{ color: "var(--text)" }}
          >
            {fmt(value)} t
          </span>
        </div>
      ))}
    </div>
  );
}

export function ComplianceTracker({
  steps,
  currentIndex,
}: {
  steps: string[];
  currentIndex: number;
}) {
  return (
    <div className="flex items-start">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold border-2 transition-all"
                style={{
                  borderColor: done || active ? "var(--primary)" : "var(--track-bg)",
                  background: done ? "var(--primary)" : active ? "var(--surface)" : "var(--track-bg)",
                  color: done ? "#fff" : active ? "var(--primary)" : "var(--text-muted)",
                }}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className="mt-1 max-w-[56px] text-center text-[9px] leading-tight"
                style={{
                  color: active ? "var(--primary)" : "var(--text-muted)",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="mb-5 h-0.5 flex-1"
                style={{
                  background: i < currentIndex ? "var(--primary)" : "var(--track-bg)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CO2eBox({ label, tons }: { label: string; tons: number }) {
  return (
    <div
      className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm"
      style={{ background: "var(--primary-tint)" }}
    >
      <span className="font-medium" style={{ color: "var(--primary)" }}>
        {label}
      </span>
      <span className="font-semibold font-data" style={{ color: "var(--primary)" }}>
        {tons.toLocaleString("en-US", { maximumFractionDigits: 2 })} tCO2e
      </span>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold font-display" style={{ color: "var(--text)" }}>
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex cursor-help">
      <span
        className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ background: "var(--track-bg)", color: "var(--text-muted)" }}
      >
        i
      </span>
      <span className="invisible absolute bottom-5 left-1/2 z-10 w-64 -translate-x-1/2 rounded-xl bg-canopy-text p-3 text-xs text-white shadow-lg group-hover:visible"
        style={{ background: "var(--text)" }}>
        {text}
      </span>
    </span>
  );
}

export function BackLink({ href = "/dashboard", label = "Back to dashboard" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-block text-sm font-medium no-print transition-opacity hover:opacity-70"
      style={{ color: "var(--primary)" }}
    >
      ← {label}
    </Link>
  );
}
