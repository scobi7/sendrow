"use client";

import { useTheme } from "./theme-provider";

const OPTIONS = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark",  label: "Dark",  icon: "🌙" },
  { value: "system",label: "System",icon: "💻" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex rounded-lg border p-1" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
      {OPTIONS.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all"
          style={
            theme === value
              ? { background: "var(--surface)", color: "var(--text-1)", boxShadow: "0 1px 3px rgb(0 0 0 / 0.1)" }
              : { color: "var(--text-3)" }
          }
        >
          <span>{icon}</span>
          {label}
        </button>
      ))}
    </div>
  );
}
