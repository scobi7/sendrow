import Link from "next/link";
import { Logo } from "./ui";

/** "default": light footer with the full product and legal link set (marketing pages).
 *  "ink": the dark homepage band - tagline, short link row, no margin above. */
export function LandingFooter({ variant = "default" }: { variant?: "default" | "ink" }) {
  const year = new Date().getFullYear();
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "contact@sendrow.app";

  if (variant === "ink") {
    return (
      <footer className="px-6 py-14" style={{ background: "var(--ink-band)" }}>
        <div className="mx-auto max-w-4xl">
          <p className="font-display text-xl font-semibold leading-snug" style={{ color: "var(--ink-band-text)" }}>
            One audited inventory in.
            <br />
            Every buyer and regulator format out.
          </p>
          <div
            className="mt-8 flex flex-wrap items-center justify-between gap-6"
            style={{ borderTop: "1px solid rgba(233,239,233,0.15)", paddingTop: "1.5rem" }}
          >
            <span className="font-display text-base font-bold" style={{ color: "var(--ink-band-text)" }}>
              Sendrow
            </span>
            <p className="text-xs" style={{ color: "rgba(233,239,233,0.45)" }}>
              &copy; {year} Sendrow. Built in California.
            </p>
            <div className="flex gap-6">
              {[
                ["Sign in", "/login"],
                ["Request demo", "/demo"],
                ["Security", "/security"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs transition-opacity hover:opacity-80"
                  style={{ color: "rgba(233,239,233,0.6)" }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  }

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
              The one organized place where a supplier's emissions information lives: collected once, kept with proof attached, shared in any format asked.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Product</p>
              <ul className="mt-3 space-y-2">
                {[
                  ["How it works", "/how-it-works"],
                  ["For consultants", "/for-consultants"],
                  ["Get matched (companies)", "/get-matched"],
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
                  ["Security", "/security"],
                  ["DPA template", "/dpa"],
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
