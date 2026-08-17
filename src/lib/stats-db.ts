import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

/**
 * Stats store — a single-row SQLite table for the view/like widget.
 * Uses Node's built-in `node:sqlite` (Node 24+, experimental) so this
 * needs zero new npm dependencies for a two-counter use case.
 *
 * HMR safety: cached on `globalThis` so Turbopack Fast Refresh re-evaluating
 * this module doesn't reopen the file repeatedly (the exact class of dev-
 * only fragility this session already hit once with Lenis/GSAP singletons).
 *
 * ⚠️ Deployment caveat: this persists to a local file, which is correct for
 * `next dev` and for a traditional always-on Node server (`next start` on a
 * VM/container). On serverless hosts (Vercel's default deploy target for
 * this project per INTAKE §H), the filesystem is ephemeral per invocation —
 * counts will NOT reliably persist there. Fine to ship as-is for now; if/when
 * deploying to Vercel, swap the storage (Vercel KV, Turso, etc.) — flagged
 * here rather than silently discovered after launch.
 */

declare global {
  // eslint-disable-next-line no-var
  var __statsDb: DatabaseSync | undefined;
}

function open(): DatabaseSync {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "stats.sqlite"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      view_count INTEGER NOT NULL DEFAULT 0,
      like_count INTEGER NOT NULL DEFAULT 0
    );
    INSERT OR IGNORE INTO stats (id, view_count, like_count) VALUES (1, 0, 0);
  `);
  return db;
}

function getDb(): DatabaseSync {
  if (!globalThis.__statsDb) globalThis.__statsDb = open();
  return globalThis.__statsDb;
}

export type Stats = { views: number; likes: number };

export function readStats(): Stats {
  const row = getDb()
    .prepare("SELECT view_count, like_count FROM stats WHERE id = 1")
    .get() as { view_count: number; like_count: number };
  return { views: row.view_count, likes: row.like_count };
}

export function incrementView(): Stats {
  getDb().exec("UPDATE stats SET view_count = view_count + 1 WHERE id = 1");
  return readStats();
}

/** `liked: true` → +1, `liked: false` → -1, floored at 0 so a mistaken
 *  double-decrement (e.g. duplicate request) can never go negative. */
export function setLike(liked: boolean): Stats {
  const delta = liked ? 1 : -1;
  getDb()
    .prepare("UPDATE stats SET like_count = MAX(0, like_count + ?) WHERE id = 1")
    .run(delta);
  return readStats();
}
