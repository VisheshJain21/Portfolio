"use client";

/**
 * WorkThumbsScene — one orthographic scene holding all project planes.
 * The Canvas is created with `orthographic`, which makes R3F size the
 * default camera's frustum to the canvas's CSS pixel dimensions and keep
 * it in sync on resize automatically — so 1 world unit = 1 CSS pixel with
 * no manual frustum math here, and the DOM-rect → plane sync in
 * DistortedImagePlane is a straight coordinate translation.
 *
 * Geometry is created once and shared across every plane instance (only
 * materials/textures differ per project), per the reuse constraint in
 * Prompt v3.
 */

import { Suspense, useMemo } from "react";
import * as THREE from "three";
import DistortedImagePlane from "./DistortedImagePlane";

export type ThumbTarget = {
  key: string;
  domRef: React.RefObject<HTMLElement | null>;
  src: string;
};

export default function WorkThumbsScene({ targets }: { targets: ThumbTarget[] }) {
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 1, 1), []);

  return (
    // One Suspense boundary for all four textures — the gate's
    // ErrorBoundary above this catches a hard failure and falls back to
    // the plain DOM <img> layer entirely.
    <Suspense fallback={null}>
      {targets.map((t) => (
        <DistortedImagePlane key={t.key} domRef={t.domRef} src={t.src} geometry={geometry} />
      ))}
    </Suspense>
  );
}
