/**
 * Shared position math for the agent-pipeline spine — used by BOTH
 * SpineLayer.tsx (the WebGL nodes/pulses) and SpineNodesOverlay.tsx (their
 * real DOM click-targets), so a button can never visibly drift from its
 * dot. Extracted rather than duplicated after the two started as one file.
 */

import type { SectionKey } from "./types";

export const SECTION_ORDER: SectionKey[] = [
  "manifesto",
  "proof",
  "experience",
  "process",
  "capabilities",
  "contact",
];

/** Real DOM id per section — not always the same as the SectionKey (e.g.
 *  "capabilities" section is `id="stack"`, matching Nav/content elsewhere). */
export const SECTION_DOM_ID: Record<SectionKey, string> = {
  manifesto: "manifesto",
  proof: "proof",
  experience: "experience",
  process: "process",
  capabilities: "stack",
  contact: "contact",
};

/** Vertical offset from a section's top edge to its node — roughly where
 *  a heading/eyebrow sits, without depending on any specific child DOM. */
export const NODE_Y_OFFSET = 110;

const MAXW = 1560; // mirrors tokens.css --maxw
export function gutterPx(vw: number) {
  return Math.min(56, Math.max(20, vw * 0.04)); // mirrors --gutter's clamp(1.25rem,4vw,3.5rem)
}
export function columnScreenX(vw: number) {
  const g = gutterPx(vw);
  return Math.max(g, (vw - MAXW) / 2 + g); // left edge of .shell's content box
}

/** Orthographic screen→world Y conversion (1 world unit = 1 CSS px, camera
 *  centered) — used only by SpineLayer's WebGL math. */
export function worldY(vh: number, screenY: number) {
  return vh / 2 - screenY;
}

/** Deterministic (time-independent) positional wobble shared by the WebGL
 *  nodes and their DOM click-targets so they never visibly separate.
 *  SpineLayer layers a small extra time-based jitter on top of this for
 *  its own purely-cosmetic glow — the DOM overlay doesn't replicate that
 *  few-px jitter; a real-sized click target stays aligned without it. */
export function nodeWobbleX(vy: number, index: number) {
  return Math.sin(vy * 0.01 + index * 1.7) * 9;
}
