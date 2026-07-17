"use client";

/**
 * Custom cursor — a signal dot with a trailing ring.
 *  - over links/buttons: the ring swells
 *  - over a [data-cursor-view] target (project rows): the ring morphs into a
 *    filled amber disc carrying a label ("VIEW" / "OPEN") — the Lusion/Larose
 *    "view" state.
 * Fine-pointer devices only; disabled for touch & reduced-motion.
 */

import { useEffect, useRef } from "react";
import { gsap } from "@/animations/gsap";
import styles from "./Cursor.module.css";

const HOVER_SELECTOR = "a, button, [data-cursor-hover]";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!fine || reduced || !dot || !ring || !label) return;

    document.body.dataset.cursor = "on";

    const setDotX = gsap.quickSetter(dot, "x", "px");
    const setDotY = gsap.quickSetter(dot, "y", "px");
    const ringX = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3.out" });

    let visible = false;

    const onMove = (e: PointerEvent) => {
      if (!visible) {
        visible = true;
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
      }
      setDotX(e.clientX);
      setDotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const onOver = (e: PointerEvent) => {
      const el = e.target as HTMLElement;
      const view = el.closest<HTMLElement>("[data-cursor-view]");
      if (view) {
        label.textContent = view.dataset.cursorView || "View";
        ring.classList.add(styles.view);
        gsap.to(ring, { scale: 1, opacity: 1, duration: 0.4, ease: "power3.out" });
        gsap.to(dot, { opacity: 0, duration: 0.2 });
        return;
      }
      ring.classList.remove(styles.view);
      const hover = el.closest(HOVER_SELECTOR);
      gsap.to(ring, {
        scale: hover ? 2.1 : 1,
        opacity: hover ? 0.45 : 1,
        duration: 0.35,
        ease: "power3.out",
      });
      gsap.to(dot, { opacity: 1, duration: 0.2 });
    };

    const onLeave = () => {
      visible = false;
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.3 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      delete document.body.dataset.cursor;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden="true">
      <div ref={dotRef} className={styles.dot} />
      <div ref={ringRef} className={styles.ring}>
        <div ref={labelRef} className={styles.label} />
      </div>
    </div>
  );
}
