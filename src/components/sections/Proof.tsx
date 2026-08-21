"use client";

/**
 * Proof — the signature stat band (added 2026-07-16: distinctiveness pass).
 * Huge, cropped-scale numbers pulled straight from the real project set.
 * The Lusion lesson applied honestly: oversized numerals as a hero moment,
 * but built from YOUR evidence, not decoration.
 */

import { useEffect, useRef } from "react";
import { gsap, EASE } from "@/animations/gsap";
import { proofStats } from "@/content/site";
import { registerAnchor } from "@/lib/section-anchors";
import styles from "./Proof.module.css";

export default function Proof() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    registerAnchor("proof", root);
    return () => registerAnchor("proof", null);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cells = root.querySelectorAll<HTMLElement>(`.${styles.cell}`);
    if (reduced) return;

    gsap.fromTo(
      cells,
      { autoAlpha: 0, y: 60 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        ease: EASE,
        stagger: 0.12,
        scrollTrigger: { trigger: root, start: "top 75%", once: true },
      },
    );
  }, []);

  return (
    <section ref={rootRef} className={styles.section} id="proof" aria-label="Track record">
      <div className={`shell ${styles.grid}`}>
        {proofStats.map((s) => (
          <div key={s.label} className={styles.cell} data-glow-cell>
            <span className={styles.value}>
              {s.value}
              <span className={styles.unit}>{s.unit}</span>
            </span>
            <span className={styles.label}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
