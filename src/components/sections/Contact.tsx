"use client";

/**
 * Contact — the final CTA (SOP §4.7) + a message form (added 2026-07-16,
 * ref: AI-engineer portfolio pattern). The form is backend-free: on
 * submit it composes a prefilled mailto: so it works on a static host.
 * Amber signal returns at full strength, closing the preloader's loop.
 */

import { useEffect, useRef, useState } from "react";
import { revealLines, revealUp } from "@/animations/reveals";
import { contact } from "@/content/site";
import { registerAnchor } from "@/lib/section-anchors";
import Magnetic from "@/components/ui/Magnetic";
import Icon from "@/components/ui/Icon";
import styles from "./Contact.module.css";

// A dead 404 on a hiring-focused portfolio is worse than no link at all —
// flip this once the real PDF lands at public/vishesh-jain-resume.pdf
// (contact.resume already points there, see content/site.ts's TODO).
const HAS_RESUME = false;

// Direct channels — each reuses the same Magnetic hook as the email CTA.
const CHANNELS = [
  { label: "GitHub", href: contact.github, icon: "github", external: true },
  { label: "LinkedIn", href: contact.linkedin, icon: "linkedin", external: true },
  { label: "Instagram", href: contact.instagram, icon: "instagram", external: true },
  { label: contact.phoneDisplay, href: `tel:${contact.phone}`, icon: "phone" },
  ...(HAS_RESUME
    ? [{ label: "Résumé", href: contact.resume, icon: "resume", download: true } as const]
    : []),
] as const;

export default function Contact() {
  const rootRef = useRef<HTMLElement>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    registerAnchor("contact", root);
    return () => registerAnchor("contact", null);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    revealLines(root, { onScroll: true });
    const meta = root.querySelectorAll<HTMLElement>("[data-contact-fade]");
    revealUp(meta, root, { stagger: 0.08, start: "top 72%" });
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const subject = encodeURIComponent(`Portfolio enquiry — ${name || "someone"}`);
    const body = encodeURIComponent(
      `${message}\n\n— ${name}${email ? `\n${email}` : ""}`,
    );
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <section ref={rootRef} className={`section section--loose ${styles.section}`} id="contact" aria-label="Contact">
      <div className={`shell ${styles.grid}`}>
        <div className={styles.left}>
          <p className="eyebrow">Contact</p>
          <h2 className={`display ${styles.heading}`}>
            <span className="line-mask">
              <span className="line-inner">Let&apos;s build systems</span>
            </span>
            <span className="line-mask">
              <span className="line-inner">
                that <em>think.</em>
              </span>
            </span>
          </h2>
          <p className={styles.sub} data-contact-fade>
            Looking for an engineer who treats AI as architecture, not garnish?
            Send a note or reach me directly.
          </p>
          <div className={styles.actions} data-contact-fade>
            <Magnetic strength={20}>
              <a className={styles.cta} href={`mailto:${contact.email}`} data-cursor-hover>
                <Icon name="mail" className={styles.ctaIcon} />
                {contact.email}
                <span aria-hidden="true">↗</span>
              </a>
            </Magnetic>
          </div>
          <div className={styles.channels} data-contact-fade>
            {CHANNELS.map((c) => (
              <Magnetic key={c.label} strength={12}>
                <a
                  className={styles.channel}
                  href={c.href}
                  data-cursor-hover
                  {...("external" in c && c.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                  {...("download" in c && c.download ? { download: true } : {})}
                >
                  <Icon name={c.icon} className={styles.channelIcon} />
                  <span>{c.label}</span>
                </a>
              </Magnetic>
            ))}
          </div>
        </div>

        <form className={styles.form} onSubmit={onSubmit} data-contact-fade>
          <div className={styles.field}>
            <label htmlFor="cf-name">Name</label>
            <input id="cf-name" name="name" type="text" autoComplete="name" required />
          </div>
          <div className={styles.field}>
            <label htmlFor="cf-email">Email</label>
            <input id="cf-email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className={styles.field}>
            <label htmlFor="cf-message">Message</label>
            <textarea id="cf-message" name="message" rows={4} required />
          </div>
          <Magnetic strength={14}>
            <button className={styles.submit} type="submit" data-cursor-hover>
              {sent ? "Opening your mail…" : "Send message"}
              <span aria-hidden="true">→</span>
            </button>
          </Magnetic>
          <p className={styles.formNote}>Opens your mail app — no data leaves your device before you hit send.</p>
        </form>
      </div>
    </section>
  );
}
