"use client";

/**
 * About — the factual "who is this" (added 2026-07-16, ref: AI-engineer
 * portfolio pattern). Bio + engineering personality chips + a portrait
 * slot. Distinct from the poetic Manifesto: this one states the facts.
 */

import { useEffect, useRef } from "react";
import Image from "next/image";
import { revealLines, revealUp } from "@/animations/reveals";
import { about } from "@/content/site";
import styles from "./About.module.css";

const HAS_PORTRAIT = true; // public/images/about/portrait.jpg in place

export default function About() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    revealLines(root, { onScroll: true });
    const fades = root.querySelectorAll<HTMLElement>("[data-about-fade]");
    revealUp(fades, root, { stagger: 0.1, start: "top 72%" });
  }, []);

  return (
    <section ref={rootRef} className={`section ${styles.section}`} id="about" aria-label="About">
      <div className={`shell ${styles.grid}`}>
        <div className={styles.left}>
          <p className="eyebrow">{about.eyebrow}</p>
          <h2 className={`display ${styles.heading}`}>
            {about.heading.map((line, i) => (
              <span className="line-mask" key={line}>
                <span className="line-inner">
                  {i === about.heading.length - 1 ? <em>{line}</em> : line}
                </span>
              </span>
            ))}
          </h2>
          <ul className={styles.facts} data-about-fade>
            {about.facts.map((f) => (
              <li key={f} className={styles.fact}>
                <span className={styles.factDot} aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.right}>
          {/* Portrait — public/images/about/portrait.jpg; flip HAS_PORTRAIT
              above once the file is in place. Falls back to the mono slot
              so a missing asset never breaks the layout. */}
          <div className={styles.portrait} data-about-fade>
            {HAS_PORTRAIT ? (
              <Image
                src="/images/about/portrait.jpg"
                alt={`${about.eyebrow === "About" ? "Vishesh Jain" : "Portrait"}`}
                fill
                sizes="(max-width: 860px) 90vw, 40vw"
                className={styles.portraitImg}
                priority={false}
              />
            ) : (
              <>
                <span className={styles.portraitMono}>[ portrait ]</span>
                <span className={styles.portraitTag}>VJ — 001</span>
              </>
            )}
            {HAS_PORTRAIT && <span className={styles.portraitTag}>VJ — 001</span>}
          </div>
          <div className={styles.bio}>
            {about.bio.map((p, i) => (
              <p key={i} data-about-fade>
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
