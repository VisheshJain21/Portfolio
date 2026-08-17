"use client";

import { useEffect, useState } from "react";

export type DeviceTier = {
  /** WebGL2 or WebGL context creation succeeded. */
  webgl: boolean;
  reducedMotion: boolean;
  /** Coarse pointer (touch) OR a narrow viewport — the two conditions every
   *  canvas gate has treated as "give me the lighter tier" so far. */
  mobile: boolean;
};

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

/** Computed once on mount, matching every existing canvas gate's behavior —
 *  a scene's tier is decided at first paint, not re-derived live, since
 *  none of them support switching tiers under an already-mounted canvas.
 *  `null` means "not measured yet" (SSR + first client render) — callers
 *  should treat that the same as their own existing "pending" state,
 *  never as "no WebGL". */
export function useDeviceTier(): DeviceTier | null {
  const [tier, setTier] = useState<DeviceTier | null>(null);

  useEffect(() => {
    setTier({
      webgl: supportsWebGL(),
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      mobile: window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 720,
    });
  }, []);

  return tier;
}
