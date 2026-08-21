"use client";

/**
 * GlowMaterial — a soft radial-falloff wash, shared by every World layer
 * that needs a recessive atmospheric highlight (Proof now, Contact in a
 * later phase). Registered via drei's shaderMaterial so it's usable as
 * JSX (`<glowMaterial />`), same pattern as webgl/work/image-shader.ts.
 *
 * uCenter is UV space (0..1) within the plane the material is applied
 * to — callers lerp it toward a hover target or a default resting spot.
 * Uniforms are written directly (material.uniformName = x) inside
 * useFrame — never through React state/props.
 */

import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, type ThreeElement } from "@react-three/fiber";

export const GlowMaterial = shaderMaterial(
  {
    uColor: new THREE.Color("#ff6a2b"),
    uCenter: new THREE.Vector2(0.5, 0.5),
    uRadius: 0.5,
    uIntensity: 0, // 0 at rest, lerped up while in view / on hover
  },
  /* vertex */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    uniform vec3 uColor;
    uniform vec2 uCenter;
    uniform float uRadius;
    uniform float uIntensity;
    varying vec2 vUv;

    void main() {
      float dist = distance(vUv, uCenter);
      // Gaussian-like falloff — no hard edge.
      float falloff = exp(-pow(dist / max(uRadius, 0.0001), 2.0) * 3.0);
      float alpha = falloff * uIntensity;
      gl_FragColor = vec4(uColor, alpha);
    }
  `,
);

extend({ GlowMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    glowMaterial: ThreeElement<typeof GlowMaterial>;
  }
}
