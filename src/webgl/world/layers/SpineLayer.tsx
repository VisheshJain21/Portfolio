"use client";

/**
 * SpineLayer — the living agent pipeline. Six nodes (one per tracked
 * section) plus five inter-node signal pulses share one InstancedMesh —
 * indices 0..5 are the nodes (brighten/grow as their section reaches
 * peak visibility, same "arrival" curve every other layer uses); indices
 * 6..10 are the pulses — not decorative loops, but a direct function of
 * the destination section's own scroll progress (0 = signal still
 * waiting at the node above, 0.5 = arrived, only visible mid-transit)
 * so a signal travels forward when you scroll down and pulls back when
 * you scroll up, exactly like the pipelines this is modeling.
 *
 * A connecting line between the nodes was part of the original build
 * but was removed on user feedback (it read as a stray line cutting
 * through content rather than a deliberate design element) — the nodes
 * and traveling pulses carry the "pipeline" idea on their own.
 *
 * Perf discipline: one InstancedMesh (11 instances, matrices rebuilt
 * with a single reused THREE.Object3D per frame — nowhere near the
 * "per-frame JS loop over many instances" the plan warns against).
 * Column position mirrors `.shell`'s own max-width/gutter math
 * (tokens.css) rather than hard-coding a pixel value that would drift
 * from the real layout.
 *
 * Node/pulse world positions fall naturally off-frame when their section
 * is scrolled far away (same trick as every other layer: presence comes
 * from live rect math, not a visibility toggle) — so the spine simply
 * isn't drawn behind Hero or past Footer without any extra branching.
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDeviceTier } from "@/hooks/useDeviceTier";
import { faultFX, FAULT_DURATION_MS, faultEnvelope } from "@/lib/fault-bus";
import "../spine-shader";
import { SECTION_ORDER, columnScreenX, worldY, nodeWobbleX, NODE_Y_OFFSET } from "../spine-geometry";
import { spineHover } from "../spine-hover";
import type { SpineNodeMaterial } from "../spine-shader";
import type { SectionKey, SectionProgress } from "../types";

const AMBER = new THREE.Color("#ff6a2b"); // --signal
const FAULT_COLOR = new THREE.Color("#ff3355"); // --fault
const NUM_NODES = SECTION_ORDER.length;
const NUM_PULSES = NUM_NODES - 1;
const TOTAL_INSTANCES = NUM_NODES + NUM_PULSES;

export default function SpineLayer({
  getSectionProgress,
}: {
  getSectionProgress: () => ReadonlyMap<SectionKey, SectionProgress>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<SpineNodeMaterial>(null);
  const tier = useDeviceTier();

  const nodeX = useRef(new Float32Array(NUM_NODES));
  const nodeY = useRef(new Float32Array(NUM_NODES));
  const nodeActive = useRef(new Float32Array(NUM_NODES));
  const seeded = useRef(new Array<boolean>(NUM_NODES).fill(false));
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ size, clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const progress = getSectionProgress();
    const vw = size.width;
    const vh = size.height;
    const colX = columnScreenX(vw);
    const t = clock.elapsedTime;

    // Fault-and-heal color: reads the bus directly (performance.now()-based,
    // independent of this canvas's own clock) — see lib/fault-bus.ts.
    const faultT = faultFX.active ? (performance.now() - faultFX.startedAt) / FAULT_DURATION_MS : 0;
    const faultIntensity = faultFX.active ? faultEnvelope(faultT) : 0;
    if (matRef.current) matRef.current.uColor.copy(AMBER).lerp(FAULT_COLOR, faultIntensity);

    for (let i = 0; i < NUM_NODES; i++) {
      const p = progress.get(SECTION_ORDER[i]);
      if (!p) continue;
      const screenY = p.rect.y + NODE_Y_OFFSET;
      const targetY = worldY(vh, screenY);
      const targetX = colX - vw / 2 + nodeWobbleX(targetY, i) + Math.sin(t * 0.35 + i * 2.3) * 3;

      if (!seeded.current[i]) {
        nodeX.current[i] = targetX;
        nodeY.current[i] = targetY;
        seeded.current[i] = true;
      } else {
        nodeX.current[i] += (targetX - nodeX.current[i]) * 0.1;
        nodeY.current[i] += (targetY - nodeY.current[i]) * 0.1;
      }
      const baseActive = p.inView ? Math.max(0, 1 - Math.abs(p.progress - 0.5) * 2) : 0;
      nodeActive.current[i] = spineHover.index === i ? Math.max(baseActive, 0.85) : baseActive;
    }

    for (let i = 0; i < NUM_NODES; i++) {
      const s = 10 + nodeActive.current[i] * 14;
      dummy.position.set(nodeX.current[i], nodeY.current[i], 0);
      dummy.scale.set(s, s, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    const skipPulses = tier?.mobile ?? false;
    for (let j = 0; j < NUM_PULSES; j++) {
      let s = 0.001;
      let x = nodeX.current[j];
      let y = nodeY.current[j];
      if (!skipPulses) {
        const dest = progress.get(SECTION_ORDER[j + 1]);
        const raw = dest ? dest.progress : 0;
        const travel = THREE.MathUtils.clamp(raw / 0.5, 0, 1);
        const vis = 4 * travel * (1 - travel);
        x = THREE.MathUtils.lerp(nodeX.current[j], nodeX.current[j + 1], travel);
        y = THREE.MathUtils.lerp(nodeY.current[j], nodeY.current[j + 1], travel);
        s = Math.max(4 + vis * 14, 0.001);
      }
      dummy.position.set(x, y, 0);
      dummy.scale.set(s, s, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(NUM_NODES + j, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, TOTAL_INSTANCES]}>
      <planeGeometry args={[1, 1]} />
      <spineNodeMaterial ref={matRef} uColor={AMBER} uOpacity={0.75} transparent depthWrite={false} />
    </instancedMesh>
  );
}
