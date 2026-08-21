"use client";

/**
 * WorkThumbsScene — one orthographic scene holding all project planes.
 * The Canvas is created with `orthographic`, which makes R3F size the
 * default camera's frustum to the canvas's CSS pixel dimensions and keep
 * it in sync on resize automatically — so 1 world unit = 1 CSS pixel with
 * no manual frustum math here, and the DOM-rect → plane sync in
 * ProceduralProjectPlane is a straight coordinate translation.
 *
 * Geometry is created once and shared across every plane instance (only
 * the per-project motif/seed uniforms differ) — same reuse discipline as
 * the original texture-based version this replaced.
 */

import { useMemo } from "react";
import * as THREE from "three";
import ProceduralProjectPlane from "./ProceduralProjectPlane";

export type ThumbTarget = {
  key: string;
  domRef: React.RefObject<HTMLElement | null>;
  motif: number;
  seed: number;
};

export default function WorkThumbsScene({ targets }: { targets: ThumbTarget[] }) {
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 1, 1), []);

  return (
    <>
      {targets.map((t) => (
        <ProceduralProjectPlane
          key={t.key}
          domRef={t.domRef}
          motif={t.motif}
          seed={t.seed}
          geometry={geometry}
        />
      ))}
    </>
  );
}
