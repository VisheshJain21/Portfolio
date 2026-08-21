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
 *
 * The wrapper is `position: fixed; inset: 0` so DOM getBoundingClientRect()
 * results (viewport-relative) map 1:1 onto canvas pixel space with no
 * extra scroll-offset math — see WorkThumbsScene for why. It is fully
 * transparent except where a plane is drawn, so spanning the viewport
 * never visually affects any other section.
 *
 * Rendered via a portal into `document.body` rather than in-place inside
 * `<Work>` (a descendant of `<main>`) — CSS spec makes any `transform`d
 * ancestor the new containing block for `position:fixed` descendants, and
 * warp-cut.ts's nav-transition briefly applies `transform: scale(...)` to
 * `main`. Without the portal, that turned this element's `inset:0` into
 * "cover all of main's ~7000px scroll height" instead of the viewport for
 * that instant — a real ResizeObserver-measured jump from 900px to ~7700px
 * tall, forcing an enormous WebGL framebuffer reallocation on every single
 * nav click (root-caused via ResizeObserver + WebGLRenderer.setSize
 * tracing on a laggy-nav-click repro). WorldGate already portals-in-effect
 * by simply being a sibling of `<main>`, not a descendant — this matches
 * that same safe placement.
 */

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { useSiteReady } from "@/hooks/useSiteReady";
import { useNavOverlayOpen } from "@/lib/nav-overlay";
import { useWarpActive } from "@/lib/warp-active";
import type { ThumbTarget } from "./WorkThumbsScene";
import styles from "./WorkThumbsGate.module.css";

const WorkThumbsScene = dynamic(() => import("./WorkThumbsScene"), { ssr: false });

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
  const tier = useDeviceTier();
  const navOverlayOpen = useNavOverlayOpen();
  const warpActive = useWarpActive();
  // Paused until the loader clears AND the Work section is on-screen —
  // same context-safe pattern as the hero (never renders behind the loader).
  // Also pauses while the mobile nav overlay covers the whole viewport, and
  // for the ~1s a Nav warp transition runs — see lib/warp-active.ts (this
  // canvas reacting to the transition's instant scroll jump was the real
  // cause of the nav-click lag it's named for).
  const paused = !ready || !inView || navOverlayOpen || warpActive;

  useEffect(() => {
    if (!tier) return;
    setEnabled(!tier.reducedMotion && tier.webgl);
  }, [tier]);

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

  if (!enabled || broken) return null;

  return createPortal(
    <div className={styles.wrap} aria-hidden="true">
      <ErrorBoundary fallback={null} onError={onError}>
        <Canvas
          orthographic
          // Mobile now actually renders all 4 planes (the stacked-card
          // treatment replaced the old display:none-on-mobile thumb,
          // which previously meant zero planes ever rendered here below
          // 820px) — cap DPR lower on mobile, same pattern as WorldGate.
          dpr={tier?.mobile ? [1, 1.25] : [1, 1.5]}
          frameloop={paused ? "never" : "always"}
          gl={{ antialias: true, alpha: true, powerPreference: "default" }}
          style={{ position: "absolute", inset: 0 }}
        >
          <ResumeKick paused={paused} />
          <WorkThumbsScene targets={targets} />
        </Canvas>
      </ErrorBoundary>
    </div>,
    document.body,
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
