import Link from "next/link";
import { LandingBrand } from "./landing-nav";

const GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/for-consultants", label: "For consultants" },
      { href: "/get-matched", label: "Get matched" },
      { href: "/pricing", label: "Pricing" },
      { href: "/demo", label: "Book a demo" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/security", label: "Security" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/dpa", label: "DPA template" },
    ],
  },
];

/** Light footer with the full link set and contact email, shared by the homepage and marketing pages. */
export function LandingFooter() {
  const year = new Date().getFullYear();
  const support = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "contact@sendrow.app";

  return (
    <footer className="mt-24 px-4 py-12 sm:px-10 sm:py-14" style={{ background: "var(--bg)", borderTop: "1px solid var(--divider)", color: "var(--text)" }}>
      <div className="mx-auto flex max-w-[1320px] flex-col gap-10 sm:flex-row sm:justify-between sm:gap-16">
        <div>
          <Link href="/" aria-label="Sendrow, home">
            <LandingBrand />
          </Link>
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            Sendrow, {year}
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-8 sm:flex sm:gap-14">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                {g.title}
              </p>
              <ul className="mt-3 space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[15px] hover:underline hover:underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              Account
            </p>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link href="/login" className="text-[15px] hover:underline hover:underline-offset-4">
                  Sign in
                </Link>
              </li>
              <li>
                <a href={`mailto:${support}`} className="text-[15px] hover:underline hover:underline-offset-4">
                  {support}
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </footer>
  );
}
