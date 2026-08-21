"use client";

/**
 * SpineNodeMaterial — a small hot-core + soft-halo radial dot, used
 * instanced (nodes + traveling signal pulses share one InstancedMesh in
 * SpineLayer). Unlike GlowMaterial (a wide diffuse wash), this needs a
 * visible point-light read at small on-screen sizes, hence the extra
 * `smoothstep` core on top of the exponential halo.
 *
 * Written as a raw ShaderMaterial rather than drei's shaderMaterial()
 * helper so the vertex shader can explicitly apply `instanceMatrix` —
 * three.js sets USE_INSTANCING + provides the attribute automatically
 * for any material rendered via InstancedMesh, but a custom ShaderMaterial
 * (unlike MeshBasicMaterial etc.) must reference it itself.
 */

import * as THREE from "three";
import { extend, type ThreeElement } from "@react-three/fiber";

export class SpineNodeMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uColor: { value: new THREE.Color("#ff6a2b") },
        uOpacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        #ifdef USE_INSTANCING
        attribute mat4 instanceMatrix;
        #endif
        void main() {
          vUv = uv;
          #ifdef USE_INSTANCING
            vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          #else
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          #endif
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          float dist = distance(vUv, vec2(0.5)) * 2.0;
          float halo = exp(-pow(dist / 0.62, 2.0) * 3.0);
          float core = smoothstep(0.22, 0.0, dist);
          float alpha = clamp(halo * 0.55 + core, 0.0, 1.0) * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });
  }

  get uColor(): THREE.Color {
    return this.uniforms.uColor.value;
  }

  set uColor(v: THREE.Color) {
    this.uniforms.uColor.value = v;
  }

  get uOpacity(): number {
    return this.uniforms.uOpacity.value;
  }

  set uOpacity(v: number) {
    this.uniforms.uOpacity.value = v;
  }
}

extend({ SpineNodeMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    spineNodeMaterial: ThreeElement<typeof SpineNodeMaterial>;
  }
}
