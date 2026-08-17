"use client";

/**
 * HeroSceneGate — decides what the hero renders and keeps it resilient:
 *  - reduced motion / no WebGL → static CSS glow only (no canvas mounted)
 *  - touch/narrow             → HeroScene, mobile tier (fewer nodes, no bloom, no parallax)
 *  - fine pointer             → full HeroScene with bloom + pointer parallax
 *
 * Resilience (fixes "the 3D disappears"):
 *  - The canvas mounts ONCE and stays mounted for the page's lifetime; when
 *    the hero scrolls off-screen we only PAUSE the render loop. This avoids
 *    the mount/unmount churn that used to burn through the browser's limited
 *    pool of WebGL contexts.
 *  - A static glow always sits *behind* the canvas, so if the GPU context is
 *    momentarily lost the hero degrades to a soft glow instead of a void.
 *  - On `webglcontextrestored` we remount the scene (key bump) for a clean
 *    rebuild. Only after repeated, unrecovered losses do we give up on WebGL
 *    and drop bloom, then finally the canvas — never a blank rectangle.
 */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { useSiteReady } from "@/hooks/useSiteReady";
import { useNavOverlayOpen } from "@/lib/nav-overlay";
import { warpFX } from "@/lib/warp-fx";
import styles from "./HeroSceneGate.module.css";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

export default function HeroSceneGate() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "static" | "mobile" | "full">("pending");
  const [inView, setInView] = useState(true);
  const [sceneKey, setSceneKey] = useState(0);
  const [bloom, setBloom] = useState(true);
  const lossCount = useRef(0);
  const ready = useSiteReady();
  const tier = useDeviceTier();
  const navOverlayOpen = useNavOverlayOpen();
  // Paused (frameloop "never") until the loader clears AND we're on-screen:
  // no WebGL renders behind the black loading screen; resumes at exit.
  // Also pauses while the mobile nav overlay covers the whole viewport —
  // the canvas is 100% hidden behind it either way, so this is free.
  const paused = !ready || !inView || navOverlayOpen;

  // Publish the live quality tier so the Warp Cut controller can gate
  // its shock ring on the same signal as the hero bloom.
  useEffect(() => {
    warpFX.gpuTier = mode === "full" && bloom ? "high" : "low";
  }, [mode, bloom]);

  useEffect(() => {
    if (!tier) return; // not measured yet — stay "pending"
    if (tier.reducedMotion || !tier.webgl) {
      setMode("static");
      return;
    }
    setMode(tier.mobile ? "mobile" : "full");
  }, [tier]);

  // Pause (don't unmount) when off-screen — keeps the single context alive.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || mode === "static" || mode === "pending") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.02,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);

  const handleLost = useCallback(() => {
    lossCount.current += 1;
    // First loss: drop the (heavy) bloom pass to reduce GPU pressure.
    if (lossCount.current === 1) setBloom(false);
    // Persistent losses: this GPU can't sustain the scene — go static for good.
    if (lossCount.current >= 3) setMode("static");
  }, []);

  const handleRestored = useCallback(() => {
    // Rebuild the scene cleanly on the restored context.
    setSceneKey((k) => k + 1);
  }, []);

  const showCanvas = mode === "full" || mode === "mobile";

  return (
    <div ref={wrapRef} className={styles.wrap} aria-hidden="true">
      {/* Always-present base layer: the hero never becomes a void. */}
      <div className={styles.staticGlow} />
      {showCanvas && (
        <ErrorBoundary
          fallback={null}
          onError={() => setMode("static")}
        >
          <HeroScene
            key={sceneKey}
            mobile={mode === "mobile"}
            interactive={mode === "full"}
            paused={paused}
            bloom={bloom}
            onLost={handleLost}
            onRestored={handleRestored}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
