export function Logo() {
  return (
    <span
      className="flex items-center gap-2 text-xl font-extrabold font-display tracking-tight"
      style={{ color: "var(--text)" }}
    >
      <SendrowMark />
      Sendrow
    </span>
  );
}

function SendrowMark() {
  return (
    <svg
      aria-hidden
      width={32}
      height={32}
      viewBox="0 0 100 100"
      className="shrink-0"
      style={{ borderRadius: 8, boxShadow: "0 10px 30px rgba(34,197,94,0.28)" }}
    >
      <defs>
        <linearGradient id="sendrow-mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--green)" />
          <stop offset="1" stopColor="var(--teal)" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="24" fill="url(#sendrow-mark-g)" />
      {/* Top bar - rounded top-left only, a long diagonal sweep into the corner */}
      <path d="M33,23 L67,23 L67,35 L19,35 L19,32 A14,9 0 0 1 33,23 Z" fill="#fff" />
      <circle cx="79" cy="29" r="6" fill="#fff" />
      {/* Middle bar - rounded top-right + bottom-left, carrying the curve through */}
      <path d="M19,44 L67,44 A14,9 0 0 1 81,53 L81,56 L33,56 A14,9 0 0 1 19,47 L19,44 Z" fill="#fff" />
      <circle cx="21" cy="71" r="6" fill="#fff" />
      {/* Bottom bar - rounded bottom-right only, the S's exit point */}
      <path d="M33,65 L81,65 L81,68 A14,9 0 0 1 67,77 L33,77 L33,65 Z" fill="#fff" />
    </svg>
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
      <span className="invisible absolute bottom-5 left-1/2 z-10 w-64 -translate-x-1/2 rounded-xl p-3 text-xs text-white shadow-lg group-hover:visible"
        style={{ background: "var(--text)" }}>
        {text}
      </span>
    </span>
  );
}

