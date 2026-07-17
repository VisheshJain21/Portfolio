"use client";

/**
 * useDomRectSync — hands back a stable getter that reads a DOM element's
 * live bounding rect. Deliberately NOT event-driven (no scroll/resize
 * listeners): with only 4 thumbnail planes, calling getBoundingClientRect()
 * once per plane per frame is cheap and trivially correct for scroll,
 * resize, and orientation changes alike — one code path instead of three.
 * The caller reads it inside useFrame; this hook touches no Three.js
 * objects and never triggers a React render.
 */

import { useCallback } from "react";

export type DomRect = { x: number; y: number; width: number; height: number };

const EMPTY: DomRect = { x: 0, y: 0, width: 0, height: 0 };

export function useDomRectSync(domRef: React.RefObject<HTMLElement | null>) {
  return useCallback((): DomRect => {
    const el = domRef.current;
    if (!el) return EMPTY;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  }, [domRef]);
}
