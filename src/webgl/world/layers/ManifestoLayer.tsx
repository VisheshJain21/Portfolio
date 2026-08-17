"use client";

/**
 * ManifestoLayer — a slow ambient amber particle drift behind Manifesto's
 * word-illuminated statement (the sparsest section, with the largest
 * flanking negative space of the 7 previously-empty sections). Deliberately
 * atmospheric, not a second focal effect — Manifesto's own word-color
 * scrub is already its one intentional motion characteristic; this is
 * background texture, recessive by design (dim, sparse, slow).
 *
 * Presence follows a bell curve over the section's scroll progress
 * (0..1) — peaks near the middle of its transit through the viewport,
 * tapers toward the edges, so it reads as "arriving with the text"
 * rather than a hard cut. Driven via a group scale/position lerp (fade +
 * gentle contract) rather than a material opacity uniform, since drei's
 * Sparkles doesn't expose one to mutate per-frame without reaching into
 * unstable internals — this achieves the same "materializing" read.
 *
 * The group is deliberately kept `visible` at all times (scale drives the
 * fade, not the `visible` flag) — toggling `visible: false` skips Three's
 * render traversal entirely, which defers this Sparkles field's GPU
 * buffer upload / shader compile to the first frame it actually becomes
 * visible. That turned a one-time cost into a ~70ms hitch exactly when
 * Manifesto first scrolled into view (measured via check:perf) — real
 * scroll-time jank. Keeping it in the render path from mount means that
 * cost lands during the page's already-accepted initial-load burst
 * instead, and scaled-to-near-zero is visually indistinguishable from
 * hidden.
 *
 * Position and intensity were both wrong on the first pass: centering the
 * field on the whole section's bounding box put particles directly behind
 * the readable text (the statement is left-aligned, capped at
 * max-width:26ch — screenshots showed a bright particle glowing mid-word).
 * Fixed by biasing the field into the actual flanking space to the right
 * of the text.
 *
 * That fix over-corrected on the second axis: opacity/size were dropped
 * so far (0.18 / 1.1px) that a full user-facing audit couldn't spot the
 * effect at all on a normal display — "recessive" tipped into "invisible",
 * which is exactly the "3D that costs GPU but nobody notices" failure
 * mode. The POSITION fix (biased into the flank) stays; intensity is
 * restored to something a viewer actually registers.
 *
 * Boosting intensity then exposed a THIRD, more fundamental bug: this is
 * the only layer built on drei's <Sparkles> (a Points-based material) —
 * every other layer is a real <mesh><planeGeometry> whose vertices
 * genuinely shrink to nothing under `group.scale → 0.001`. Point-sprite
 * screen size does NOT reliably scale down with the parent's transform
 * under this orthographic camera — collapsing 70 particles' positions
 * toward one point while each sprite keeps its full pixel size just
 * stacks them into one solid, highly visible dot exactly at the group's
 * origin (confirmed: this dot sat directly on Manifesto's text below the
 * 860px flank threshold, and would equally appear at both scroll-edges of
 * the bell curve on desktop). Scale can no longer be the hide mechanism.
 * Fixed by parking the group far outside the orthographic frustum when
 * it should be hidden, and reserving scale for the in-view "arriving"
 * pulse only, where it never collapses anywhere near zero.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { SectionKey, SectionProgress } from "../types";

const AMBER = new THREE.Color("#ff8b57"); // --signal-soft

// Below this canvas width there's no real flanking space beside the
// statement (text runs near-full-width), so the field is suppressed
// entirely rather than sitting on top of readable text.
const MIN_WIDTH_FOR_FLANK = 860;

export default function ManifestoLayer({
  getSectionProgress,
}: {
  getSectionProgress: () => ReadonlyMap<SectionKey, SectionProgress>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ size }) => {
    const group = groupRef.current;
    if (!group) return;
    const p = getSectionProgress().get("manifesto");
    const hasFlank = size.width >= MIN_WIDTH_FOR_FLANK;
    const inView = !!p?.inView && hasFlank;

    if (!inView) {
      // Park it just outside the orthographic frustum — genuinely
      // off-frame, unlike scale, which doesn't shrink Points sprites.
      // A modest multiple of canvas width (not an arbitrarily huge
      // value) keeps the position lerp's convergence time reasonable
      // when it re-enters view, since lerp speed depends on distance.
      group.position.x = size.width * 2.5;
      return;
    }

    const intensity = Math.max(0, 1 - Math.abs(p!.progress - 0.5) * 2);
    const targetScale = 0.55 + intensity * 0.45; // never collapses toward 0 in this branch
    group.scale.x += (targetScale - group.scale.x) * 0.06;
    group.scale.y = group.scale.z = group.scale.x;
    group.rotation.z += 0.0004 * intensity;

    // DOM rect (viewport px) → world space: the orthographic camera is
    // sized 1:1 to canvas CSS pixels, same conversion as
    // DistortedImagePlane's DOM-rect sync in webgl/work. Biased toward
    // ~72% across the section rather than centered — the statement is
    // capped at max-width:26ch and left-aligned, so the field sits in
    // the flanking negative space to the right instead of behind the
    // readable text column.
    const cx = p!.rect.x + p!.rect.width * 0.72 - size.width / 2;
    const cy = size.height / 2 - (p!.rect.y + p!.rect.height / 2);
    group.position.x += (cx - group.position.x) * 0.1;
    group.position.y += (cy - group.position.y) * 0.1;
  });

  return (
    <group ref={groupRef} position={[4000, 0, 0]} scale={0.7}>
      <Sparkles count={70} scale={[420, 380, 180]} size={2.6} speed={0.16} color={AMBER} opacity={0.55} noise={1.3} />
    </group>
  );
}
