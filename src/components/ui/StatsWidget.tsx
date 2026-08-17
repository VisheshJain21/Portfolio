"use client";

/**
 * StatsWidget — fixed bottom-right view/like pill. Plain DOM/CSS, no
 * Canvas, no new WebGL context — entirely separate from the R3F/canvas
 * lifecycle work elsewhere in this codebase.
 *
 * View count: POSTs /api/view once per tab (sessionStorage guard), else
 * just reads /api/stats. Like: a toggle, not a counter — localStorage
 * remembers this browser's own liked state; the server only ever sees
 * "+1" or "-1", so two clicks net to zero, matching the toggle contract
 * in stats-db.ts. Optimistic UI: the heart flips immediately on click,
 * the network call reconciles the shared count after.
 *
 * SSR/hydration note: real counts and the liked state are both browser-
 * only (fetch + localStorage), so both start at a fixed placeholder and
 * are populated in useEffect — server render and first client paint are
 * guaranteed identical, the real values pop in a frame later.
 */

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import styles from "./StatsWidget.module.css";

const VIEWED_KEY = "vj:viewed";
const LIKED_KEY = "vj:liked";

export default function StatsWidget() {
  const [views, setViews] = useState<number | null>(null);
  const [likes, setLikes] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [bump, setBump] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    setLiked(localStorage.getItem(LIKED_KEY) === "1");

    const alreadyViewed = sessionStorage.getItem(VIEWED_KEY) === "1";
    const req = alreadyViewed
      ? fetch("/api/stats")
      : fetch("/api/view", { method: "POST" });

    req
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { views: number; likes: number } | null) => {
        if (!data) return;
        setViews(data.views);
        setLikes(data.likes);
        if (!alreadyViewed) sessionStorage.setItem(VIEWED_KEY, "1");
      })
      .catch(() => {
        // Decorative widget — a network hiccup just leaves counts blank.
      });
  }, []);

  const onLikeClick = async () => {
    if (inFlight.current) return; // one round-trip at a time
    inFlight.current = true;

    const next = !liked;
    setLiked(next);
    setBump((b) => b + 1); // remount-key trick — replays the bounce every click
    try {
      localStorage.setItem(LIKED_KEY, next ? "1" : "0");
    } catch {
      /* private mode — UI still works, just won't remember across visits */
    }

    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: next }),
      });
      if (res.ok) {
        const data = (await res.json()) as { views: number; likes: number };
        setLikes(data.likes);
      }
    } catch {
      // Optimistic UI already reflects intent; shared count may lag briefly.
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <div className={styles.widget}>
      <span className={styles.segment} data-cursor-hover>
        <Icon name="eye" className={styles.icon} />
        <span className={styles.count}>{views ?? "—"}</span>
      </span>
      <span className={styles.divider} aria-hidden="true" />
      <button
        type="button"
        className={styles.likeBtn}
        data-cursor-hover
        onClick={onLikeClick}
        aria-pressed={liked}
        aria-label={liked ? "Unlike this site" : "Like this site"}
      >
        <span key={bump} className={styles.heartPop}>
          <Icon name="heart" filled={liked} className={styles.icon} />
        </span>
        <span className={styles.count}>{likes ?? "—"}</span>
      </button>
    </div>
  );
}
