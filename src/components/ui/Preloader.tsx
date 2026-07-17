"use client";

/**
 * Preloader — bare-corner-counter loader (Lusion loader *mechanic*, our
 * brand; no copied assets/copy). Pure-black screen, a single percentage
 * counter pinned bottom-left, counting 0→100 in uneven increments that
 * slow near the end so it reads like real load progress rather than a
 * fake bar. Progress is still gated on actual readiness (fonts + window
 * load), holding shy of 100 until the page is truly ready.
 *
 * Exit (<~450ms): counter fades → "VJ" pops in large & centered → scales
 * down and flies to the nav wordmark's resting position (top-left) →
 * black clears onto the now-interactive hero. `signalSiteReady()` fires
 * as the exit begins, which is what un-pauses the canvas Gates and lets
 * their ResumeKick call invalidate() — so WebGL never renders behind the
 * black screen and resumes exactly on cue.
 *
 * Transform/opacity only. Session-gated (once per visit). Reduced motion:
 * straight cut, no counter/scale/translate.
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/animations/gsap";
import { signalSiteReady } from "@/lib/site-ready";
import styles from "./Preloader.module.css";

const MIN_MS = 1400; // never flash-skip the count
const MAX_MS = 5000; // never hold the user hostage

const SESSION_KEY = "vj:preloaded";
const seen = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};
const markSeen = () => {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* private mode — replays next load, harmless */
  }
};

export default function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const vjWrapRef = useRef<HTMLDivElement>(null);
  const vjRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || seen()) {
      markSeen();
      signalSiteReady();
      setDone(true);
      return;
    }

    const start = performance.now();
    let assetsReady = false;
    let exited = false;
    let value = 0;
    let timer: number | undefined;

    Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((res) =>
            window.addEventListener("load", () => res(), { once: true }),
          ),
    ]).then(() => {
      assetsReady = true;
    });

    const render = (v: number) => {
      if (numRef.current) numRef.current.textContent = String(Math.round(v));
      if (barRef.current) barRef.current.style.transform = `scaleX(${v / 100})`;
    };

    // — Uneven, decelerating counter — steps of random size on random
    //   delays; plateaus below 100 until real readiness, slows past 85. —
    const tick = () => {
      if (exited) return;
      const elapsed = performance.now() - start;
      const canFinish = assetsReady && elapsed >= MIN_MS;
      const ceiling = canFinish ? 100 : 92;

      if (value >= 100) {
        render(100);
        exit();
        return;
      }

      const room = ceiling - value;
      // Increment shrinks toward the ceiling; extra damping past 85.
      const base = value > 85 ? 0.6 : 1.4;
      const inc = base + Math.random() * Math.max(0.4, room * 0.22);
      value = Math.min(value + inc, ceiling);
      render(value);

      const delay =
        value > 85 ? 95 + Math.random() * 140 : 45 + Math.random() * 95;
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, 120);

    const exit = () => {
      if (exited) return;
      exited = true;

      const root = rootRef.current;
      const vj = vjRef.current;
      const brand = document.querySelector<HTMLElement>("[data-brand]");
      if (!root || !vj) {
        markSeen();
        signalSiteReady();
        setDone(true);
        return;
      }

      // Measure the VJ (centered) and the nav wordmark (top-left) rects
      // so the fly is an exact center→center translate + scale, whatever
      // the viewport size (getBoundingClientRect works on hidden nodes).
      const v = vj.getBoundingClientRect();
      let dx = -window.innerWidth * 0.36;
      let dy = -window.innerHeight * 0.42;
      let scale = 0.12;
      if (brand) {
        const b = brand.getBoundingClientRect();
        scale = b.height / v.height;
        dx = b.left + b.width / 2 - (v.left + v.width / 2);
        dy = b.top + b.height / 2 - (v.top + v.height / 2);
      }

      const tl = gsap.timeline({
        onComplete: () => {
          markSeen();
          setDone(true);
        },
      });

      tl.to([counterRef.current, trackRef.current], { autoAlpha: 0, duration: 0.1, ease: "power2.in" })
        // Un-pause the canvases as the exit begins (their ResumeKick →
        // invalidate); hero DOM intro also keys off this.
        .add(() => signalSiteReady(), 0.02)
        .set(vjWrapRef.current, { visibility: "visible" }, 0.06)
        .fromTo(
          vj,
          { autoAlpha: 0, scale: 1.08 },
          { autoAlpha: 1, scale: 1, duration: 0.12, ease: "power3.out" },
          0.06,
        )
        .to(vj, { x: dx, y: dy, scale, duration: 0.26, ease: "power3.inOut" }, 0.2)
        .to(vj, { autoAlpha: 0, duration: 0.12, ease: "power2.in" }, 0.36)
        .to(root, { autoAlpha: 0, duration: 0.14, ease: "power1.out" }, 0.34);
    };

    // Hidden-tab failsafe: timers throttle but still fire; if the count
    // stalls (backgrounded), release the site after the deadline.
    const hardStop = window.setTimeout(() => {
      if (exited) return;
      exited = true;
      markSeen();
      signalSiteReady();
      setDone(true);
    }, MAX_MS + 1500);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(hardStop);
    };
  }, []);

  if (done) return null;

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      {/* Slim centered progress bar (Lusion loader composition) */}
      <div ref={trackRef} className={styles.track}>
        <span ref={barRef} className={styles.bar} />
      </div>
      <div ref={counterRef} className={styles.counter}>
        <span ref={numRef}>0</span>
        <span className={styles.pct}>%</span>
      </div>
      <div ref={vjWrapRef} className={styles.vjWrap}>
        <span ref={vjRef} className={styles.vj}>
          VJ
        </span>
      </div>
      <noscript>
        <style>{`[data-preloader]{display:none!important}`}</style>
      </noscript>
    </div>
  );
}
