"use client";

/**
 * ExperienceLayer — a small, tight glow traveling down the existing
 * amber-dot timeline rail in sync with scroll. Deliberately the lightest
 * touch of any World layer: Experience is the densest, most text-heavy
 * of the previously-empty sections (research this session found the
 * least true negative space here of any candidate), and the rail already
 * has its own intentional motion (drawHairline). This is a single small
 * point of light riding it, not a second effect.
 *
 * Reads the rail's own rect directly (polled every frame, same "no
 * listeners" discipline as use-dom-rect-sync.ts) rather than the whole
 * section's rect, since the light must travel along the rail's actual
 * narrow bounding box, not the wide section.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getAnchors } from "@/lib/section-anchors";
import "../glow-shader";
import type { GlowMaterialImpl, SectionKey, SectionProgress } from "../types";

const AMBER = new THREE.Color("#ff6a2b"); // --signal

export default function ExperienceLayer({
  getSectionProgress,
}: {
  getSectionProgress: () => ReadonlyMap<SectionKey, SectionProgress>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<GlowMaterialImpl>(null);

  useFrame(({ size }) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const p = getSectionProgress().get("experience");
    const inView = !!p?.inView;
    const targetIntensity = inView ? Math.max(0, 1 - Math.abs(p!.progress - 0.5) * 2) * 0.4 : 0;
    mat.uIntensity += (targetIntensity - mat.uIntensity) * 0.08;

    const rail = getAnchors().get("experience")?.querySelector<HTMLElement>("[data-glow-rail]");
    if (!rail || !p) return;
    const r = rail.getBoundingClientRect();
    if (r.height <= 0) return;

    // Travel down the rail's own bounding box as the section scrolls
    // through the viewport — not the section's rect, the rail's.
    const travelY = r.top + p.progress * r.height;
    const cx = r.left + r.width / 2 - size.width / 2;
    const cy = size.height / 2 - travelY;
    mesh.position.x += (cx - mesh.position.x) * 0.12;
    mesh.position.y += (cy - mesh.position.y) * 0.12;
  });

  return (
    <mesh ref={meshRef} scale={[110, 110, 1]}>
      <planeGeometry args={[1, 1]} />
      <glowMaterial ref={matRef} uColor={AMBER} uRadius={0.4} transparent depthWrite={false} />
    </mesh>
  );
}
