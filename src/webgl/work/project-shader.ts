"use client";

/**
 * ProjectShaderMaterial — a procedural, textureless per-project visual
 * replacing the placeholder-gradient thumbnails (the single weakest
 * moment in the original site audit: real project screenshots aren't an
 * option for the two confidential systems, so instead of one photo per
 * project, each gets a distinct GLSL motif matching what it actually
 * does). ONE shared material compiled once (registered via drei's
 * shaderMaterial, same as image-shader.ts) and reused across all 4 plane
 * instances via a `uMotif` uniform, rather than 4 separate materials —
 * avoids 4x the shader-compile cost during the already-measured
 * page-load burst.
 *
 * Motifs (selected by uMotif 0..3, matching content/projects.ts order):
 *  0 — agent-graph: nodes + connecting edges + a traveling pulse
 *      (OpenClaw — an autonomous multi-agent debugger)
 *  1 — signal-flow: parallel flowing "channel" lines with reroute points
 *      (Self-Healing Delivery Platform — 4-channel failover)
 *  2 — audit-trail: static log-lines + a scanning highlight bar
 *      (NEXUS — real-time workforce data)
 *  3 — vision-scan: a rotating radar sweep + concentric rings
 *      (Safety-Critical Ops Automation — AI-vision based)
 *
 * No texture, so unlike ImageShaderMaterial this can't fail to load —
 * uMap-style Suspense/broken-image handling doesn't apply here. Cursor
 * reactivity reuses the exact same uMouse/uStrength uniforms and
 * usePointerUniforms hook as the image shader, just brightening nodes/
 * lines near the pointer instead of physically displacing a texture.
 *
 * Every loop below has a small, fixed (compile-time constant) bound —
 * cheap enough for 4 simultaneous instances to stay inside the project's
 * 200ms scroll-task perf budget.
 */

import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, type ThreeElement } from "@react-three/fiber";

export const ProjectShaderMaterial = shaderMaterial(
  {
    uMotif: 0,
    uSeed: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uStrength: 0, // 0 at rest, lerped toward 1 on hover/tap
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
    uniform float uMotif;
    uniform float uSeed;
    uniform vec2 uMouse;
    uniform float uStrength;
    uniform float uTime;
    uniform float uOpacity;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    vec2 hash2(float n) {
      return vec2(hash(vec2(n, n * 1.3 + 7.0)), hash(vec2(n * 2.1 + 3.0, n * 0.7)));
    }

    float lineDist(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a;
      vec2 ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return length(pa - ba * h);
    }

    // 0 — agent-graph: a small ring of drifting nodes, connected edges,
    // one pulse traveling the ring.
    float agentGraph(vec2 uv, float t, float seed) {
      const int N = 6;
      vec2 nodes[N];
      for (int i = 0; i < N; i++) {
        float fi = float(i) + seed * 9.0;
        vec2 base = hash2(fi) * 0.72 + 0.14;
        nodes[i] = base + 0.025 * vec2(sin(t * 0.35 + fi), cos(t * 0.3 + fi * 1.4));
      }
      float glow = 0.0;
      for (int i = 0; i < N; i++) {
        int j = (i + 1 < N) ? i + 1 : 0;
        float d = lineDist(uv, nodes[i], nodes[j]);
        glow += exp(-d * 46.0) * 0.55;
      }
      for (int i = 0; i < N; i++) {
        glow += exp(-length(uv - nodes[i]) * 70.0) * 0.8;
      }
      float pulseT = fract(t * 0.22 + seed);
      float seg = pulseT * float(N);
      int idx = int(floor(seg));
      int nextIdx = (idx + 1 < N) ? idx + 1 : 0;
      vec2 pa = nodes[idx];
      vec2 pb = nodes[nextIdx];
      vec2 pulsePos = mix(pa, pb, fract(seg));
      glow += exp(-length(uv - pulsePos) * 90.0) * 1.6;
      return glow;
    }

    // 1 — signal-flow: parallel wavy "channel" lines with a flowing dash
    // pattern and occasional reroute/branch points.
    float signalFlow(vec2 uv, float t, float seed) {
      float v = 0.0;
      const int LANES = 4;
      for (int i = 0; i < LANES; i++) {
        float fi = float(i);
        float yBase = 0.16 + fi * 0.23 + seed * 0.04;
        float y = yBase + sin(uv.x * 7.0 + t * 1.1 + fi * 2.1) * 0.028;
        float d = abs(uv.y - y);
        float line = exp(-d * 100.0) * 0.5;
        float dash = smoothstep(0.35, 0.65, fract(uv.x * 5.0 - t * 1.4 + fi * 0.6));
        v += line * (0.35 + dash * 0.85);
        float bx = fract(fi * 0.41 + seed * 0.7 + 0.15);
        v += exp(-length(uv - vec2(bx, y)) * 65.0) * 0.65;
      }
      return v;
    }

    // 2 — audit-trail: fixed-length log-lines of varying width plus a
    // scanning highlight bar sweeping down the frame.
    float auditTrail(vec2 uv, float t, float seed) {
      float v = 0.0;
      const int ROWS = 7;
      for (int i = 0; i < ROWS; i++) {
        float fi = float(i);
        float y = (fi + 0.5) / float(ROWS);
        float len = 0.28 + 0.52 * hash(vec2(fi, seed * 11.0 + 2.0));
        float d = lineDist(uv, vec2(0.06, y), vec2(0.06 + len, y));
        v += exp(-d * 130.0) * 0.5;
      }
      float scanY = fract(t * 0.14 + seed);
      v += exp(-abs(uv.y - scanY) * 26.0) * 0.85;
      return v;
    }

    // 3 — vision-scan: a rotating radar sweep + concentric rings.
    float visionScan(vec2 uv, float t, float seed) {
      vec2 p = uv - 0.5;
      float r = length(p);
      float ang = atan(p.y, p.x);
      float sweepAngle = fract(t * 0.22 + seed) * 6.28318 - 3.14159;
      float angDiff = mod(ang - sweepAngle + 3.14159, 6.28318) - 3.14159;
      float beam = exp(-abs(angDiff) * 2.6) * smoothstep(0.48, 0.0, r);
      float rings = 0.0;
      for (int i = 1; i <= 3; i++) {
        float rr = float(i) * 0.14;
        rings += exp(-abs(r - rr) * 90.0) * 0.28;
      }
      return beam * 1.3 + rings;
    }

    void main() {
      vec2 uv = vUv;
      float t = uTime;
      float seed = uSeed;

      float intensity;
      if (uMotif < 0.5) intensity = agentGraph(uv, t, seed);
      else if (uMotif < 1.5) intensity = signalFlow(uv, t, seed);
      else if (uMotif < 2.5) intensity = auditTrail(uv, t, seed);
      else intensity = visionScan(uv, t, seed);

      // Cursor reactivity: brighten nodes/lines near the pointer, same
      // uMouse/uStrength contract as ImageShaderMaterial's ripple.
      float cursorBoost = exp(-distance(uv, uMouse) * 7.0) * uStrength;
      intensity += cursorBoost * 0.7;

      vec3 bg = mix(vec3(0.039, 0.051, 0.075), vec3(0.067, 0.086, 0.122), uv.y);
      vec3 amber = vec3(1.0, 0.416, 0.169);
      vec3 color = bg + amber * intensity;

      gl_FragColor = vec4(color, uOpacity);
    }
  `,
);

extend({ ProjectShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    projectShaderMaterial: ThreeElement<typeof ProjectShaderMaterial>;
  }
}
