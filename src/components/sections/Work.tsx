"use client";

/**
 * Selected Systems (SOP §4.4) — the section that does the convincing.
 * Numbered project rows; hover slides the row and warms the title;
 * public projects link out, confidential ones say so honestly.
 */

import { useEffect, useMemo, useRef } from "react";
import { revealUp, drawHairline } from "@/animations/reveals";
import { projects, workMeta } from "@/content/projects";
import WorkThumbsGate from "@/webgl/work/WorkThumbsGate";
import type { ThumbTarget } from "@/webgl/work/WorkThumbsScene";
import styles from "./Work.module.css";

export default function Work() {
  const rootRef = useRef<HTMLElement>(null);
  // One stable DOM ref per project — read by WorkThumbsGate every frame
  // to position each WebGL plane over its thumb slot; also the element
  // usePointerUniforms listens on directly.
  const thumbRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const targets: ThumbTarget[] = useMemo(
    () =>
      projects.map((p) => ({
        key: p.index,
        motif: p.motif,
        seed: p.seed,
        domRef: {
          get current() {
            return thumbRefs.current[p.index] ?? null;
          },
        } as React.RefObject<HTMLElement | null>,
      })),
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const rows = root.querySelectorAll<HTMLElement>(`.${styles.row}`);
    rows.forEach((row) => revealUp(row, row, { y: 44 }));
    const head = root.querySelector<HTMLElement>(`.${styles.head}`);
    if (head) revealUp(head, head, { y: 24 });
    root
      .querySelectorAll<HTMLElement>("[data-hairline]")
      .forEach((el) => drawHairline(el));
  }, []);

  return (
    <section ref={rootRef} className="section section--loose" id="work" aria-label="Selected work">
      <WorkThumbsGate sectionRef={rootRef} targets={targets} />
      <div className="shell">
        <div className={styles.head}>
          <div>
            <p className="eyebrow">{workMeta.eyebrow}</p>
            <h2 className={`display ${styles.heading}`}>{workMeta.heading}</h2>
          </div>
          <span className="mono-label">{workMeta.count}</span>
        </div>
        <div data-hairline className="hairline" />

        <ul className={styles.list}>
          {projects.map((p) => {
            const primaryLink = p.links?.[0];
            return (
              <li key={p.index}>
                {/* Stretched-link pattern: the row is a div; the primary
                    link overlays it; secondary links sit above (z-index). */}
                <div
                  className={styles.row}
                  data-cursor-view={!primaryLink ? "Confidential" : undefined}
                >
                  {primaryLink && (
                    <a
                      className={styles.stretch}
                      href={primaryLink.href}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor-view={primaryLink.label === "Live demo" ? "Live" : "View"}
                      aria-label={`${p.title} — ${primaryLink.label}`}
                    />
                  )}
                  <span className={styles.index}>{p.index}</span>
                  {/* Thumb slot — a normal DOM element for layout/a11y.
                      WorkThumbsGate positions a procedural WebGL motif
                      exactly over it every frame (webgl/work/project-shader.ts,
                      no texture — can't fail to load); this <img> is the
                      fallback shown only when WebGL is unavailable or
                      reduced-motion is set, hand-drawn to echo the same
                      motif so the two states tell the same visual story. */}
                  <div
                    ref={(el) => {
                      thumbRefs.current[p.index] = el;
                    }}
                    className={styles.thumb}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.thumb} alt="" loading="lazy" />
                  </div>
                  <span className={styles.body}>
                    <span className={styles.titleRow}>
                      <span className={styles.title}>{p.title}</span>
                      {p.confidential && (
                        <span className={styles.badge} title={workMeta.confidentialNote}>
                          Confidential
                        </span>
                      )}
                    </span>
                    <span className={styles.pitch}>{p.pitch}</span>
                    <span className={styles.highlight}>{p.highlight}</span>
                    <span className={styles.tags}>
                      {p.tags.map((t) => (
                        <span key={t} className={styles.tag}>
                          {t}
                        </span>
                      ))}
                    </span>
                    {p.links && p.links.length > 1 && (
                      <span className={styles.links}>
                        {p.links.slice(1).map((l) => (
                          <a
                            key={l.href}
                            className="link-underline"
                            href={l.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {l.label} ↗
                          </a>
                        ))}
                      </span>
                    )}
                  </span>
                  <span className={styles.arrow} aria-hidden="true">
                    {primaryLink ? "↗" : "—"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className={styles.more}>
          <a
            className={styles.moreLink}
            href={workMeta.moreHref}
            target="_blank"
            rel="noreferrer"
            data-cursor-hover
          >
            {workMeta.moreLabel}
            <span className={styles.arrow} aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
