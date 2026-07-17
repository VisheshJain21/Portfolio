"use client";

/**
 * Hero — the instrument (SOP §4.2).
 * Masked serif headline over the living agentic graph; the intro
 * timeline fires the moment the preloader wipes.
 */

import { useEffect, useRef } from "react";
import { gsap, EASE } from "@/animations/gsap";
import { onSiteReady } from "@/lib/site-ready";
import { identity } from "@/content/site";
import HeroSceneGate from "@/webgl/HeroSceneGate";
import styles from "./Hero.module.css";

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lines = root.querySelectorAll<HTMLElement>(".line-mask > .line-inner");
    const fades = root.querySelectorAll<HTMLElement>("[data-hero-fade]");
    gsap.set(lines, { yPercent: 115 });
    gsap.set(fades, { autoAlpha: 0, y: 22 });

    return onSiteReady(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE } });
      tl.to(lines, { yPercent: 0, duration: 1.25, stagger: 0.12 }, 0.1)
        .to(fades, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12 }, 0.55);
    });
  }, []);

  return (
    <section ref={rootRef} className={styles.hero} id="top" aria-label="Introduction">
      <HeroSceneGate />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={`shell ${styles.inner}`}>
        <p className="eyebrow" data-hero-fade>
          {identity.role} — Portfolio
        </p>
        <h1 className={`display ${styles.title}`}>
          {identity.headline.map((line, i) => (
            <span className="line-mask" key={line}>
              <span className="line-inner">
                {i === identity.headline.length - 1 ? <em>{line}</em> : line}
              </span>
            </span>
          ))}
        </h1>
        <p className={styles.sub} data-hero-fade>
          {identity.sub}
        </p>
        <dl className={styles.coords} data-hero-fade>
          <div>
            <dt>Focus</dt>
            <dd>Agents · Automation · AI vision</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{identity.availability}</dd>
          </div>
          <div>
            <dt>Based</dt>
            <dd>{identity.location}</dd>
          </div>
        </dl>
      </div>
      <div className={styles.scrollcue} data-hero-fade aria-hidden="true">
        <span className={styles.scrollbar} />
        Scroll to explore
      </div>
    </section>
  );
}
