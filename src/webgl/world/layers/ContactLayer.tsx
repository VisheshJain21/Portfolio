"use client";

/**
 * ContactLayer — the boldest non-Hero 3D moment, and deliberately the
 * last one built: Contact carries the site's densest interactive DOM
 * (a form, a CTA, 5 links), so the pointer-events-safety pattern needed
 * validating on five lower-risk sections first. It now has been.
 *
 * A smaller, calmer echo of Hero's molten core (same drei primitive —
 * MeshDistortMaterial on an icosahedron with an amber emissive glow —
 * reused directly, not copied into a second scene file) bookending the
 * site: Hero opens with the full instrument, Contact closes with a
 * quieter reprise. Replaces the section's old CSS-only radial-gradient
 * glow (`background: radial-gradient(90% 70% at 50% 115%, ...)`),
 * bottom-center so it never sits behind the form fields or CTA text.
 *
 * First pass positioned the core mostly BELOW the section's bottom edge
 * (rect.height * 1.02) with emissiveIntensity 0.3 — a full visual audit
 * found only a faint hint of glow peeking into frame, nowhere near
 * "boldest non-Hero moment". Brought further into view and brightened;
 * still bottom-anchored and still behind the copy.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import type { SectionKey, SectionProgress } from "../types";

const SIGNAL = new THREE.Color("#ff6a2b");

export default function ContactLayer({
  getSectionProgress,
}: {
  getSectionProgress: () => ReadonlyMap<SectionKey, SectionProgress>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);

  useFrame(({ size }, dt) => {
    const group = groupRef.current;
    if (!group) return;

    if (coreRef.current) {
      coreRef.current.rotation.y += dt * 0.06;
      coreRef.current.rotation.x += dt * 0.02;
    }

    const p = getSectionProgress().get("contact");
    const inView = !!p?.inView;
    const targetScale = inView ? 170 : 0.001;
    group.scale.x += (targetScale - group.scale.x) * 0.05;
    group.scale.y = group.scale.z = group.scale.x;

    if (!p) return;
    // Bottom-center of the section — brought up from the old 1.02x (mostly
    // below the fold) to 0.9x so a real amount of the core sits in view,
    // still low enough to stay behind the copy/form above it.
    const cx = p.rect.x + p.rect.width * 0.5 - size.width / 2;
    const cy = size.height / 2 - (p.rect.y + p.rect.height * 0.9);
    group.position.x += (cx - group.position.x) * 0.08;
    group.position.y += (cy - group.position.y) * 0.08;
  });

  return (
    <group ref={groupRef} scale={0.001}>
      <group ref={coreRef}>
        <pointLight color={SIGNAL} intensity={16} distance={8} />
        <mesh>
          <icosahedronGeometry args={[1, 4]} />
          <MeshDistortMaterial
            color="#1c0f08"
            emissive={SIGNAL}
            emissiveIntensity={0.55}
            roughness={0.4}
            metalness={0.5}
            distort={0.32}
            speed={1.1}
          />
        </mesh>
        <mesh scale={0.6}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshBasicMaterial color={SIGNAL} transparent opacity={0.18} />
        </mesh>
      </group>
    </group>
  );
}
