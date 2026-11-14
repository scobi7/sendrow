"use client";

import { useEffect, useRef } from "react";
import styles from "@/app/home.module.css";

/**
 * The tinted band starts halfway down the example dashboard and runs on under the worked examples.
 * Its top is measured from the dashboard frame (data-frame), so it follows the frame at every width.
 */
export function BandZone({ children }: { children: React.ReactNode }) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const zone = zoneRef.current;
    const band = bandRef.current;
    const frame = zone?.querySelector<HTMLElement>("[data-frame]");
    if (!zone || !band || !frame) return;

    const place = () => {
      const zoneTop = zone.getBoundingClientRect().top;
      const f = frame.getBoundingClientRect();
      band.style.top = `${Math.round(f.top - zoneTop + f.height / 2)}px`;
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(zone);
    observer.observe(frame);
    document.fonts?.ready.then(place).catch(() => undefined);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={zoneRef} className={styles.bandZone}>
      <div ref={bandRef} className={styles.band} aria-hidden="true" />
      {children}
    </div>
  );
}
