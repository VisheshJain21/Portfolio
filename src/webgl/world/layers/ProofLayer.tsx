"use client";

/**
 * ProofLayer — a recessive GPU glow wash behind the 4-cell stat grid,
 * replacing Proof's old CSS-only radial-gradient `.section::before`
 * (same idea, real GPU falloff instead of a static gradient). The huge
 * stat numerals are the section's visual hero — this sits behind and
 * supports them, never brighter than the existing per-cell CSS hover
 * treatment on `.value` (color + text-shadow).
 *
 * First hover-reactive World layer: listens for pointerenter/leave
 * directly on the real DOM `[data-glow-cell]` elements (never the
 * canvas), same discipline as webgl/work/usePointerUniforms.ts, and
 * lerps the glow toward whichever cell is hovered.
 *
 * Learned from ManifestoLayer's first pass: the mesh stays ALWAYS in the
 * render path (uIntensity/scale drive presence, never `visible: false`),
 * so GPU upload happens during the page's already-accepted load burst
 * instead of stalling the first scroll into view.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getAnchors } from "@/lib/section-anchors";
import "../glow-shader";
import type { GlowMaterialImpl, SectionKey, SectionProgress } from "../types";

const AMBER = new THREE.Color("#ff6a2b"); // --signal

type HoverTarget = { x: number; y: number; width: number; height: number } | null;

/** Tracks which [data-glow-cell] element (if any) is hovered, writing the
 *  target into a ref — never React state, so hover never re-renders. */
function useCellHover(anchorKey: SectionKey) {
  const target = useRef<HoverTarget>(null);

  useEffect(() => {
    const root = getAnchors().get(anchorKey);
    if (!root) return;
    const cells = Array.from(root.querySelectorAll<HTMLElement>("[data-glow-cell]"));
    const onEnter = (el: HTMLElement) => () => {
      const r = el.getBoundingClientRect();
      target.current = { x: r.left, y: r.top, width: r.width, height: r.height };
    };
    const onLeave = () => {
      target.current = null;
    };
    const cleanups = cells.map((el) => {
      const enter = onEnter(el);
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", onLeave);
      };
    });
    return () => cleanups.forEach((fn) => fn());
  }, [anchorKey]);

  return target;
}

export default function ProofLayer({
  getSectionProgress,
}: {
  getSectionProgress: () => ReadonlyMap<SectionKey, SectionProgress>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<GlowMaterialImpl>(null);
  const hover = useCellHover("proof");
  const currentUv = useMemo(() => new THREE.Vector2(0.2, 0.55), []);

  useFrame(({ size }) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    const p = getSectionProgress().get("proof");
    const inView = !!p?.inView;

    const baseline = inView ? Math.max(0, 1 - Math.abs(p!.progress - 0.5) * 2) : 0;
    const targetIntensity = hover.current ? Math.max(baseline, 0.7) * 0.55 : baseline * 0.22;
    mat.uIntensity += (targetIntensity - mat.uIntensity) * 0.08;

    if (!p) return;
    const cx = p.rect.x + p.rect.width / 2 - size.width / 2;
    const cy = size.height / 2 - (p.rect.y + p.rect.height / 2);
    mesh.position.x += (cx - mesh.position.x) * 0.15;
    mesh.position.y += (cy - mesh.position.y) * 0.15;
    mesh.scale.x += (Math.max(p.rect.width, 1) - mesh.scale.x) * 0.15;
    mesh.scale.y += (Math.max(p.rect.height, 1) - mesh.scale.y) * 0.15;

    const h = hover.current;
    const targetU = h ? (h.x + h.width / 2 - p.rect.x) / p.rect.width : 0.2;
    const targetV = h ? 1 - (h.y + h.height / 2 - p.rect.y) / p.rect.height : 0.55;
    currentUv.x += (targetU - currentUv.x) * 0.12;
    currentUv.y += (targetV - currentUv.y) * 0.12;
    mat.uCenter = currentUv;
    mat.uRadius = h ? 0.32 : 0.6;
  });

  return (
    <mesh ref={meshRef} scale={[1, 1, 1]}>
      <planeGeometry args={[1, 1]} />
      <glowMaterial ref={matRef} uColor={AMBER} transparent depthWrite={false} />
    </mesh>
  );
}
