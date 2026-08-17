import type * as THREE from "three";

/**
 * The runtime shape of a <projectShaderMaterial> instance — the
 * procedural, textureless per-project motif material (project-shader.ts).
 * drei's shaderMaterial() adds a direct getter/setter for each uniform
 * key (material.uStrength = x  →  material.uniforms.uStrength.value = x),
 * which is what lets useFrame write uniforms without touching
 * `.uniforms.x.value` boilerplate on every frame.
 */
export type ProjectShaderMaterialImpl = THREE.ShaderMaterial & {
  uMotif: number;
  uSeed: number;
  uMouse: THREE.Vector2;
  uStrength: number;
  uTime: number;
  uOpacity: number;
};
