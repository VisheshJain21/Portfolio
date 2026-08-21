"use client";

/**
 * Warp-active bus — tiny mutable store, identical shape to nav-overlay.ts.
 * warp-cut.ts publishes whether a transition is currently running; every
 * canvas gate (Hero/Work/World) folds it into their own `paused` calc.
 *
 * Investigated as part of root-causing laggy Nav clicks (see warp-cut.ts
 * and WorkThumbsGate.tsx for the two confirmed bugs that turned out to be
 * the real causes — a Lenis CSS class toggling the scrollbar, and this
 * canvas losing its fixed-position containing block mid-transition).
 * Pausing here didn't measurably fix the lag on its own, but it's still
 * correct and free: these canvases are 100% invisible for most of a warp
 * transition anyway, same "pause something invisible" logic as
 * nav-overlay.ts.
 */

import { useEffect, useState } from "react";

let active = false;
const subs = new Set<(active: boolean) => void>();

export function setWarpActive(next: boolean) {
  if (active === next) return;
  active = next;
  subs.forEach((fn) => fn(active));
}

export function isWarpActive() {
  return active;
}

export function useWarpActive(): boolean {
  const [state, setState] = useState(active);
  useEffect(() => {
    const fn = (v: boolean) => setState(v);
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  }, []);
  return state;
}
