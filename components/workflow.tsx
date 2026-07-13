import Link from "next/link";
import type { WorkflowStatus } from "@/lib/client-status";
import { STATUS_META } from "@/lib/client-status";

const TONE_STYLE: Record<string, React.CSSProperties> = {
  warning: { background: "var(--warning-tint)", color: "var(--warning-strong)", border: "1px solid var(--warning-border)" },
  primary: { background: "var(--primary-tint)", color: "var(--primary)", border: "1px solid var(--chip-border)" },
  danger: { background: "var(--danger-tint)", color: "var(--danger)", border: "1px solid var(--danger-border)" },
  success: { background: "var(--success-bg)", color: "var(--success-text)", border: "1px solid var(--success-border)" },
  neutral: { background: "var(--track-bg)", color: "var(--text-muted)", border: "1px solid var(--divider)" },
};

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ ...TONE_STYLE[meta.tone], fontFamily: "var(--font-data), monospace" }}
    >
      {meta.label}
    </span>
  );
}

/** Completeness meter (6.7) — reused on dashboard, client detail, and digest. */
export function CompletenessMeter({ percent, label, compact = false }: { percent: number; label?: string; compact?: boolean }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={compact ? "flex items-center gap-2" : ""}>
      {label && !compact && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span style={{ color: "var(--text-muted)" }}>{label}</span>
          <span className="font-data font-semibold" style={{ color: "var(--text)" }}>{clamped}%</span>
        </div>
      )}
      <div className="track" style={{ height: compact ? 6 : 8, width: compact ? 72 : undefined }}>
        <div className="fill" style={{ width: `${Math.max(clamped, 2)}%` }} />
      </div>
      {compact && (
        <span className="font-data text-xs font-semibold" style={{ color: "var(--text)" }}>{clamped}%</span>
      )}
    </div>
  );
}

/** Dashboard stat card (#19) — Overdue / Ready to review / Awaiting response. */
export function StatCard({ label, value, href, active = false, tone = "neutral" }: {
  label: string;
  value: number;
  href?: string;
  active?: boolean;
  tone?: "warning" | "primary" | "danger" | "neutral";
}) {
  const valueColor =
    value === 0 ? "var(--text-muted)"
    : tone === "danger" ? "var(--danger)"
    : tone === "warning" ? "var(--warning-strong)"
    : tone === "primary" ? "var(--primary)"
    : "var(--text)";
  const body = (
    <div
      className="card-inner transition-shadow"
      style={active ? { borderColor: "var(--emerald)", boxShadow: "0 0 0 2px rgba(16,185,129,0.18)" } : undefined}
    >
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-data text-3xl font-bold" style={{ color: valueColor }}>{value}</p>
    </div>
  );
  return href ? <Link href={href} className="block transition-transform hover:-translate-y-0.5">{body}</Link> : body;
}

export function BackLink({ href = "/consultant", label = "Dashboard" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-block text-sm font-medium transition-opacity hover:opacity-70"
      style={{ color: "var(--primary)" }}
    >
      ← {label}
    </Link>
  );
}

/** Mono usage-context line under page titles — mirrors the wireframes' annotations. */
export function UsageNote({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mt-1" style={{ color: "var(--text-muted)" }}>{children}</p>;
}
