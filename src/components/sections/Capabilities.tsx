"use client";

/**
 * Capabilities / Tech Stack (SOP §4.6, upgraded 2026-07-16 to a
 * categorized grid, ref: AI-engineer portfolio pattern). Grouped skills
 * with subtle depth bars (no loud numbers), plus a slim ambient marquee.
 * Bars animate their width on scroll-in.
 */

import { useEffect, useRef } from "react";
import { gsap, EASE } from "@/animations/gsap";
import { revealUp } from "@/animations/reveals";
import { techStack, capabilities } from "@/content/site";
import { registerAnchor } from "@/lib/section-anchors";
import styles from "./Capabilities.module.css";

function Marquee({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const row = [...items, ...items];
  return (
    <div className={styles.marquee} aria-hidden="true">
      <div className={`${styles.track} ${reverse ? styles.reverse : ""}`}>
        {row.map((item, i) => (
          <span key={`${item}-${i}`} className={styles.mItem}>
            {item}
            <span className={styles.sep}>/</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Capabilities() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    registerAnchor("capabilities", root);
    return () => registerAnchor("capabilities", null);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const groups = root.querySelectorAll<HTMLElement>(`.${styles.group}`);
    if (!reduced) revealUp(groups, root, { stagger: 0.1, y: 30, start: "top 78%" });

    // Animate depth bars from 0 → their data-level width.
    const bars = root.querySelectorAll<HTMLElement>(`.${styles.barFill}`);
    bars.forEach((bar) => {
      const level = Number(bar.dataset.level) || 0;
      if (reduced) {
        bar.style.transform = `scaleX(${level / 100})`;
        return;
      }
      gsap.fromTo(
        bar,
        { scaleX: 0 },
        {
          scaleX: level / 100,
          duration: 1.2,
          ease: EASE,
          scrollTrigger: { trigger: bar, start: "top 92%", once: true },
        },
      );
    });
  }, []);

  return (
    <section ref={rootRef} className={`section section--tight ${styles.section}`} id="stack" aria-label="Tech stack">
      <div className="shell">
        <p className="eyebrow">Tech Stack</p>
        <h2 className={`display ${styles.heading}`}>
          The tools behind
          <br />
          the <em>autonomy.</em>
        </h2>

        <div className={styles.grid}>
          {techStack.map((cat) => (
            <div key={cat.group} className={styles.group}>
              <h3 className={styles.groupTitle}>{cat.group}</h3>
              <ul className={styles.skills}>
                {cat.skills.map((s) => (
                  <li key={s.name} className={styles.skill}>
                    <span className={styles.skillName}>{s.name}</span>
                    <span
                      className={styles.bar}
                      role="meter"
                      aria-valuenow={s.level}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${s.name} proficiency`}
                    >
                      <span className={styles.barFill} data-level={s.level} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.rows}>
        <Marquee items={capabilities.marquee.slice(0, 4)} />
        <Marquee items={capabilities.marquee.slice(4)} reverse />
      </div>
    </section>
  );
}
