"use client";

/**
 * SpineLayer — the living agent pipeline. A single thin amber thread runs
 * through the six tracked sections in page order, each a node on the
 * path. On the shared InstancedMesh, indices 0..5 are the nodes
 * (brighten/grow as their section reaches peak visibility, same
 * "arrival" curve every other layer uses); indices 6..10 are the five
 * inter-node signals — not decorative loops, but a direct function of
 * the destination section's own scroll progress (0 = signal still
 * waiting at the node above, 0.5 = arrived, only visible mid-transit)
 * so a signal travels forward when you scroll down and pulls back when
 * you scroll up, exactly like the pipelines this is modeling.
 *
 * Perf discipline: one native `<line>` (a plain THREE.Line, not drei's
 * fat-line `<Line>` — that one's Line2/LineMaterial shader is heavy
 * enough to compile that its first real-geometry frame blew the 4x-
 * throttle scroll budget in testing; a thin schematic trace reads just
 * as well here and is essentially free) + one InstancedMesh (11
 * instances, matrices rebuilt with a single reused THREE.Object3D per
 * frame — nowhere near the "per-frame JS loop over many instances" the
 * plan warns against). Column position mirrors `.shell`'s own max-
 * width/gutter math (tokens.css) rather than hard-coding a pixel value
 * that would drift from the real layout.
 *
 * The line's position buffer is written in place every frame
 * (`attribute.array[...] = ...; attribute.needsUpdate = true`) rather
 * than replaced — the same "mutate, don't reallocate" discipline as
 * every other per-frame write in webgl/.
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
import "../spine-shader";
import type { SectionKey, SectionProgress } from "../types";

const AMBER = new THREE.Color("#ff6a2b"); // --signal
const SECTION_ORDER: SectionKey[] = [
  "manifesto",
  "proof",
  "experience",
  "process",
  "capabilities",
  "contact",
];
const NUM_NODES = SECTION_ORDER.length;
const NUM_PULSES = NUM_NODES - 1;
const TOTAL_INSTANCES = NUM_NODES + NUM_PULSES;

const MAXW = 1560; // mirrors tokens.css --maxw
function gutterPx(vw: number) {
  return Math.min(56, Math.max(20, vw * 0.04)); // mirrors --gutter's clamp(1.25rem,4vw,3.5rem)
}
function columnScreenX(vw: number) {
  const g = gutterPx(vw);
  return Math.max(g, (vw - MAXW) / 2 + g); // left edge of .shell's content box
}

export default function SpineLayer({
  getSectionProgress,
}: {
  getSectionProgress: () => ReadonlyMap<SectionKey, SectionProgress>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tier = useDeviceTier();

  const nodeX = useRef(new Float32Array(NUM_NODES));
  const nodeY = useRef(new Float32Array(NUM_NODES));
  const nodeActive = useRef(new Float32Array(NUM_NODES));
  const seeded = useRef(new Array<boolean>(NUM_NODES).fill(false));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const linePositions = useMemo(() => new Float32Array(NUM_NODES * 3), []);

  // A plain THREE.Line built imperatively via `primitive` — R3F's lowercase
  // `<line>` intrinsic collides with SVG's, and its `threeLine` alias needs
  // an explicit extend() this project has no other reason to add, so the
  // primitive escape hatch (the documented way to use a 3rd-party/ambiguous
  // Three.js object declaratively) is the simpler, guaranteed-working path.
  const lineObj = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const material = new THREE.LineBasicMaterial({ color: AMBER, transparent: true, opacity: 0.4 });
    const obj = new THREE.Line(geometry, material);
    obj.frustumCulled = false;
    return obj;
  }, [linePositions]);

  useFrame(({ size, clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const progress = getSectionProgress();
    const vw = size.width;
    const vh = size.height;
    const colX = columnScreenX(vw);
    const t = clock.elapsedTime;

    for (let i = 0; i < NUM_NODES; i++) {
      const p = progress.get(SECTION_ORDER[i]);
      if (!p) continue;
      const screenY = p.rect.y + 110;
      const targetY = vh / 2 - screenY;
      const targetX = colX - vw / 2 + Math.sin(targetY * 0.01 + i * 1.7) * 9 + Math.sin(t * 0.35 + i * 2.3) * 3;

      if (!seeded.current[i]) {
        nodeX.current[i] = targetX;
        nodeY.current[i] = targetY;
        seeded.current[i] = true;
      } else {
        nodeX.current[i] += (targetX - nodeX.current[i]) * 0.1;
        nodeY.current[i] += (targetY - nodeY.current[i]) * 0.1;
      }
      nodeActive.current[i] = p.inView ? Math.max(0, 1 - Math.abs(p.progress - 0.5) * 2) : 0;
    }

    for (let i = 0; i < NUM_NODES; i++) {
      const s = 10 + nodeActive.current[i] * 14;
      dummy.position.set(nodeX.current[i], nodeY.current[i], 0);
      dummy.scale.set(s, s, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      linePositions[i * 3] = nodeX.current[i];
      linePositions[i * 3 + 1] = nodeY.current[i];
      linePositions[i * 3 + 2] = 0;
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

    (lineObj.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <>
      <primitive object={lineObj} />
      <instancedMesh ref={meshRef} args={[undefined, undefined, TOTAL_INSTANCES]}>
        <planeGeometry args={[1, 1]} />
        <spineNodeMaterial uColor={AMBER} uOpacity={0.75} transparent depthWrite={false} />
      </instancedMesh>
    </>
  );
}
