"use client";

/**
 * Bare mutable bus — mirrors lib/warp-fx.ts's exact shape. SpineLayer
 * reads `active`/`startedAt` directly inside its own per-frame loop (via
 * performance.now(), not R3F's per-canvas clock, so timing stays exact
 * regardless of when the canvas last paused/resumed) to lerp its color
 * toward --fault and back. A single polling reader needs no pub/sub.
 */
export const faultFX = { active: false, startedAt: 0 };

/** Total length of one fault-and-heal cycle — FaultSequence's GSAP
 *  timeline and SpineLayer's color envelope both key off this constant
 *  so the WebGL and DOM sides resolve in sync. */
export const FAULT_DURATION_MS = 1800;

export function triggerFault() {
  faultFX.active = true;
  faultFX.startedAt = performance.now();
  window.setTimeout(() => {
    faultFX.active = false;
  }, FAULT_DURATION_MS);
}

/** 0→1→0 envelope over one fault cycle: quick slam in, a held plateau,
 *  a slower heal back out. `t` is elapsed/FAULT_DURATION_MS, expected
 *  in [0, 1]. */
export function faultEnvelope(t: number): number {
  if (t < 0.12) return t / 0.12;
  if (t < 0.5) return 1;
  if (t >= 1) return 0;
  return 1 - (t - 0.5) / 0.5;
}
