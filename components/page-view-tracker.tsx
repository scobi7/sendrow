"use client";

import { useEffect } from "react";
import { track } from "@/lib/track-client";

/** Invisible - fires one page_view beacon on mount. Lives at the top of the
 *  homepage so a server component (app/page.tsx) can stay a server component. */
export function PageViewTracker() {
  useEffect(() => {
    track("page_view");
  }, []);
  return null;
}
