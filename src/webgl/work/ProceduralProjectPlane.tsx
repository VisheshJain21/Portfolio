"use client";

/**
 * ProceduralProjectPlane — one project's procedural motif, rendered as a
 * WebGL plane synced to its DOM thumb slot every frame. Mirrors
 * DistortedImagePlane's structure exactly (DOM-rect sync, pointer
 * uniforms, mesh position/scale) but needs no texture at all, so it's a
 * separate component rather than a texture-optional branch inside
 * DistortedImagePlane — no useTexture()/Suspense concern here since
 * there's nothing that can fail to load.
 *
 * Perf contract, same as DistortedImagePlane: geometry is shared (passed
 * in as a prop), only per-instance uniforms differ. All uniform writes
 * happen in useFrame, never in the pointer event handlers.
 */

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import "./project-shader";
import type { ProjectShaderMaterialImpl } from "./types";
import { useDomRectSync } from "./use-dom-rect-sync";
import { usePointerUniforms } from "./usePointerUniforms";

const LERP = 0.12;

export default function ProceduralProjectPlane({
  domRef,
  motif,
  seed,
  geometry,
}: {
  domRef: React.RefObject<HTMLElement | null>;
  /** 0=agent-graph, 1=signal-flow, 2=audit-trail, 3=vision-scan — see project-shader.ts. */
  motif: number;
  /** Per-instance variation so all 4 motifs don't look identically phased. */
  seed: number;
  geometry: THREE.PlaneGeometry;
}) {
  const getRect = useDomRectSync(domRef);
  const pointer = usePointerUniforms(domRef);
  const { size: viewport } = useThree();

  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<ProjectShaderMaterialImpl>(null);
  const strength = useRef(0);
  const uv = useRef({ x: 0.5, y: 0.5 });

  useFrame((state) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const r = getRect();
    mesh.position.set(
      r.x + r.width / 2 - viewport.width / 2,
      viewport.height / 2 - (r.y + r.height / 2),
      0,
    );
    mesh.scale.set(Math.max(r.width, 0.001), Math.max(r.height, 0.001), 1);
    mesh.visible = r.width > 0 && r.height > 0;

    strength.current += (pointer.current.hover - strength.current) * LERP;
    uv.current.x += (pointer.current.x - uv.current.x) * LERP;
    uv.current.y += (pointer.current.y - uv.current.y) * LERP;

    mat.uStrength = strength.current;
    mat.uMouse.set(uv.current.x, uv.current.y);
    mat.uTime = state.clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <projectShaderMaterial ref={matRef} uMotif={motif} uSeed={seed} transparent />
    </mesh>
  );
}
