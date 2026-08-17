"use client";

/**
 * SpineNodesOverlay — real, keyboard-reachable DOM hit-targets over the
 * agent-pipeline spine's 6 WebGL nodes (webgl/world/layers/SpineLayer.tsx).
 * The World canvas is pointer-events:none site-wide (WorldGate.module.css),
 * so without this the "living pipeline" is decorative only. Position math
 * is the exact shared code SpineLayer uses (webgl/world/spine-geometry.ts)
 * so a button can never visibly drift from its dot.
 *
 * Position updates ride the existing GSAP ticker (same "poll, don't
 * listen" discipline as use-section-progress.ts) rather than spinning up
 * a second rAF loop.
 *
 * Desktop + non-reduced-motion only — on mobile the spine is already an
 * ambient-only background element (SpineLayer skips pulse instancing
 * there too), and a second layer of real tap targets isn't worth the
 * added complexity on an already-tight mobile layout.
 */

import { useEffect, useRef } from "react";
import { gsap } from "@/animations/gsap";
import { warpTo } from "@/animations/warp-cut";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { getAnchors } from "@/lib/section-anchors";
import type { SectionKey } from "@/lib/section-anchors";
import {
  SECTION_ORDER,
  SECTION_DOM_ID,
  NODE_Y_OFFSET,
  columnScreenX,
  worldY,
  nodeWobbleX,
} from "@/webgl/world/spine-geometry";
import { spineHover } from "@/webgl/world/spine-hover";
import { playTick } from "@/lib/sound";
import Magnetic from "./Magnetic";
import styles from "./SpineNodesOverlay.module.css";

const LABEL: Record<SectionKey, string> = {
  manifesto: "Manifesto",
  proof: "Track record",
  experience: "Experience",
  process: "Approach",
  capabilities: "Tech stack",
  contact: "Contact",
};

export default function SpineNodesOverlay() {
  const tier = useDeviceTier();
  const nodeRefs = useRef<Array<HTMLDivElement | null>>([]);
  const active = !!tier && !tier.mobile && !tier.reducedMotion;

  useEffect(() => {
    if (!active) return;

    const tick = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const colX = columnScreenX(vw);
      SECTION_ORDER.forEach((key, i) => {
        const div = nodeRefs.current[i];
        const el = getAnchors().get(key);
        if (!div || !el) return;
        const rect = el.getBoundingClientRect();
        const screenY = rect.top + NODE_Y_OFFSET;
        const vy = worldY(vh, screenY);
        const screenX = colX + nodeWobbleX(vy, i);
        div.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
      });
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className={styles.wrap}>
      {SECTION_ORDER.map((key, i) => (
        <div
          key={key}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
          className={styles.node}
        >
          <Magnetic strength={14}>
            <button
              type="button"
              className={styles.hit}
              data-cursor-view="Trace"
              aria-label={`Jump to ${LABEL[key]}`}
              onPointerEnter={() => {
                spineHover.index = i;
                playTick();
              }}
              onPointerLeave={() => {
                if (spineHover.index === i) spineHover.index = null;
              }}
              onFocus={() => {
                spineHover.index = i;
              }}
              onBlur={() => {
                if (spineHover.index === i) spineHover.index = null;
              }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                warpTo(`#${SECTION_DOM_ID[key]}`, {
                  label: LABEL[key],
                  clickX: r.left + r.width / 2,
                  clickY: r.top + r.height / 2,
                  holdEl: e.currentTarget,
                });
              }}
            />
          </Magnetic>
        </div>
      ))}
    </div>
  );
}
