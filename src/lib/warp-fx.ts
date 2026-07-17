/**
 * Warp FX bus — tiny mutable store bridging the DOM transition controller
 * and the R3F postprocessing pass without React re-renders.
 *
 * `spike` (0..1) is set by the warp-cut controller on impact; the scene's
 * per-frame driver reads it to exaggerate chromatic aberration + grain,
 * and decays it back to 0 (single writer of the decay).
 *
 * `gpuTier` mirrors HeroSceneGate's live quality state: "high" while the
 * bloom pipeline is healthy, "low" after a context loss / on mobile —
 * the controller skips the shader spike + shock ring on "low".
 */

export const warpFX = {
  spike: 0,
  gpuTier: "high" as "high" | "low",
};
