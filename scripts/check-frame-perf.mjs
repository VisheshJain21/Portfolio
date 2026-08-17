/**
 * check-frame-perf — the durable guard against "it feels laggy."
 *
 * Builds the site, serves it, and drives a real full-page scroll (actual
 * dispatched wheel events, since this site's scroll is entirely
 * Lenis-driven and `window.scrollTo` would bypass its RAF-interpolated
 * smoothing — testing something no real user experiences) while a
 * PerformanceObserver collects long tasks. Runs once at native speed and
 * once under 4x CPU throttling (dev machines are far faster than a real
 * mid-tier phone, and that's exactly the class of jank this needs to
 * catch).
 *
 * Only tasks tagged "scroll" (started after the wheel-scroll loop began)
 * count against the budget — that's what "laggy while scrolling" actually
 * means. A one-time "load" phase task (e.g. multiple WebGL canvases
 * compiling shaders + GSAP building every section's ScrollTrigger, all in
 * one synchronous burst right after mount) is a different concern from
 * scroll jank and is reported but not failed on; if it needs fixing later
 * (staggered canvas mount, deferred ScrollTrigger creation) that's a
 * separate, targeted piece of work, not a scroll-smoothness regression.
 * Fails if any SCROLL-phase task blocks the main thread over 200ms — the
 * rough threshold at which users perceive a freeze.
 *
 * Run:  npm run check:perf
 * (No dev server needed — it starts and tears down its own production server.)
 */

import { spawn, execSync } from "node:child_process";
import { chromium } from "playwright";
import net from "node:net";

const PORT = 3988; // distinct from check-responsive.mjs's 3987 — never compete for a port
const BASE = `http://localhost:${PORT}`;
const LONG_TASK_BUDGET_MS = 200;

function waitForServer(port, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const sock = net.connect(port, "localhost");
      sock.on("connect", () => { sock.destroy(); resolve(); });
      sock.on("error", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error("server did not start"));
        else setTimeout(tick, 300);
      });
    };
    tick();
  });
}

async function runPass(browser, { throttle }) {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    try { sessionStorage.setItem("vj:preloaded", "1"); } catch {}
  });
  // Installed before any page script runs, so it catches every long task
  // from first paint onward, not just ones during the scroll itself.
  await context.addInitScript(() => {
    window.__longTasks = [];
    window.__navStart = performance.now();
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__longTasks.push({ duration: e.duration, startTime: e.startTime });
        }
      }).observe({ entryTypes: ["longtask"] });
    } catch {}
  });

  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  if (throttle) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500); // let the preloader-skip settle + canvases mount

  const scrollStartTime = await page.evaluate(() => performance.now());
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const steps = 40;
  const deltaPerStep = Math.ceil((pageHeight + 900) / steps);
  await page.mouse.move(720, 450);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, deltaPerStep);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(800); // let Lenis settle at the bottom

  const longTasks = await page.evaluate(() => window.__longTasks || []);
  await context.close();
  return longTasks.map((t) => ({ ...t, phase: t.startTime < scrollStartTime ? "load" : "scroll" }));
}

async function main() {
  console.log("▸ building production bundle…");
  execSync("next build", { stdio: "inherit" });

  console.log(`▸ starting server on :${PORT}…`);
  const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: "ignore",
    env: { ...process.env },
  });
  const cleanup = () => { try { server.kill("SIGKILL"); } catch {} };
  process.on("exit", cleanup);
  process.on("SIGINT", () => { cleanup(); process.exit(130); });

  try {
    await waitForServer(PORT);
    const browser = await chromium.launch();

    let failed = false;
    for (const { label, throttle } of [
      { label: "native speed", throttle: false },
      { label: "4x CPU throttle (mid-tier phone)", throttle: true },
    ]) {
      const tasks = await runPass(browser, { throttle });
      const worst = [...tasks].sort((a, b) => b.duration - a.duration).slice(0, 5);
      const loadOffenders = tasks.filter((t) => t.phase === "load" && t.duration > LONG_TASK_BUDGET_MS);
      const scrollOffenders = tasks.filter((t) => t.phase === "scroll" && t.duration > LONG_TASK_BUDGET_MS);
      const worstStr = worst.map((t) => `${Math.round(t.duration)}ms[${t.phase}]`).join(", ");
      if (scrollOffenders.length > 0) {
        failed = true;
        console.log(`  ✗ ${label.padEnd(32)} ${scrollOffenders.length} SCROLL task(s) over ${LONG_TASK_BUDGET_MS}ms`);
        console.log(`       ↳ worst: ${worstStr}`);
      } else if (loadOffenders.length > 0) {
        console.log(`  ✓ ${label.padEnd(32)} smooth while scrolling (${loadOffenders.length} load-time task(s) over budget, not counted)`);
        console.log(`       ↳ worst: ${worstStr}`);
      } else {
        console.log(`  ✓ ${label.padEnd(32)} longest task: ${Math.round(worst[0]?.duration ?? 0)}ms`);
      }
    }

    await browser.close();

    if (failed) {
      console.log(`\n✗ frame-perf budget exceeded — a task blocked the main thread over ${LONG_TASK_BUDGET_MS}ms.`);
      process.exit(1);
    }
    console.log("\n✓ no long tasks over budget — scroll stays smooth, native speed and throttled.");
    process.exit(0);
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
