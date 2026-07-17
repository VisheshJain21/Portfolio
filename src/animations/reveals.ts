"use client";

/**
 * Reusable scroll-reveal primitives (SOP §3.3: reveal by masking,
 * slow-in fast-settle, one intentional motion per element).
 * Every section builds from these — no bespoke tweens in sections.
 */

import { gsap, EASE } from "./gsap";

/** Rise `.line-inner` children of `.line-mask` wrappers into view. */
export function revealLines(
  scope: HTMLElement,
  opts: { delay?: number; onScroll?: boolean; stagger?: number } = {},
) {
  const lines = scope.querySelectorAll<HTMLElement>(".line-mask > .line-inner");
  if (!lines.length) return;
  gsap.fromTo(
    lines,
    { yPercent: 115 },
    {
      yPercent: 0,
      duration: 1.1,
      ease: EASE,
      delay: opts.delay ?? 0,
      stagger: opts.stagger ?? 0.09,
      ...(opts.onScroll
        ? {
            scrollTrigger: {
              trigger: scope,
              start: "top 78%",
              once: true,
            },
          }
        : {}),
    },
  );
}

/** Fade-and-rise a set of elements (cards, rows, meta blocks). */
export function revealUp(
  targets: HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>,
  trigger: HTMLElement,
  opts: { stagger?: number; y?: number; start?: string } = {},
) {
  gsap.fromTo(
    targets,
    { autoAlpha: 0, y: opts.y ?? 36 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 1,
      ease: EASE,
      stagger: opts.stagger ?? 0.1,
      scrollTrigger: {
        trigger,
        start: opts.start ?? "top 80%",
        once: true,
      },
    },
  );
}

/** Draw a hairline from left to right when it enters the viewport. */
export function drawHairline(el: HTMLElement) {
  gsap.fromTo(
    el,
    { scaleX: 0, transformOrigin: "left center" },
    {
      scaleX: 1,
      duration: 1.2,
      ease: EASE,
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    },
  );
}
