import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

/**
 * Stats store — a single-row SQLite table for the view/like widget.
 * Uses Node's built-in `node:sqlite` (Node 22.5+, experimental) so this
 * needs zero new npm dependencies for a two-counter use case.
 *
 * HMR safety: cached on `globalThis` so Turbopack Fast Refresh re-evaluating
 * this module doesn't reopen the file repeatedly (the exact class of dev-
 * only fragility this session already hit once with Lenis/GSAP singletons).
 *
 * ⚠️ Storage durability, by host (this matters — see the fallback chain in
 * `open()`):
 *  - `next dev` / `next start` on a VM or container → `./data/stats.sqlite`,
 *    fully persistent. This is the intended deployment shape.
 *  - Serverless (Vercel's default) → the project root is READ-ONLY, so the
 *    first choice throws EROFS. Falls back to the OS temp dir, which IS
 *    writable there: counts then persist for the life of a warm instance and
 *    reset when it recycles. Not durable, but the widget stays functional.
 *  - No writable location at all → in-memory object, so the endpoints still
 *    answer instead of 500-ing.
 * The fallback exists so a serverless deploy degrades to "counts reset"
 * rather than "every /api/stats|view|like returns 500 and the widget breaks",
 * which is what happened before this was hardened. For genuinely durable
 * counts on serverless, swap in Vercel KV / Turso / Upstash — the exported
 * API below is the only surface that would need to keep working.
 */

type Stats = { views: number; likes: number };
export type { Stats };

/** Minimal shape this module needs from a DatabaseSync instance — declared
 *  structurally so `node:sqlite` can be imported lazily/optionally. */
type Db = {
  exec(sql: string): void;
  prepare(sql: string): {
    get(): unknown;
    run(...params: unknown[]): unknown;
  };
};

type Store = { kind: "sqlite"; db: Db } | { kind: "memory"; data: Stats };

declare global {
  // eslint-disable-next-line no-var
  var __statsStore: Store | undefined;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    view_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0
  );
  INSERT OR IGNORE INTO stats (id, view_count, like_count) VALUES (1, 0, 0);
`;

/** `node:sqlite` must be imported STATICALLY at the top of this module.
 *  Two lazier approaches were tried and both fail under Turbopack with
 *  "Cannot find module 'node:sqlite': Unsupported external type Url for
 *  commonjs reference": a bare `require()` (also just not defined in the ESM
 *  server runtime) and `createRequire(import.meta.url)`. Because the whole
 *  body here is try/caught, both failures demoted a perfectly healthy SQLite
 *  file to the in-memory store *silently* — caught only because a live DB
 *  holding 330 views suddenly reported 0. Hence the static import, plus the
 *  `engines.node` floor in package.json so the host actually provides a
 *  runtime that has the module. */
function tryOpenAt(dir: string): Db | null {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const db = new DatabaseSync(path.join(dir, "stats.sqlite"));
    db.exec(SCHEMA);
    return db;
  } catch {
    // Expected on serverless for the project-local path (EROFS) — the caller
    // falls through to the temp dir, then to memory.
    return null;
  }
}

function openStore(): Store {
  // 1. Project-local: persistent on a VM/container (the intended shape).
  // 2. OS temp: the only writable path on serverless — per-instance, but keeps
  //    the endpoints working instead of throwing EROFS.
  for (const dir of [path.join(process.cwd(), "data"), path.join(os.tmpdir(), "vj-portfolio")]) {
    const db = tryOpenAt(dir);
    if (db) return { kind: "sqlite", db };
  }
  // Reaching here means neither location worked. Say so once: this path is a
  // real degradation (counts won't persist), and silently swallowing it is
  // exactly how the require() bug above went unnoticed.
  console.warn(
    "[stats-db] no writable SQLite location — falling back to in-memory counts (they will reset).",
  );
  return { kind: "memory", data: { views: 0, likes: 0 } };
}

function store(): Store {
  if (!globalThis.__statsStore) globalThis.__statsStore = openStore();
  return globalThis.__statsStore;
}

export function readStats(): Stats {
  const s = store();
  if (s.kind === "memory") return { ...s.data };
  const row = s.db
    .prepare("SELECT view_count, like_count FROM stats WHERE id = 1")
    .get() as { view_count: number; like_count: number };
  return { views: row.view_count, likes: row.like_count };
}

export function incrementView(): Stats {
  const s = store();
  if (s.kind === "memory") {
    s.data.views += 1;
    return { ...s.data };
  }
  s.db.exec("UPDATE stats SET view_count = view_count + 1 WHERE id = 1");
  return readStats();
}

/** `liked: true` → +1, `liked: false` → -1, floored at 0 so a mistaken
 *  double-decrement (e.g. duplicate request) can never go negative. */
export function setLike(liked: boolean): Stats {
  const s = store();
  const delta = liked ? 1 : -1;
  if (s.kind === "memory") {
    s.data.likes = Math.max(0, s.data.likes + delta);
    return { ...s.data };
  }
  s.db
    .prepare("UPDATE stats SET like_count = MAX(0, like_count + ?) WHERE id = 1")
    .run(delta);
  return readStats();
}
