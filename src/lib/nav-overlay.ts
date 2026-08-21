"use client";

/**
 * Nav overlay bus — tiny mutable store (no React), same idiom as
 * site-ready.ts/warp-fx.ts. Nav publishes its mobile menu's open state;
 * every canvas gate (Hero/Work/World) folds it into their own `paused`
 * calculation. The full-screen overlay covers the entire viewport, so
 * while it's open none of the 3 WebGL canvases are visible — but none of
 * them knew that, and kept rendering full frames behind it, competing
 * for the same GPU/main-thread the overlay's own open/close and
 * warp-cut-transition animations need. This is a pure win: pausing
 * something 100% invisible costs nothing and frees real headroom.
 */

import { useEffect, useState } from "react";

let open = false;
const subs = new Set<(open: boolean) => void>();

export function setNavOverlayOpen(next: boolean) {
  if (open === next) return;
  open = next;
  subs.forEach((fn) => fn(open));
}

export function isNavOverlayOpen() {
  return open;
}

export function useNavOverlayOpen(): boolean {
  const [state, setState] = useState(open);
  useEffect(() => {
    const fn = (v: boolean) => setState(v);
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  }, []);
  return state;
}
