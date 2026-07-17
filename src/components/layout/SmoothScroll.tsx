"use client";

/**
 * Lenis smooth scroll, driven by the GSAP ticker so ScrollTrigger
 * and scroll stay in one clock. Scroll is locked until the
 * preloader signals readiness. No-ops under reduced motion.
 */

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/animations/gsap";
import { onSiteReady } from "@/lib/site-ready";
import { setLenis } from "@/lib/lenis-store";

export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      autoRaf: false,
    });

    lenis.stop(); // locked during preload
    setLenis(lenis);
    const unsubscribe = onSiteReady(() => lenis.start());

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      unsubscribe();
      gsap.ticker.remove(tick);
      setLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
