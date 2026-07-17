"use client";

/**
 * ImageShaderMaterial — the ripple/displacement material for project
 * thumbnails (Prompt v3). Registered via drei's shaderMaterial so it's
 * usable as JSX (`<imageShaderMaterial />`). One texture per plane; the
 * geometry is shared (see WorkThumbsScene) — only the material/uniforms
 * are per-instance.
 *
 * Uniforms are written directly (material.uniformName = x) inside
 * useFrame elsewhere — never through React state/props — so a hover
 * frame never triggers a re-render.
 */

import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, type ThreeElement } from "@react-three/fiber";

export const ImageShaderMaterial = shaderMaterial(
  {
    uMap: null as THREE.Texture | null,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uStrength: 0, // 0 at rest, lerped toward 1 on hover
    uTime: 0,
    uOpacity: 1,
  },
  /* vertex */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    uniform sampler2D uMap;
    uniform vec2 uMouse;
    uniform float uStrength;
    uniform float uTime;
    uniform float uOpacity;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      float dist = distance(uv, uMouse);
      // Gaussian-like falloff — no hard cutoff at the ripple's edge.
      float falloff = exp(-dist * 7.0);
      float wave = sin(dist * 26.0 - uTime * 5.0) * 0.5 + 0.5;
      float displacement = wave * falloff * uStrength * 0.05;
      vec2 dir = normalize(uv - uMouse + 1e-5);
      vec2 distortedUv = uv + dir * displacement;
      vec4 color = texture2D(uMap, distortedUv);
      gl_FragColor = vec4(color.rgb, color.a * uOpacity);
    }
  `,
);

extend({ ImageShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    imageShaderMaterial: ThreeElement<typeof ImageShaderMaterial>;
  }
}
