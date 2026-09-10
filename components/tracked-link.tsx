"use client";

import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";
import { track } from "@/lib/track-client";

export function TrackedLink({
  event,
  children,
  className,
  style,
  ...linkProps
}: LinkProps & { event: string; children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <Link {...linkProps} className={className} style={style} onClick={() => track(event)}>
      {children}
    </Link>
  );
}
