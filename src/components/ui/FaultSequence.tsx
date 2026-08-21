"use client";

/**
 * FaultSequence — the signature "the system can glitch, and it heals
 * itself" moment. Fires once per session, exactly as the Safety-Critical
 * Ops project row ([data-fault-trigger] in Work.tsx) scrolls into view —
 * the one project literally engineered fail-closed around "one wrong
 * retry permanently locks the account." The page visibly glitches, then
 * self-heals, right next to the project that's about doing exactly that.
 *
 * Two effects share one clock (lib/fault-bus.ts's FAULT_DURATION_MS):
 * SpineLayer lerps its own color by polling faultFX in its per-frame
 * loop, while this component drives the DOM-side beats — a quick
 * opacity-flicker on a small full-viewport overlay (interference via
 * pure opacity keyframes, not a pixel-distortion filter: an early build
 * reused WarpCut's `#warp-turb` SVG turbulence filter here, but even
 * applied to a simple flat div rather than real page content, the
 * filter's first-ever GPU compile cost still occasionally landed inside
 * the scroll-perf test's measured window — not worth the risk for a
 * bonus flourish), a `.is-fault` class on <body> that swaps
 * --signal/--glow to --fault/--fault-glow for every component already
 * reading those tokens, and a small caption portaled into the trigger
 * row so it's positioned by normal layout.
 *
 * Fully skipped under prefers-reduced-motion, consistent with every
 * other motion-heavy moment in this project.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, ScrollTrigger } from "@/animations/gsap";
import { triggerFault, FAULT_DURATION_MS } from "@/lib/fault-bus";
import { playSignal } from "@/lib/sound";
import styles from "./FaultSequence.module.css";

const SESSION_KEY = "vj:fault-seen";

export default function FaultSequence() {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const el = document.querySelector<HTMLElement>("[data-fault-trigger]");
    if (el) setPortalTarget(el);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const caption = captionRef.current;
    const overlay = overlayRef.current;
    if (reduced || !portalTarget || !caption || !overlay) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const st = ScrollTrigger.create({
      trigger: portalTarget,
      start: "top 60%",
      once: true,
      onEnter: () => {
        sessionStorage.setItem(SESSION_KEY, "1");
        triggerFault();
        const s = FAULT_DURATION_MS / 1000;

        gsap
          .timeline()
          .add(() => {
            document.body.classList.add("is-fault");
          }, 0)
          // A quick stutter of opacity keyframes reads as interference
          // without any pixel-distortion filter — cheap regardless of
          // page content, no GPU-compile risk.
          .set(overlay, { autoAlpha: 0 }, 0)
          .to(overlay, { autoAlpha: 0.55, duration: 0.05 }, 0)
          .to(overlay, { autoAlpha: 0.08, duration: 0.06 }, 0.07)
          .to(overlay, { autoAlpha: 0.45, duration: 0.05 }, 0.15)
          .to(overlay, { autoAlpha: 0, duration: 0.3 }, 0.22)
          .fromTo(caption, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.15)
          .add(playSignal, s * 0.55)
          .to(caption, { autoAlpha: 0, y: -6, duration: 0.4 }, s * 0.55)
          .add(() => {
            document.body.classList.remove("is-fault");
          }, s * 0.95);
      },
    });

    return () => st.kill();
  }, [portalTarget]);

  return (
    <>
      <div ref={overlayRef} className={styles.overlay} aria-hidden="true" />
      {portalTarget &&
        createPortal(
          <p ref={captionRef} className={`mono-label ${styles.caption}`} aria-live="polite">
            fault detected → self-healed in 0.8s
          </p>,
          portalTarget,
        )}
    </>
  );
}
