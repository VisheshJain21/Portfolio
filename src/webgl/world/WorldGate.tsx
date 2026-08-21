"use client";

/**
 * WorldGate — mounts ONE persistent, full-viewport canvas shared by every
 * section that wants an ambient 3D layer (Manifesto, Proof, Experience,
 * Process+Capabilities, Contact), instead of one canvas per section. This
 * keeps the site-wide WebGL context total at 3 (Hero, Work, World) no
 * matter how many sections get a treatment — avoiding the context-pool
 * exhaustion class of bug already hit and fixed once this session.
 *
 * Same resilience pattern as HeroSceneGate/WorkThumbsGate: mount once,
 * never unmount, only pause `frameloop` via an IntersectionObserver +
 * useSiteReady() gate. Unlike Work (which only needs to be "on" while its
 * one section is visible), World must stay active across a wide scroll
 * range spanning several sections — so its pause target is `#site-main`
 * itself, not a single section. Each individual layer is responsible for
 * keeping its OWN per-frame work near-zero when its section isn't in
 * view; the shared canvas being "always" for most of the scroll session
 * is fine since an empty/near-empty scene costs almost nothing to render.
 */

import dynamic from "next/dynamic";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { useSiteReady } from "@/hooks/useSiteReady";
import { useNavOverlayOpen } from "@/lib/nav-overlay";
import { useWarpActive } from "@/lib/warp-active";
import styles from "./WorldGate.module.css";

const WorldScene = dynamic(() => import("./WorldScene"), { ssr: false });

export default function WorldGate() {
  const [enabled, setEnabled] = useState(false);
  const [inView, setInView] = useState(false);
  const [broken, setBroken] = useState(false);
  const ready = useSiteReady();
  const tier = useDeviceTier();
  const navOverlayOpen = useNavOverlayOpen();
  const warpActive = useWarpActive();
  // Also pauses while the mobile nav overlay covers the whole viewport —
  // this canvas is the one most likely to be continuously active (it
  // spans nearly the whole scroll range via #site-main), so this matters
  // most here: 6 layers' worth of per-frame work otherwise keeps running
  // for zero visual benefit while fully hidden behind the overlay. Also
  // pauses during a Nav warp transition (see lib/warp-active.ts) for the
  // same reason, alongside Hero/Work.
  const paused = !ready || !inView || navOverlayOpen || warpActive;

  useEffect(() => {
    if (!tier) return;
    setEnabled(!tier.reducedMotion && tier.webgl);
  }, [tier]);

  useEffect(() => {
    if (!enabled) return;
    const el = document.getElementById("site-main");
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);

  if (!enabled || broken) return null;

  return (
    <div className={styles.wrap} aria-hidden="true">
      <ErrorBoundary fallback={null} onError={() => setBroken(true)}>
        <Canvas
          orthographic
          dpr={tier?.mobile ? [1, 1.25] : [1, 1.5]}
          frameloop={paused ? "never" : "always"}
          gl={{ antialias: true, alpha: true, powerPreference: "default" }}
          style={{ position: "absolute", inset: 0 }}
        >
          <ResumeKick paused={paused} />
          <WorldScene />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}

/** Mirrors HeroScene/WorkThumbsGate's ResumeKick exactly: nudge one render
 *  the instant the frameloop flips back from "never" to "always". */
function ResumeKick({ paused }: { paused: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!paused) invalidate();
  }, [paused, invalidate]);
  return null;
}
