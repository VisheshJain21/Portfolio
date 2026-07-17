"use client";

/**
 * WarpCut — the DOM layer of the signature nav transition (see
 * animations/warp-cut.ts for the timeline). Mounted once in the root
 * layout; registers its elements with the controller on mount.
 *
 *  - SVG turbulence/displacement filter shared by the wipe panel and the
 *    shock ring, so every edge in the sequence speaks the hero's fluid
 *    language instead of a hard clip-path.
 *  - The panel is oversized (inset -10%) so its displaced edges never
 *    reveal gaps mid-wipe.
 * Purely decorative: aria-hidden, pointer-events none (the controller
 * blocks input by locking Lenis, not by intercepting clicks here).
 */

import { useEffect, useRef } from "react";
import { registerWarpElements } from "@/animations/warp-cut";
import styles from "./WarpCut.module.css";

export default function WarpCut() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerWarpElements({
      root: rootRef.current,
      panel: panelRef.current,
      ring: ringRef.current,
      type: typeRef.current,
      fade: fadeRef.current,
    });
    return () => registerWarpElements(null);
  }, []);

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      <svg className={styles.defs} width="0" height="0" focusable="false">
        <defs>
          <filter id="warp-turb" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.045"
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="42"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Liquid wipe curtain */}
      <div ref={panelRef} className={styles.panel} />

      {/* Shockwave ring from the click point (high GPU tier only) */}
      <div ref={ringRef} className={styles.ring} />

      {/* Kinetic destination type — chars injected by the controller */}
      <div ref={typeRef} className={styles.type} />

      {/* Reduced-motion crossfade layer */}
      <div ref={fadeRef} className={styles.fade} />
    </div>
  );
}
