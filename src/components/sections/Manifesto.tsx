"use client";

/**
 * Manifesto — the "I" section (SOP §4.3).
 * One statement; words illuminate from faint to bone as the reader
 * scrolls through it (scrubbed, so it reverses naturally).
 */

import { useEffect, useRef } from "react";
import { gsap } from "@/animations/gsap";
import { manifesto } from "@/content/site";
import { registerAnchor } from "@/lib/section-anchors";
import styles from "./Manifesto.module.css";

export default function Manifesto() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    registerAnchor("manifesto", root);
    return () => registerAnchor("manifesto", null);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const words = root.querySelectorAll<HTMLElement>(`.${styles.word}`);
    const anim = gsap.fromTo(
      words,
      { color: "var(--bone-faint)" },
      {
        color: "var(--bone)",
        stagger: 0.06,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top 72%",
          end: "bottom 45%",
          scrub: 0.6,
        },
      },
    );
    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []);

  return (
    <section ref={rootRef} className={`section section--tight ${styles.section}`} aria-label="Manifesto">
      <div className="shell">
        <p className="eyebrow">{manifesto.eyebrow}</p>
        <p className={`display ${styles.statement}`}>
          {manifesto.text.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} className={styles.word}>
              {word}{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
