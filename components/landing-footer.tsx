import Link from "next/link";
import { Logo } from "./ui";

export function LandingFooter() {
  const year = new Date().getFullYear();
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "contact@sendrow.app";

  return (
    <footer
      className="mt-24 border-t"
      style={{ borderColor: "var(--divider)", background: "var(--surface)" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              GHG emissions reporting for SMBs and ESG consultants. Scope 1, 2, and 3 — automated.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Product</p>
              <ul className="mt-3 space-y-2">
                {[
                  ["For companies", "/for-companies"],
                  ["For consultants", "/for-consultants"],
                  ["Pricing", "/pricing"],
                  ["Request a demo", "/demo"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Legal</p>
              <ul className="mt-3 space-y-2">
                {[
                  ["Terms of Service", "/terms"],
                  ["Privacy Policy", "/privacy"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a href={`mailto:${support}`} className="text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-muted)" }}>
                    {support}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-6" style={{ borderColor: "var(--divider)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © {year} Sendrow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
