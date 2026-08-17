"use client";

/**
 * HeroScene — the cinematic 3D signature (SOP §3.4; "make it 3D like Lusion"
 * pass 2026-07-16). A living AI core: a distorting icosahedron nucleus inside
 * a wireframe shell, orbiting instanced agent nodes wired by faint arcs, amber
 * signal pulses, floating atmospheric particles, and a camera that both
 * parallaxes to the cursor AND is driven by scroll — the scene dollies out and
 * rotates as you descend, so the 3D itself tells the scroll story.
 *
 * Perf/resilience contract (unchanged): DPR-capped, frameloop pauses off-screen
 * (single persistent context), mobile tier drops particles/bloom/distort detail,
 * reduced-motion & no-WebGL fall back to a static glow (handled by the gate).
 */

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

const SIGNAL = new THREE.Color("#ff6a2b");
const BONE = new THREE.Color("#ece7de");
const IRIS = new THREE.Color("#7c8698");

/** Scroll progress 0→1 across the first viewport (Lenis updates window.scrollY). */
function scrollProgress() {
  if (typeof window === "undefined") return 0;
  return Math.min(1, Math.max(0, window.scrollY / (window.innerHeight || 1)));
}

type AgentNode = {
  basePos: THREE.Vector3;
  phase: number;
  scale: number;
  depth: number;
};

function makeNodes(count: number): AgentNode[] {
  const nodes: AgentNode[] = [];
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = (1 + Math.sqrt(5)) * Math.PI * i;
    const orbitR = 2.5 + Math.random() * 1.9;
    nodes.push({
      basePos: new THREE.Vector3(Math.cos(theta) * r * orbitR, y * orbitR, Math.sin(theta) * r * orbitR),
      phase: Math.random() * Math.PI * 2,
      scale: 0.03 + Math.random() * 0.055,
      depth: Math.random(),
    });
  }
  return nodes;
}

/** Distorting nucleus + wireframe shell. */
function Core({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.12;
      ref.current.rotation.x += dt * 0.045;
    }
  });
  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[1.05, mobile ? 3 : 6]} />
        <MeshDistortMaterial
          color="#1c0f08"
          emissive={SIGNAL}
          emissiveIntensity={0.32}
          roughness={0.35}
          metalness={0.55}
          distort={mobile ? 0.28 : 0.4}
          speed={1.7}
        />
      </mesh>
      <mesh scale={1.4}>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshBasicMaterial color={SIGNAL} wireframe transparent opacity={0.16} />
      </mesh>
      <mesh scale={0.62}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={SIGNAL} transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

function AgentField({ count, mobile }: { count: number; mobile: boolean }) {
  const nodes = useMemo(() => makeNodes(count), [count]);
  const groupRef = useRef<THREE.Group>(null);
  const instRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const edges = useMemo(() => {
    const list: [number, number][] = [];
    for (let a = 0; a < nodes.length; a++) {
      const near = nodes
        .map((n, b) => ({ b, d: a === b ? Infinity : nodes[a].basePos.distanceTo(n.basePos) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, mobile ? 1 : 2);
      for (const { b } of near) {
        const key: [number, number] = a < b ? [a, b] : [b, a];
        if (!list.some(([x, y]) => x === key[0] && y === key[1])) list.push(key);
      }
    }
    return list;
  }, [nodes, mobile]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const sp = scrollProgress();
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.05;
      // Scroll drives an extra tilt + gentle expansion of the whole field.
      groupRef.current.rotation.z = sp * 0.5;
      const spread = 1 + sp * 0.35;
      groupRef.current.scale.setScalar(spread);
    }
    nodes.forEach((n, i) => {
      const wob = Math.sin(t * 0.9 + n.phase) * 0.06;
      dummy.position.copy(n.basePos).multiplyScalar(1 + wob);
      const pulse = 1 + Math.sin(t * 2 + n.phase * 3) * 0.3;
      dummy.scale.setScalar(n.scale * pulse);
      dummy.updateMatrix();
      instRef.current?.setMatrixAt(i, dummy.matrix);
    });
    if (instRef.current) instRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={instRef} args={[undefined, undefined, nodes.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={BONE} emissive={BONE} emissiveIntensity={0.85} toneMapped={false} />
      </instancedMesh>
      {edges.map(([a, b], i) => (
        <Line
          key={i}
          // plain tuples, not Vector3s — keeps circular Three objects out
          // of JSX props that dev tooling might try to serialize
          points={[
            nodes[a].basePos.toArray() as [number, number, number],
            nodes[b].basePos.toArray() as [number, number, number],
          ]}
          color={IRIS}
          transparent
          opacity={0.2}
          lineWidth={1}
        />
      ))}
      <SignalPulses nodes={nodes} edges={edges} mobile={mobile} />
    </group>
  );
}

function SignalPulses({
  nodes,
  edges,
  mobile,
}: {
  nodes: AgentNode[];
  edges: [number, number][];
  mobile: boolean;
}) {
  const count = mobile ? 4 : 8;
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const state = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        edge: edges[(Math.random() * edges.length) | 0] ?? [0, 1],
        t: Math.random(),
        speed: 0.25 + Math.random() * 0.4,
      })),
    [count, edges],
  );
  useFrame((_, dt) => {
    state.forEach((p, i) => {
      p.t += dt * p.speed;
      if (p.t > 1) {
        p.t = 0;
        p.edge = edges[(Math.random() * edges.length) | 0] ?? [0, 1];
      }
      const A = nodes[p.edge[0]]?.basePos;
      const B = nodes[p.edge[1]]?.basePos;
      const m = refs.current[i];
      if (A && B && m) m.position.lerpVectors(A, B, p.t);
    });
  });
  return (
    <>
      {state.map((_, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshBasicMaterial color={SIGNAL} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/** The postprocessing composer disables the renderer's auto-clear while
 *  it owns the frame. If the composer unmounts mid-session (our bloom-drop
 *  resilience path after a GPU context loss), clearing must be restored —
 *  otherwise every frame accumulates over the last and the scene "smudges"
 *  until a full reload. */
function ClearGuard({ composerActive }: { composerActive: boolean }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (!composerActive) {
      gl.autoClear = true;
      gl.clear();
    }
  }, [composerActive, gl]);
  return null;
}

/** Kicks one render when the frameloop resumes ("never" → "always").
 *  Without this, a paused canvas can stay frozen on its last frame after
 *  scrolling back — the classic frameloop-resume-without-invalidate bug. */
function ResumeKick({ paused }: { paused: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!paused) invalidate();
  }, [paused, invalidate]);
  return null;
}

/** Camera: cursor parallax + scroll-driven dolly-out and lift.
 *  On mobile the base distance is larger so the core doesn't swamp the
 *  full-width copy behind it. */
function CameraRig({ interactive, mobile }: { interactive: boolean; mobile: boolean }) {
  const { camera, pointer } = useThree();
  const baseZ = mobile ? 9 : 6.2;
  useFrame(() => {
    const sp = scrollProgress();
    const px = interactive ? pointer.x * 0.9 : 0;
    const py = interactive ? pointer.y * 0.5 : 0;
    camera.position.x += (px - camera.position.x) * 0.04;
    camera.position.y += (py + sp * 1.6 - camera.position.y) * 0.045;
    camera.position.z += (baseZ + sp * 3.4 - camera.position.z) * 0.05;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene({
  mobile,
  interactive,
  paused,
  bloom,
  onLost,
  onRestored,
}: {
  mobile: boolean;
  interactive: boolean;
  paused: boolean;
  bloom: boolean;
  onLost?: () => void;
  onRestored?: () => void;
}) {
  const nodeCount = mobile ? 16 : 30;
  const dpr = useMemo<[number, number]>(() => [1, mobile ? 1.25 : 1.5], [mobile]);
  const useBloom = bloom && !mobile;
  const usePointer = interactive && !paused;

  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0, mobile ? 9 : 6.2], fov: 42 }}
      frameloop={paused ? "never" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "default" }}
      style={{ position: "absolute", inset: 0 }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        canvas.addEventListener(
          "webglcontextlost",
          (e: Event) => {
            e.preventDefault();
            onLost?.();
          },
          false,
        );
        canvas.addEventListener("webglcontextrestored", () => onRestored?.(), false);
      }}
    >
      <ambientLight intensity={0.45} />
      <pointLight position={[4, 3, 5]} intensity={34} color={SIGNAL} />
      <pointLight position={[-4, -2, -3]} intensity={14} color={IRIS} />
      <Suspense fallback={null}>
        <Core mobile={mobile} />
        <AgentField count={nodeCount} mobile={mobile} />
        {!mobile && (
          <Sparkles count={90} scale={[14, 9, 8]} size={2.2} speed={0.25} color={BONE} opacity={0.5} noise={1.4} />
        )}
      </Suspense>
      <CameraRig interactive={usePointer} mobile={mobile} />
      {useBloom && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.75} luminanceThreshold={0.2} luminanceSmoothing={0.3} />
          <ChromaticAberration offset={[0.0007, 0.0005]} radialModulation={false} modulationOffset={0} />
          <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.32} />
          <Vignette eskil={false} offset={0.15} darkness={0.62} />
        </EffectComposer>
      )}
      <ResumeKick paused={paused} />
      <ClearGuard composerActive={useBloom} />
    </Canvas>
  );
}
