"use client";

/**
 * ProcessCapabilitiesLayer — one shared layer spanning two adjacent
 * sections that already carry the identical "hairline grid" CSS motif
 * (1px-gap grid forming rule lines via background:var(--line) + border —
 * see Process.module.css's .grid and Capabilities.module.css's .grid).
 * Rather than inventing a new metaphor, this echoes that motif: a
 * handful of small amber glimmers sitting at fixed relative points
 * within whichever section's grid is currently active, drifting almost
 * imperceptibly. Recessive by design — Process/Capabilities are both
 * text-dense grids, this is texture, not a focal effect.
 *
 * First multi-anchor case: each frame, whichever of "process"/
 * "capabilities" is inView drives the layer (if both are transiently
 * inView during the handoff between them, "process" wins — a rare,
 * brief window where either choice reads identically since both grids
 * share the same visual language). Neither inView → the layer fades out.
 *
 * First pass capped intensity at 0.26 and scale at 70px — a full visual
 * audit couldn't spot these at all on a normal display. Raised until the
 * glimmer actually registers; still well under ProofLayer's focal glow.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "../glow-shader";
import type { GlowMaterialImpl, SectionKey, SectionProgress } from "../types";

const AMBER = new THREE.Color("#ff6a2b"); // --signal

// Fixed relative points (fraction of section width/height) echoing grid
// intersections — not tied to the actual DOM grid cells, just plausible
// positions within a multi-column hairline grid.
const NODES: Array<{ u: number; v: number; phase: number }> = [
  // v nudged from 0.35 to 0.1 — at the raised intensity needed to be
  // visible at all, 0.35 landed directly on the section heading's
  // descenders ("trust."). 0.1 sits in the empty top margin above the
  // eyebrow/heading block instead, clear of both sections' headings.
  { u: 0.28, v: 0.1, phase: 0 },
  // v nudged from 0.55 toward the grid's top hairline seam (0.46) after a
  // visual check showed it sitting close enough to a card heading below
  // to read as touching the text once intensity was raised to be visible.
  { u: 0.62, v: 0.46, phase: 2.1 },
  { u: 0.82, v: 0.25, phase: 4.2 },
];

function activeSection(getSectionProgress: () => ReadonlyMap<SectionKey, SectionProgress>) {
  const map = getSectionProgress();
  const process = map.get("process");
  if (process?.inView) return process;
  const caps = map.get("capabilities");
  if (caps?.inView) return caps;
  return null;
}

function NodeGlimmer({
  node,
  getSectionProgress,
}: {
  node: { u: number; v: number; phase: number };
  getSectionProgress: () => ReadonlyMap<SectionKey, SectionProgress>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<GlowMaterialImpl>(null);

  useFrame(({ size, clock }) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const active = activeSection(getSectionProgress);
    const drift = (Math.sin(clock.elapsedTime * 0.3 + node.phase) + 1) * 0.5; // 0..1, slow
    const targetIntensity = active ? 0.32 + drift * 0.18 : 0;
    mat.uIntensity += (targetIntensity - mat.uIntensity) * 0.06;

    if (!active) return;
    const px = active.rect.x + active.rect.width * node.u;
    const py = active.rect.y + active.rect.height * node.v;
    const cx = px - size.width / 2;
    const cy = size.height / 2 - py;
    mesh.position.x += (cx - mesh.position.x) * 0.1;
    mesh.position.y += (cy - mesh.position.y) * 0.1;
  });

  return (
    <mesh ref={meshRef} scale={[90, 90, 1]}>
      <planeGeometry args={[1, 1]} />
      {/* Tighter radius (was 0.45) — a smaller, more contained footprint
          is less likely to visually intrude on nearby text even when a
          fixed relative point happens to land close to a heading. */}
      <glowMaterial ref={matRef} uColor={AMBER} uRadius={0.34} transparent depthWrite={false} />
    </mesh>
  );
}

export default function ProcessCapabilitiesLayer({
  getSectionProgress,
}: {
  getSectionProgress: () => ReadonlyMap<SectionKey, SectionProgress>;
}) {
  const nodes = useMemo(() => NODES, []);
  return (
    <>
      {nodes.map((n, i) => (
        <NodeGlimmer key={i} node={n} getSectionProgress={getSectionProgress} />
      ))}
    </>
  );
}
