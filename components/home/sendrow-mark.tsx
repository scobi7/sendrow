/** The Sendrow mark, drawn exactly as in the approved design. Square uses ink, bars and dots use the page background. */
export function SendrowMark({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ flex: "none", display: "block" }}
    >
      <rect width="100" height="100" rx="36" style={{ fill: "var(--text)" }} />
      <path d="M33,23 L67,23 L67,35 L19,35 L19,32 A14,9 0 0 1 33,23 Z" style={{ fill: "var(--bg)" }} />
      <circle cx="79" cy="29" r="6" style={{ fill: "var(--bg)" }} />
      <path d="M19,44 L67,44 A14,9 0 0 1 81,53 L81,56 L33,56 A14,9 0 0 1 19,47 L19,44 Z" style={{ fill: "var(--bg)" }} />
      <circle cx="21" cy="71" r="6" style={{ fill: "var(--bg)" }} />
      <path d="M33,65 L81,65 L81,68 A14,9 0 0 1 67,77 L33,77 L33,65 Z" style={{ fill: "var(--bg)" }} />
    </svg>
  );
}
