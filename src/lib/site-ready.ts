/**
 * Tiny readiness bus: the Preloader signals completion once;
 * any component (Hero intro, etc.) can subscribe — late subscribers
 * fire immediately. Avoids prop-drilling a "loaded" flag.
 */

let ready = false;
const subs = new Set<() => void>();

export function signalSiteReady() {
  if (ready) return;
  ready = true;
  subs.forEach((fn) => fn());
  subs.clear();
}

export function onSiteReady(fn: () => void): () => void {
  if (ready) {
    fn();
    return () => {};
  }
  subs.add(fn);
  return () => subs.delete(fn);
}

export function isSiteReady() {
  return ready;
}
