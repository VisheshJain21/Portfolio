"use client";

/**
 * usePointerUniforms — tracks pointer position + hover intent relative to
 * a DOM card, written into a ref (never React state). Event handlers ONLY
 * set a target; the lerp toward that target happens in the caller's
 * useFrame (see DistortedImagePlane), keeping all per-frame math batched
 * to the render loop instead of firing on every raw mousemove.
 *
 * Fine pointers: hover follows pointerenter/leave, tracking the real
 * cursor continuously (the Lusion-style ripple-follows-cursor case).
 * Coarse/touch: there's no persistent hover state to lerp toward, so a
 * tap fires a one-shot ripple at the tap point that self-decays shortly
 * after (Prompt v3's touch fallback) instead of tracking drag position.
 */

import { useEffect, useRef } from "react";

const TAP_DECAY_MS = 650;

export function usePointerUniforms(domRef: React.RefObject<HTMLElement | null>) {
  const target = useRef({ x: 0.5, y: 0.5, hover: 0 });

  useEffect(() => {
    const el = domRef.current;
    if (!el) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const setUvFromEvent = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect();
      target.current.x = (clientX - r.left) / r.width;
      target.current.y = 1 - (clientY - r.top) / r.height; // DOM→UV Y flip
    };

    if (coarse) {
      let decayTimer: number | undefined;
      const onDown = (e: PointerEvent) => {
        setUvFromEvent(e.clientX, e.clientY);
        target.current.hover = 1;
        window.clearTimeout(decayTimer);
        decayTimer = window.setTimeout(() => {
          target.current.hover = 0;
        }, TAP_DECAY_MS);
      };
      el.addEventListener("pointerdown", onDown, { passive: true });
      return () => {
        el.removeEventListener("pointerdown", onDown);
        window.clearTimeout(decayTimer);
      };
    }

    const onMove = (e: PointerEvent) => setUvFromEvent(e.clientX, e.clientY);
    const onEnter = () => {
      target.current.hover = 1;
    };
    const onLeave = () => {
      target.current.hover = 0;
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerenter", onEnter, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [domRef]);

  return target;
}
