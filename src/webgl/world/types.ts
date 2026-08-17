import type * as THREE from "three";
import type { SectionKey } from "@/lib/section-anchors";

export type { SectionKey };

export type SectionRect = { x: number; y: number; width: number; height: number };

export type SectionProgress = {
  /** 0 as the section's top first enters the viewport from below, 1 once
   *  its bottom has exited the top — the same "how far scrolled through
   *  the viewport" idea as HeroScene's own local scrollProgress(). */
  progress: number;
  inView: boolean;
  rect: SectionRect;
};

/** Runtime shape of a <glowMaterial> instance — mirrors webgl/work/types.ts's
 *  ProjectShaderMaterialImpl pattern (drei's shaderMaterial() adds a direct
 *  getter/setter per uniform key). */
export type GlowMaterialImpl = THREE.ShaderMaterial & {
  uColor: THREE.Color;
  uCenter: THREE.Vector2;
  uRadius: number;
  uIntensity: number;
};
