/**
 * check-responsive — the durable guard against layout breaking on resize.
 *
 * Builds the site, serves it, and loads it in headless Chromium at every
 * breakpoint from 320px → 1920px. At each it asserts:
 *   • no horizontal overflow (documentElement.scrollWidth ≤ viewport + 1px),
 *     and if there is any, names the specific offending element(s);
 *   • the nav, hero heading, and footer are actually present/visible.
 * Exits non-zero on the first failure so it works as a CI / pre-push gate.
 *
 * Run:  npm run check:responsive
 * (No dev server needed — it starts and tears down its own production server.)
 */

import { spawn, execSync } from "node:child_process";
import { chromium } from "playwright";
import net from "node:net";

const PORT = 3987;
const BASE = `http://localhost:${PORT}`;
const TOLERANCE = 1; // px — ignore sub-pixel rounding

const BREAKPOINTS = [
  { w: 320, h: 720, label: "320  small phone" },
  { w: 360, h: 780, label: "360  android" },
  { w: 375, h: 812, label: "375  iPhone" },
  { w: 390, h: 844, label: "390  iPhone 14" },
  { w: 414, h: 896, label: "414  large phone" },
  { w: 768, h: 1024, label: "768  tablet portrait" },
  { w: 820, h: 1180, label: "820  Work-grid edge" },
  { w: 1024, h: 768, label: "1024 tablet landscape" },
  { w: 1280, h: 800, label: "1280 laptop" },
  { w: 1440, h: 900, label: "1440 desktop" },
  { w: 1920, h: 1080, label: "1920 large desktop" },
];

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
    // Skip the (session-gated) preloader so we measure the real content layout.
    const context = await browser.newContext();
    await context.addInitScript(() => {
      try { sessionStorage.setItem("vj:preloaded", "1"); } catch {}
    });
    const page = await context.newPage();

    let failures = 0;
    for (const bp of BREAKPOINTS) {
      await page.setViewportSize({ width: bp.w, height: bp.h });
      await page.goto(BASE, { waitUntil: "networkidle" });
      await page.waitForTimeout(400); // settle fonts/layout

      const result = await page.evaluate(() => {
        const doc = document.documentElement;
        const vw = doc.clientWidth;
        const offenders = [];
        for (const el of document.querySelectorAll("body *")) {
          const cs = getComputedStyle(el);
          if (cs.position === "fixed" || cs.display === "none") continue;
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > vw + 1) {
            offenders.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className?.toString?.() || "").split(" ")[0].slice(0, 40),
              right: Math.round(r.right),
              width: Math.round(r.width),
            });
          }
        }
        const q = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };
        return {
          scrollW: doc.scrollWidth,
          clientW: vw,
          offenders: offenders.slice(0, 6),
          nav: q("header"),
          heading: q("#top h1"),
          footer: q("footer"),
        };
      });

      const overflow = result.scrollW - result.clientW;
      const problems = [];
      if (overflow > TOLERANCE) problems.push(`horizontal overflow +${overflow}px`);
      if (!result.nav) problems.push("nav missing");
      if (!result.heading) problems.push("hero heading missing");
      if (!result.footer) problems.push("footer missing");

      if (problems.length === 0) {
        console.log(`  ✓ ${bp.label.padEnd(24)} scrollW=${result.scrollW} vw=${result.clientW}`);
      } else {
        failures++;
        console.log(`  ✗ ${bp.label.padEnd(24)} ${problems.join(" · ")}`);
        for (const o of result.offenders) {
          console.log(`       ↳ <${o.tag} class="${o.cls}"> right=${o.right} width=${o.width}`);
        }
      }
    }

    await browser.close();

    if (failures > 0) {
      console.log(`\n✗ ${failures} breakpoint(s) failed.`);
      process.exit(1);
    }
    console.log(`\n✓ all ${BREAKPOINTS.length} breakpoints clean — no overflow, key elements present.`);
    process.exit(0);
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
