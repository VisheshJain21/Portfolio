import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict Mode is OFF deliberately (not an oversight). In dev, Strict Mode
  // double-invokes render + mounts/tears-down/remounts effects to surface
  // unsafe side effects — for a live R3F scene graph (real, mutable
  // .parent/.children Three.js refs) that rapid teardown/recreate cycle is
  // a well-documented trigger for dev-only "Converting circular structure
  // to JSON" crashes in react-three-fiber (a diagnostic hook catching the
  // scene mid-teardown, with .parent still set on a half-detached object).
  // Confirmed dev-only: `next build` compiles and type-checks clean, and
  // Strict Mode has no effect on the production runtime either way — this
  // trades the double-invoke safety net (useful for catching unsafe effects
  // in plain React state) for a stable dev experience around the Canvas
  // trees, which is the standard recommendation in the R3F ecosystem for
  // exactly this failure mode.
  reactStrictMode: false,
  allowedDevOrigins: ["127.0.2.2"],
};

export default nextConfig;
