/**
 * Warp FX bus — tiny mutable store publishing the hero's live GPU tier to
 * the DOM transition controller without React re-renders.
 *
 * `gpuTier` mirrors HeroSceneGate's live quality state: "high" while the
 * bloom pipeline is healthy, "low" after a context loss / on mobile —
 * the warp-cut controller skips the shock ring on "low".
 */

export const warpFX = {
  gpuTier: "high" as "high" | "low",
};
