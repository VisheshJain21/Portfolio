import type * as THREE from "three";

/**
 * The runtime shape of an <imageShaderMaterial> instance. drei's
 * shaderMaterial() adds a direct getter/setter for each uniform key
 * (material.uStrength = x  →  material.uniforms.uStrength.value = x),
 * which is what lets useFrame write uniforms without touching
 * `.uniforms.x.value` boilerplate on every frame.
 */
export type ImageShaderMaterialImpl = THREE.ShaderMaterial & {
  uMap: THREE.Texture | null;
  uMouse: THREE.Vector2;
  uStrength: number;
  uTime: number;
  uOpacity: number;
};
