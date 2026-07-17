"use client";

/**
 * Warp Cut — the signature nav transition controller.
 * One GSAP timeline (~950ms): impact (shock ring + postFX spike) →
 * kinetic type blow-up → turbulent liquid wipe (scroll snaps underneath
 * while covered) → landing (type slams home, pill indicator morphs,
 * section reveals fire, Lenis unlocks, focus moves to the heading).
 *
 * Contracts:
 *  - singleton: re-triggering kills the running timeline and restarts clean
 *  - locks Lenis only (no overflow toggling → no scrollbar flash/layout shift)
 *  - reduced motion: fast crossfade + instant scroll, nothing else
 *  - shader spike + shock ring gate on warpFX.gpuTier ("low" skips them)
 */

import { gsap, ScrollTrigger } from "@/animations/gsap";
import { getLenis } from "@/lib/lenis-store";
import { warpFX } from "@/lib/warp-fx";

type WarpElements = {
  root: HTMLElement | null;
  panel: HTMLElement | null;
  ring: HTMLElement | null;
  type: HTMLElement | null;
  fade: HTMLElement | null;
};

let els: WarpElements | null = null;
let tl: gsap.core.Timeline | null = null;

export function registerWarpElements(e: WarpElements | null) {
  els = e;
}

export type WarpOptions = {
  label: string;
  clickX?: number;
  clickY?: number;
  /** The clicked nav link — stays frozen while the rest of the nav dims. */
  holdEl?: HTMLElement | null;
  /** The fixed header — raised above the wipe + dim state for the duration. */
  navEl?: HTMLElement | null;
  /** Liquid pill indicator morph target (desktop links row). */
  indicator?: { el: HTMLElement; x: number; w: number } | null;
};

function snapTo(target: HTMLElement) {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
  else window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY);
  ScrollTrigger.update();
}

function focusHeading(target: HTMLElement) {
  const heading = target.querySelector<HTMLElement>("h1, h2, h3");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
}

function cleanup(opts?: WarpOptions) {
  if (!els) return;
  const { panel, ring, type, fade } = els;
  gsap.set([panel, ring, type, fade].filter(Boolean) as HTMLElement[], {
    clearProps: "all",
    visibility: "hidden",
  });
  const main = document.querySelector("main");
  if (main) gsap.set(main, { clearProps: "transform,opacity,visibility" });
  opts?.navEl?.removeAttribute("data-warp");
  opts?.holdEl?.removeAttribute("data-warp-hold");
  warpFX.spike = 0;
}

let lastOpts: WarpOptions | undefined;

export function warpTo(href: string, opts: WarpOptions) {
  const target = document.querySelector<HTMLElement>(href);
  if (!target) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Restart cleanly if already running — no queued/stacked animations.
  if (tl) {
    tl.kill();
    tl = null;
    cleanup(lastOpts);
    getLenis()?.start();
  }
  lastOpts = opts;

  // ---- Reduced motion: crossfade + instant scroll, done. ----
  if (reduced || !els?.panel || !els.type) {
    const fade = els?.fade;
    if (!fade) {
      snapTo(target);
      focusHeading(target);
      return;
    }
    tl = gsap
      .timeline({
        onComplete: () => {
          cleanup(opts);
          focusHeading(target);
          tl = null;
        },
      })
      .set(fade, { visibility: "visible" })
      .to(fade, { opacity: 1, duration: 0.12, ease: "power1.in" })
      .add(() => snapTo(target))
      .to(fade, { opacity: 0, duration: 0.22, ease: "power1.out" });
    return;
  }

  const { panel, ring, type } = els;
  const lenis = getLenis();
  const main = document.querySelector("main");
  const highTier = warpFX.gpuTier === "high";
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = opts.clickX || vw / 2;
  const cy = opts.clickY || 24;

  // Build the destination type, split to chars for the stagger.
  type.innerHTML = "";
  for (const ch of opts.label.toUpperCase()) {
    const span = document.createElement("span");
    span.className = "warp-char";
    span.textContent = ch === " " ? " " : ch;
    type.appendChild(span);
  }
  const chars = type.querySelectorAll<HTMLElement>(".warp-char");

  // Where the type "slams home" at landing — the clicked label's center.
  const holdRect = opts.holdEl?.getBoundingClientRect();
  const slamX = holdRect ? holdRect.left + holdRect.width / 2 - vw / 2 : 0;
  const slamY = holdRect ? holdRect.top + holdRect.height / 2 - vh / 2 : -vh / 2;

  tl = gsap.timeline({
    defaults: { ease: "expo.out" },
    onComplete: () => {
      cleanup(opts);
      getLenis()?.start();
      focusHeading(target);
      tl = null;
    },
  });

  // ---- 1 · Impact (0–120ms) ----
  tl.add(() => {
    lenis?.stop();
    opts.navEl?.setAttribute("data-warp", "1");
    opts.holdEl?.setAttribute("data-warp-hold", "1");
    if (highTier) warpFX.spike = 1; // postprocessing CA + grain surge (decays in-scene)
  }, 0);

  if (highTier && ring) {
    tl.set(ring, { visibility: "visible", left: cx, top: cy, scale: 0, opacity: 0.9 }, 0)
      .to(ring, { scale: 3.4, opacity: 0, duration: 0.55, ease: "expo.out" }, 0.02)
      .set(ring, { visibility: "hidden" }, 0.6);
  }

  if (main) {
    // Old content sucked away — transform/opacity only, no layout work.
    tl.to(
      main,
      {
        scale: 0.962,
        yPercent: -1.6,
        autoAlpha: 0.7,
        transformOrigin: "50% 30%",
        duration: 0.36,
        ease: "power3.in",
      },
      0.02,
    );
  }

  // ---- 2 · Blow-up type (120–580ms) ----
  tl.set(type, { visibility: "visible", x: 0, y: 0, scale: 1, autoAlpha: 1 }, 0.1)
    .fromTo(
      chars,
      { autoAlpha: 0, scale: 0.3, yPercent: 46, rotation: -9, skewY: 7 },
      {
        autoAlpha: 1,
        scale: 1.07,
        yPercent: 0,
        rotation: 0,
        skewY: 0,
        duration: 0.5,
        stagger: 0.032,
        ease: "back.out(2.4)",
      },
      0.12,
    )
    .to(chars, { scale: 1, duration: 0.16, ease: "power2.out" }, 0.6);

  // ---- 3 · Liquid wipe (280–660ms), scroll snaps while covered ----
  tl.set(panel, { visibility: "visible" }, 0.28)
    .fromTo(panel, { xPercent: -115 }, { xPercent: 0, duration: 0.32, ease: "expo.inOut" }, 0.3)
    .add(() => {
      snapTo(target);
      if (main) gsap.set(main, { scale: 1, yPercent: 0, autoAlpha: 1 });
    }, 0.63)
    .to(panel, { xPercent: 115, duration: 0.32, ease: "expo.inOut" }, 0.67)
    .set(panel, { visibility: "hidden" }, 1.0);

  // ---- 4 · Landing (600–950ms) ----
  if (opts.indicator) {
    const { el, x, w } = opts.indicator;
    tl.to(el, { x, width: w, opacity: 1, duration: 0.45, ease: "expo.out" }, 0.63);
  }
  tl.to(
    type,
    { x: slamX, y: slamY, scale: 0.06, autoAlpha: 0, duration: 0.3, ease: "power3.in" },
    0.66,
  ).set(type, { visibility: "hidden" }, 0.97);
}
