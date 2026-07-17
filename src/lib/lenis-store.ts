/**
 * Shared handle to the single Lenis instance (created in SmoothScroll).
 * Lets the warp-cut controller lock/snap scroll without prop-drilling.
 */

import type Lenis from "lenis";

let instance: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  instance = l;
}

export function getLenis(): Lenis | null {
  return instance;
}
