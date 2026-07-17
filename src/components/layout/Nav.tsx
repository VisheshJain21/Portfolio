"use client";

/**
 * Nav — fixed bar with full scroll choreography: amber progress hairline,
 * capsule morph past the hero, direction-aware hide/reveal, pointer
 * spotlight, char-roll links with active-section markers, a scramble-
 * decode brand, and a clip-path overlay menu on narrow screens.
 * Every embellishment gates on prefers-reduced-motion.
 */

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/animations/gsap";
import { onSiteReady } from "@/lib/site-ready";
import { identity, contact } from "@/content/site";
import { warpTo } from "@/animations/warp-cut";
import Magnetic from "@/components/ui/Magnetic";
import RollText from "@/components/ui/RollText";
import styles from "./Nav.module.css";

const LINKS = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

const BRAND = "VISHESH JAIN";
const GLYPHS = "AXKZVMJN<>/#*+=0147";

export default function Nav() {
  const ref = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const openRef = useRef(open);
  openRef.current = open;
  // Handle to the direction-aware hide tween so the top hover strip can
  // reverse it (Bug B: a trigger inside the header translates away WITH
  // the header — the strip must live outside it).
  const hideTweenRef = useRef<gsap.core.Tween | null>(null);

  /** Pill geometry for a link, relative to the links row. */
  const pillTarget = (link: HTMLElement) => {
    const ul = listRef.current;
    if (!ul) return null;
    const lr = link.getBoundingClientRect();
    const ur = ul.getBoundingClientRect();
    return { x: lr.left - ur.left - 10, w: lr.width + 20 };
  };

  /** Warp Cut launch — intercepts the native jump entirely. Enter/Space on
   *  a focused link fires click too (anchors), so keyboard rides the same
   *  path; (0,0) coords are remapped to the link center. */
  const onWarpClick = (e: React.MouseEvent<HTMLAnchorElement>, label: string, href: string) => {
    e.preventDefault();
    const link = e.currentTarget;
    const r = link.getBoundingClientRect();
    const clickX = e.clientX || r.left + r.width / 2;
    const clickY = e.clientY || r.top + r.height / 2;
    const pill = pillRef.current;
    const t = pillTarget(link);
    setOpen(false);
    warpTo(href, {
      label,
      clickX,
      clickY,
      holdEl: link,
      navEl: ref.current,
      indicator: pill && t ? { el: pill, ...t } : null,
    });
  };

  // Entrance — bar drops in, then its items cascade.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll("[data-nav-item]");
    gsap.set(el, { autoAlpha: 0, y: -16 });
    gsap.set(items, { autoAlpha: 0, y: -14 });
    return onSiteReady(() => {
      gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", delay: 0.45 });
      gsap.to(items, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "expo.out",
        delay: 0.6,
        stagger: 0.07,
      });
    });
  }, []);

  // Scroll choreography — capsule morph, hide/reveal, progress, section markers.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const triggers: ScrollTrigger[] = [];

    triggers.push(
      ScrollTrigger.create({
        start: 40,
        end: "max",
        onToggle: (self) => setScrolled(self.isActive),
      })
    );

    let hide: gsap.core.Tween | null = null;
    if (!reduced) {
      hide = gsap.to(el, { yPercent: -120, duration: 0.45, ease: "power3.inOut", paused: true });
      hideTweenRef.current = hide;
      triggers.push(
        ScrollTrigger.create({
          start: 320,
          end: "max",
          onUpdate: (self) => {
            if (openRef.current) return;
            // Guard on real scroll position — the initial refresh fires
            // onUpdate with direction 1 while still at the top.
            if (self.direction === 1 && self.scroll() > 320) hide?.play();
            else hide?.reverse();
          },
          onLeaveBack: () => hide?.reverse(),
        })
      );
    }

    let progress: gsap.core.Tween | null = null;
    if (progressRef.current) {
      progress = gsap.fromTo(
        progressRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: reduced ? false : 0.35 },
        }
      );
    }

    LINKS.forEach(({ href }) => {
      const section = document.querySelector(href);
      if (!section) return;
      triggers.push(
        ScrollTrigger.create({
          trigger: section,
          start: "top 55%",
          end: "bottom 45%",
          onToggle: (self) =>
            setActive((prev) => (self.isActive ? href : prev === href ? null : prev)),
        })
      );
    });

    return () => {
      triggers.forEach((t) => t.kill());
      progress?.scrollTrigger?.kill();
      progress?.kill();
      hide?.kill();
      hideTweenRef.current = null;
    };
  }, []);

  // Pointer spotlight — molten glow tracks the cursor inside the bar.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--sx", `${e.clientX - r.left}px`);
      el.style.setProperty("--sy", `${e.clientY - r.top}px`);
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  // Brand scramble-decode on hover.
  useEffect(() => {
    const anchor = brandRef.current;
    const target = anchor?.querySelector("[data-brand-text]");
    if (!anchor || !target) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    let timer: number | null = null;
    const play = () => {
      if (timer !== null) window.clearInterval(timer);
      let frame = 0;
      timer = window.setInterval(() => {
        frame += 1;
        const settled = Math.max(0, Math.floor((frame - 3) / 2));
        if (settled >= BRAND.length) {
          target.textContent = BRAND;
          if (timer !== null) window.clearInterval(timer);
          timer = null;
          return;
        }
        target.textContent =
          BRAND.slice(0, settled) +
          Array.from(BRAND.slice(settled))
            .map((c) => (c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join("");
      }, 28);
    };

    anchor.addEventListener("pointerenter", play);
    return () => {
      anchor.removeEventListener("pointerenter", play);
      if (timer !== null) window.clearInterval(timer);
    };
  }, []);

  // Liquid pill tracks the scroll-active link (warp morphs it itself,
  // but scrolling past sections must move it too).
  useEffect(() => {
    const pill = pillRef.current;
    const ul = listRef.current;
    if (!pill || !ul) return;
    const link = active
      ? ul.querySelector<HTMLElement>(`a[href="${active}"]`)
      : null;
    if (!link) {
      gsap.to(pill, { opacity: 0, duration: 0.3, ease: "power2.out" });
      return;
    }
    const t = pillTarget(link);
    if (t) gsap.to(pill, { x: t.x, width: t.w, opacity: 1, duration: 0.5, ease: "expo.out" });
  }, [active]);

  // Overlay open: close on Escape, lock scroll behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Always-present hover zone at the very top of the viewport: sits
          BELOW the header in z-order, so it only receives the pointer once
          the header has slid away — hovering it brings the nav back. */}
      <div
        className={styles.hoverTrigger}
        aria-hidden="true"
        onPointerEnter={() => hideTweenRef.current?.reverse()}
      />
      <header ref={ref} className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
        <span ref={progressRef} className={styles.progress} aria-hidden="true" />
        <a
          ref={brandRef}
          href="#top"
          className={styles.brand}
          aria-label="Vishesh Jain — back to top"
          data-nav-item
          data-brand
        >
          <span data-brand-text>{BRAND}</span>
        </a>
        <span className={styles.status} data-nav-item>
          <span className={styles.dot} aria-hidden="true" />
          {identity.availability}
        </span>
        <nav aria-label="Primary" className={styles.desktopNav}>
          <ul ref={listRef} className={styles.links}>
            <span ref={pillRef} className={styles.indicator} aria-hidden="true" />
            {LINKS.map((l) => (
              <li key={l.href} data-nav-item>
                <Magnetic strength={10}>
                  <a
                    className={styles.link}
                    href={l.href}
                    aria-label={l.label}
                    data-roll-trigger
                    data-active={active === l.href || undefined}
                    onClick={(e) => onWarpClick(e, l.label, l.href)}
                  >
                    <span className={styles.linkDot} aria-hidden="true" />
                    <RollText text={l.label} />
                  </a>
                </Magnetic>
              </li>
            ))}
          </ul>
        </nav>
        <button
          className={styles.menuBtn}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
          data-nav-item
        >
          <span
            className={`${styles.menuLabel} ${open ? styles.menuLabelOpen : ""}`}
            aria-hidden="true"
          >
            <span>Menu</span>
            <span>Close</span>
          </span>
        </button>
      </header>

      <div
        id="mobile-menu"
        className={`${styles.overlay} ${open ? styles.overlayOpen : ""}`}
        inert={!open}
      >
        <span className={styles.overlayScan} aria-hidden="true" />
        <span className={styles.overlayMark} aria-hidden="true">
          VJ
        </span>
        <nav aria-label="Mobile">
          <ul className={styles.overlayLinks}>
            {LINKS.map((l, i) => (
              <li
                key={l.href}
                style={{ transitionDelay: open ? `${0.08 * i + 0.3}s` : "0s" }}
              >
                <a href={l.href} onClick={(e) => onWarpClick(e, l.label, l.href)}>
                  <span className={styles.overlayIndex}>0{i + 1}</span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.overlayFoot} style={{ transitionDelay: open ? "0.6s" : "0s" }}>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <span className={styles.overlayFootLinks}>
            <a href={contact.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={contact.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={contact.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </span>
        </div>
      </div>
    </>
  );
}
