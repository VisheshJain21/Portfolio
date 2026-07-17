"use client";

/**
 * Experience — a real timeline (added 2026-07-16, ref: AI-engineer
 * portfolio pattern). Critical for a fresher: shows genuine work history.
 * Vertical rail with amber node markers; entries rise in on scroll.
 */

import { useEffect, useRef } from "react";
import { revealUp, drawHairline } from "@/animations/reveals";
import { experience } from "@/content/site";
import styles from "./Experience.module.css";

export default function Experience() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const items = root.querySelectorAll<HTMLElement>(`.${styles.item}`);
    items.forEach((el) => revealUp(el, el, { y: 34, start: "top 82%" }));
    const rail = root.querySelector<HTMLElement>(`.${styles.rail}`);
    if (rail) drawHairline(rail);
  }, []);

  return (
    <section ref={rootRef} className={`section ${styles.section}`} id="experience" aria-label="Experience">
      <div className="shell">
        <p className="eyebrow">Experience</p>
        <h2 className={`display ${styles.heading}`}>
          The <em>track record.</em>
        </h2>

        <ol className={styles.timeline}>
          <span className={styles.rail} aria-hidden="true" />
          {experience.map((e) => (
            <li key={e.role} className={styles.item}>
              <span className={styles.node} aria-hidden="true" />
              <div className={styles.head}>
                <h3 className={styles.role}>{e.role}</h3>
                <span className={styles.period}>{e.period}</span>
              </div>
              <p className={styles.org}>
                {e.org}
                {e.confidential && <span className={styles.badge}>Confidential</span>}
              </p>
              <p className={styles.body}>{e.body}</p>
              <div className={styles.tags}>
                {e.tags.map((t) => (
                  <span key={t} className={styles.tag}>
                    {t}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
