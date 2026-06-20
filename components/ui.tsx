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


const SCOPE_COLORS = ["var(--scope1)", "var(--scope2)", "var(--scope3)"];

export function ScopeBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  return (
    <div className="space-y-4">
      {data.map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {label}
          </span>
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--track-bg)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(value / max) * 100}%`,
                background: SCOPE_COLORS[i] ?? "var(--primary)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span
            className="w-16 shrink-0 text-right text-xs font-semibold font-data"
            style={{ color: "var(--text)" }}
          >
            {fmt(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ScopeDonutChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const r = 46;
  const sw = 16;
  const C = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

  let accumulated = 0;
  const segments = data.map((d, i) => {
    const len = (d.value / total) * C;
    const seg = { len, offset: accumulated, color: SCOPE_COLORS[i] ?? "var(--primary)" };
    accumulated += len;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-5">
      <svg viewBox="0 0 120 120" width="148" height="148">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--track-bg)" strokeWidth={sw} />
        <g transform="rotate(-90 60 60)">
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="60" cy="60" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={sw}
              strokeDasharray={`${seg.len} ${C - seg.len}`}
              strokeDashoffset={-seg.offset}
            />
          ))}
        </g>
        <text x="60" y="55" textAnchor="middle" fontSize="8" fill="var(--text-muted)">Total</text>
        <text x="60" y="70" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">
          {fmt(data.reduce((s, d) => s + d.value, 0))} t
        </text>
      </svg>
      <div className="w-full space-y-2.5">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: SCOPE_COLORS[i] }} />
              {d.label}
            </div>
            <span className="text-xs font-semibold font-data" style={{ color: "var(--text)" }}>
              {fmt(d.value)} t
            </span>
          </div>
        ))}
      </div>
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
                  background: done ? "var(--primary)" : active ? "#ffffff" : "var(--track-bg)",
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

