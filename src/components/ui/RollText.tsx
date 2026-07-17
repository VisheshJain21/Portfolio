"use client";

/**
 * RollText — dual-layer character roll for hover states. Wrap the visual
 * label with this; any ancestor carrying `data-roll-trigger` drives the
 * roll on hover/focus-visible. The lower layer rises in the signal color
 * with a per-character stagger. Pure CSS motion; degrades to a plain
 * color swap under prefers-reduced-motion.
 * The spans are aria-hidden — the trigger element must carry the
 * accessible name (e.g. aria-label).
 */

import type { CSSProperties } from "react";
import styles from "./RollText.module.css";

type Props = {
  text: string;
  className?: string;
};

export default function RollText({ text, className }: Props) {
  return (
    <span className={`${styles.roll} ${className ?? ""}`} aria-hidden="true">
      {Array.from(text).map((ch, i) => (
        <span key={i} className={styles.char} style={{ "--i": i } as CSSProperties}>
          <span className={styles.top}>{ch}</span>
          <span className={styles.under}>{ch}</span>
        </span>
      ))}
    </span>
  );
}
