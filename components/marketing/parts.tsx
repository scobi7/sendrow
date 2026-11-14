import Link from "next/link";
import type { ReactNode } from "react";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";
import m from "./marketing.module.css";

/** Every marketing and legal page: shared nav, the page, shared footer. Direction 4c, same as the homepage. */
export function MarketingPage({ children }: { children: ReactNode }) {
  return (
    <div className={m.page}>
      <LandingNav />
      <main>{children}</main>
      <LandingFooter />
    </div>
  );
}

/** The page's one headline, pulled left, with an optional lede and actions under it. */
export function PageHead({ title, lede, children }: { title: ReactNode; lede?: ReactNode; children?: ReactNode }) {
  return (
    <header className={`${m.wrap} ${m.head}`}>
      <h1 className={m.h1}>{title}</h1>
      {lede ? <p className={m.lede}>{lede}</p> : null}
      {children ? <div className={`${m.actions} ${m.headActions}`}>{children}</div> : null}
    </header>
  );
}

/** A page section. `rule` puts a hairline above it; `intro` sits under the heading in muted ink. */
export function Section({
  title,
  intro,
  id,
  rule,
  children,
}: {
  title?: ReactNode;
  intro?: ReactNode;
  id?: string;
  rule?: boolean;
  children?: ReactNode;
}) {
  return (
    <section id={id} className={`${m.wrap} ${rule ? m.sectionRule : m.section}`}>
      {title ? <h2 className={m.h2}>{title}</h2> : null}
      {intro ? <p className={m.intro}>{intro}</p> : null}
      {children ? <div className={title || intro ? m.body : undefined}>{children}</div> : null}
    </section>
  );
}

/** Full-width tinted band (the homepage's second layer). Put Sections inside it. */
export function Band({ children }: { children: ReactNode }) {
  return <div className={m.band}>{children}</div>;
}

/** White sheet. `layered` adds a tint sheet behind it, peeking above, like the homepage's portal. */
export function Sheet({ children, layered, className }: { children: ReactNode; layered?: boolean; className?: string }) {
  const sheet = <div className={`${m.sheet} ${layered ? m.layered : ""} ${className ?? ""}`}>{children}</div>;
  return layered ? <div className={m.layeredWrap}>{sheet}</div> : sheet;
}

/** Link styled as a button. One primary per screen. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  external?: boolean;
}) {
  const cls = `${m.btn} ${variant === "primary" ? m.btnPrimary : m.btnSecondary}`;
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** Closing call to action at the bottom of a page. */
export function Close({ title, children, actions }: { title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={`${m.wrap} ${m.close}`}>
      <h2 className={m.h2}>{title}</h2>
      {children ? <p>{children}</p> : null}
      {actions ? <div className={m.actions}>{actions}</div> : null}
    </section>
  );
}

/** Class names for page-specific layouts: steps, rows, split, prose, meta, link, h3, stepH, muted, btn. */
export const mk = m;
