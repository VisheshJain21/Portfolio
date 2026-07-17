"use client";

/**
 * Single GSAP entry point — import gsap/ScrollTrigger from here only,
 * so plugin registration happens exactly once.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // Debug handle for driving the ticker from devtools/automation
  // (rAF freezes in hidden tabs; harmless in production).
  (window as unknown as { __gsap?: typeof gsap }).__gsap = gsap;
}

export { gsap, ScrollTrigger };

/** Shared expressive ease — matches --ease-out token. */
export const EASE = "expo.out";
