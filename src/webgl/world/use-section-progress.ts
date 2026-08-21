"use client";

/**
 * useSectionProgress — generalizes work/use-dom-rect-sync.ts's "poll
 * getBoundingClientRect() every frame, no listeners" philosophy from one
 * DOM target to every registered section anchor at once. Reading N rects
 * back-to-back inside a single useFrame, with zero DOM writes interleaved,
 * is one shared layout flush — not an N× cost — so this scales fine at
 * the handful of sections this site tracks.
 *
 * Returns a stable getter (call inside useFrame) that updates and returns
 * the SAME Map instance every call — no per-frame allocation, matching the
 * ref-not-state discipline used throughout webgl/work.
 */

import { useCallback, useMemo } from "react";
import { getAnchors } from "@/lib/section-anchors";
import type { SectionKey, SectionProgress } from "./types";

export function useSectionProgress() {
  const store = useMemo(() => new Map<SectionKey, SectionProgress>(), []);

  return useCallback((): ReadonlyMap<SectionKey, SectionProgress> => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 0;
    for (const [key, el] of getAnchors()) {
      const r = el.getBoundingClientRect();
      const span = r.height + vh;
      const raw = span > 0 ? (vh - r.top) / span : 0;
      store.set(key, {
        progress: Math.min(1, Math.max(0, raw)),
        inView: r.bottom > 0 && r.top < vh,
        rect: { x: r.left, y: r.top, width: r.width, height: r.height },
      });
    }
    return store;
  }, [store]);
}
