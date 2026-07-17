"use client";

/**
 * Footer — mono colophon, fixed to the viewport bottom and revealed as the
 * page content lifts away over it (the award-site "curtain" footer).
 * It measures its own height into --footer-h so <main> reserves exactly
 * that much room below itself; re-measures on resize.
 */

import { useEffect, useRef } from "react";
import { contact, identity } from "@/content/site";
import styles from "./Footer.module.css";

export default function Footer() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () =>
      document.documentElement.style.setProperty("--footer-h", `${el.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--footer-h");
    };
  }, []);

  return (
    <footer ref={ref} className={styles.footer}>
      <div className={`shell ${styles.inner}`}>
        <span>
          © 2026 {identity.name} — {identity.role}
        </span>
        <span className={styles.middle}>
          Designed &amp; engineered by me — this site is the first exhibit.
        </span>
        <span className={styles.right}>
          <a className="link-underline" href={contact.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="link-underline" href={contact.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a className="link-underline" href={contact.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a className="link-underline" href="#top">
            Back to top ↑
          </a>
        </span>
      </div>
    </footer>
  );
}
