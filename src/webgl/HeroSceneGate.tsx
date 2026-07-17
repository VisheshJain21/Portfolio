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
 *  - A global `window.onerror` net catches the one class of failure the
 *    <ErrorBoundary> below structurally cannot: errors thrown from React's
 *    own concurrent scheduler tick (`performWorkUntilDeadline`), which
 *    happen outside any component's render call stack and so never reach
 *    a boundary. In dev this shows up as a Fast-Refresh-triggered
 *    "Converting circular structure to JSON" from the R3F reconciler
 *    (a Three.js object's parent/children cycle getting stringified by
 *    HMR's prop-diffing after a hot-reloaded module changes a registered
 *    element's class identity) — harmless to the shipped build, since
 *    Turbopack's HMR machinery doesn't exist in `next start`, but if left
 *    uncaught it can leave the fiber tree mid-commit and the page inert.
 *    We degrade to the static glow rather than let the page go dead.
 */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useSiteReady } from "@/hooks/useSiteReady";
import { warpFX } from "@/lib/warp-fx";
import styles from "./HeroSceneGate.module.css";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

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

export default function HeroSceneGate() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "static" | "mobile" | "full">("pending");
  const [inView, setInView] = useState(true);
  const [sceneKey, setSceneKey] = useState(0);
  const [bloom, setBloom] = useState(true);
  const lossCount = useRef(0);
  const ready = useSiteReady();
  // Paused (frameloop "never") until the loader clears AND we're on-screen:
  // no WebGL renders behind the black loading screen; resumes at exit.
  const paused = !ready || !inView;

  // Publish the live quality tier so the Warp Cut controller can gate
  // its shader spike / shock ring on the same signal as the hero bloom.
  useEffect(() => {
    warpFX.gpuTier = mode === "full" && bloom ? "high" : "low";
  }, [mode, bloom]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 720;
    if (reduced || !supportsWebGL()) {
      setMode("static");
      return;
    }
    setMode(coarse || narrow ? "mobile" : "full");
  }, []);

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

  // Global net for scheduler-level errors an ErrorBoundary can't see (see
  // the file header). Narrowly matched so unrelated app errors pass through
  // untouched — this only reacts to the R3F/circular-structure signature.
  useEffect(() => {
    if (mode === "static") return;
    const isSchedulerCircularity = (msg: string, stack?: string) =>
      /circular structure|cyclic structures/i.test(msg) &&
      /react-three-fiber|performWorkUntilDeadline/i.test(stack ?? msg);

    const onError = (e: ErrorEvent) => {
      if (isSchedulerCircularity(e.message ?? "", e.error?.stack)) {
        // eslint-disable-next-line no-console
        console.warn("HeroSceneGate: recovered from an uncaught scheduler error.");
        setMode("static");
      }
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const msg = typeof reason === "string" ? reason : (reason?.message ?? "");
      if (isSchedulerCircularity(msg, reason?.stack)) {
        console.warn("HeroSceneGate: recovered from an uncaught scheduler rejection.");
        setMode("static");
      }
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [mode]);

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
