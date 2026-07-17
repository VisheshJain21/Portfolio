"use client";

/**
 * WorkThumbsGate — mounts the Work section's thumbnail canvas using the
 * exact resilience pattern proven on the hero (Bug A fix):
 *  - the canvas mounts ONCE and is never unmounted; it only PAUSES
 *    (frameloop "never") when the Work section scrolls off-screen, so it
 *    never churns the browser's limited WebGL-context pool.
 *  - a ResumeKick invalidates a frame the instant it un-pauses.
 *  - no postprocessing composer is attached here at all (SOP: Option B),
 *    so nothing bleeds onto the thumbnails and there's no autoClear/
 *    ClearGuard concern to replicate.
 *  - reduced motion / no WebGL / a hard render error → the canvas simply
 *    doesn't mount; the DOM <img> already under each plane (rendered by
 *    Work.tsx regardless) is what shows — the fallback is "free" because
 *    the DOM card exists independent of whether WebGL is available.
 *  - a global `window.onerror` net catches scheduler-level errors an
 *    ErrorBoundary structurally cannot (see HeroSceneGate's file header
 *    for the full explanation) — this canvas uses the same extend()-based
 *    custom-material pattern, so it's equally exposed to the dev-only
 *    HMR/circular-JSON class of crash.
 *
 * The wrapper is `position: fixed; inset: 0` so DOM getBoundingClientRect()
 * results (viewport-relative) map 1:1 onto canvas pixel space with no
 * extra scroll-offset math — see WorkThumbsScene for why. It is fully
 * transparent except where a plane is drawn, so spanning the viewport
 * never visually affects any other section.
 */

import dynamic from "next/dynamic";
import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useSiteReady } from "@/hooks/useSiteReady";
import type { ThumbTarget } from "./WorkThumbsScene";
import styles from "./WorkThumbsGate.module.css";

const WorkThumbsScene = dynamic(() => import("./WorkThumbsScene"), { ssr: false });

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

export default function WorkThumbsGate({
  sectionRef,
  targets,
}: {
  /** The <section id="work"> element — observed for the pause gate. */
  sectionRef: React.RefObject<HTMLElement | null>;
  targets: ThumbTarget[];
}) {
  const [enabled, setEnabled] = useState(false);
  const [inView, setInView] = useState(false);
  const [broken, setBroken] = useState(false);
  const ready = useSiteReady();
  // Paused until the loader clears AND the Work section is on-screen —
  // same context-safe pattern as the hero (never renders behind the loader).
  const paused = !ready || !inView;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(!reduced && supportsWebGL());
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !enabled) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.02,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, sectionRef]);

  const onError = useCallback(() => setBroken(true), []);

  // Same narrowly-scoped global net as HeroSceneGate — degrades to the
  // DOM <img> fallback instead of letting a scheduler-level crash go uncaught.
  useEffect(() => {
    if (!enabled || broken) return;
    const isSchedulerCircularity = (msg: string, stack?: string) =>
      /circular structure|cyclic structures/i.test(msg) &&
      /react-three-fiber|performWorkUntilDeadline/i.test(stack ?? msg);

    const onWinError = (e: ErrorEvent) => {
      if (isSchedulerCircularity(e.message ?? "", e.error?.stack)) {
        console.warn("WorkThumbsGate: recovered from an uncaught scheduler error.");
        setBroken(true);
      }
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const msg = typeof reason === "string" ? reason : (reason?.message ?? "");
      if (isSchedulerCircularity(msg, reason?.stack)) {
        console.warn("WorkThumbsGate: recovered from an uncaught scheduler rejection.");
        setBroken(true);
      }
    };
    window.addEventListener("error", onWinError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onWinError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [enabled, broken]);

  if (!enabled || broken) return null;

  return (
    <div className={styles.wrap} aria-hidden="true">
      <ErrorBoundary fallback={null} onError={onError}>
        <Canvas
          orthographic
          dpr={[1, 1.5]}
          frameloop={paused ? "never" : "always"}
          gl={{ antialias: true, alpha: true, powerPreference: "default" }}
          style={{ position: "absolute", inset: 0 }}
        >
          <ResumeKick paused={paused} />
          <WorkThumbsScene targets={targets} />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}

/** Mirrors HeroScene's ResumeKick exactly: nudge one render the instant
 *  the frameloop flips back from "never" to "always". */
function ResumeKick({ paused }: { paused: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!paused) invalidate();
  }, [paused, invalidate]);
  return null;
}
