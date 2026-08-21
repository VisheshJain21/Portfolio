/**
 * Section anchor registry — tiny mutable store (no React) letting the
 * World canvas (webgl/world/) find each section's root DOM element
 * without prop-drilling through the page's Server Component tree.
 * Same idiom as warp-fx.ts / site-ready.ts.
 *
 * Sections register themselves once on mount (a single call added to
 * their existing setup useEffect) and never unregister in practice —
 * this is a one-page site where these sections live for the page's
 * whole lifetime.
 */

export type SectionKey =
  | "manifesto"
  | "proof"
  | "experience"
  | "process"
  | "capabilities"
  | "contact";

const anchors = new Map<SectionKey, HTMLElement>();

export function registerAnchor(key: SectionKey, el: HTMLElement | null) {
  if (el) anchors.set(key, el);
  else anchors.delete(key);
}

export function getAnchors(): ReadonlyMap<SectionKey, HTMLElement> {
  return anchors;
}
