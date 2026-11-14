import styles from "@/app/home.module.css";
import { penScript } from "./fonts";

/** A handwritten note with its hand-drawn arrow. Draws once on arrival; nothing moves with reduced motion. */
export function PenNote({
  text,
  className,
  children,
}: {
  text: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`${styles.note} ${penScript.className} ${className ?? ""}`}>
      <span className={styles.noteText}>{text}</span>
      {children}
    </div>
  );
}

/** The hand-drawn arrow. `d` is the path, `w` and `h` its box. */
export function Arrow({ d, w, h, className }: { d: string; w: number; h: number; className?: string }) {
  return (
    <svg
      className={`${styles.arrow} ${className ?? ""}`}
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      aria-hidden="true"
      focusable="false"
    >
      <path pathLength={1} d={d} />
    </svg>
  );
}
