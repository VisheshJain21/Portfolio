"use client";

/**
 * Process (SOP §4.5) — a real sequence, so the numbering carries
 * information. Steps rise in with a stagger.
 */

import { useEffect, useRef } from "react";
import { revealUp } from "@/animations/reveals";
import { processSteps } from "@/content/site";
import { registerAnchor } from "@/lib/section-anchors";
import styles from "./Process.module.css";

export default function Process() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    registerAnchor("process", root);
    return () => registerAnchor("process", null);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const items = root.querySelectorAll<HTMLElement>(`.${styles.step}`);
    revealUp(items, root, { stagger: 0.14, y: 40 });
  }, []);

  return (
    <section ref={rootRef} className={`section section--tight ${styles.section}`} aria-label="How I work">
      <div className="shell">
        <p className="eyebrow">Approach</p>
        <h2 className={`display ${styles.heading}`}>
          How a system
          <br />
          earns <em>trust.</em>
        </h2>
        <ol className={styles.grid}>
          {processSteps.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className={styles.title}>{step.title}</h3>
              <p className={styles.body}>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
