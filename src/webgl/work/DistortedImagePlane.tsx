"use client";

/**
 * DistortedImagePlane — one project thumbnail rendered as a WebGL plane
 * that ripples toward the cursor on hover (Prompt v3). The DOM card stays
 * a normal element for layout/content/a11y; this plane is positioned to
 * match its rect every frame (see use-dom-rect-sync) and rendered behind
 * it, visually replacing the flat <img> underneath.
 *
 * Perf contract: geometry is shared (created once by the parent scene,
 * passed in as a prop); only the material/texture/uniforms are
 * per-instance. All position/uniform writes happen in useFrame — never
 * in the pointer event handlers themselves (those only set targets, see
 * usePointerUniforms) — so hover never triggers a React re-render.
 */

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import "./image-shader";
import type { ImageShaderMaterialImpl } from "./types";
import { useDomRectSync } from "./use-dom-rect-sync";
import { usePointerUniforms } from "./usePointerUniforms";

const LERP = 0.12;

export default function DistortedImagePlane({
  domRef,
  src,
  geometry,
}: {
  domRef: React.RefObject<HTMLElement | null>;
  src: string;
  geometry: THREE.PlaneGeometry;
}) {
  // useTexture suspends until loaded; a broken/404 image throws, caught by
  // WorkThumbsGate's ErrorBoundary → falls back to the DOM <img> beneath.
  const texture = useTexture(src);
  const getRect = useDomRectSync(domRef);
  const pointer = usePointerUniforms(domRef);
  const { size: viewport } = useThree();

  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<ImageShaderMaterialImpl>(null);
  const strength = useRef(0);
  const uv = useRef({ x: 0.5, y: 0.5 });

  useFrame((state) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    // — Position/scale sync: DOM rect → world units (ortho cam = 1:1 px). —
    const r = getRect();
    mesh.position.set(
      r.x + r.width / 2 - viewport.width / 2,
      viewport.height / 2 - (r.y + r.height / 2),
      0,
    );
    mesh.scale.set(Math.max(r.width, 0.001), Math.max(r.height, 0.001), 1);
    mesh.visible = r.width > 0 && r.height > 0;

    // — Lerp strength/mouse toward the event-set targets (never snap). —
    strength.current += (pointer.current.hover - strength.current) * LERP;
    uv.current.x += (pointer.current.x - uv.current.x) * LERP;
    uv.current.y += (pointer.current.y - uv.current.y) * LERP;

    mat.uStrength = strength.current;
    mat.uMouse.set(uv.current.x, uv.current.y);
    mat.uTime = state.clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <imageShaderMaterial ref={matRef} uMap={texture} transparent />
    </mesh>
  );
}
