"use client";

/**
 * Client-only wrapper for WarpCut.
 * `ssr: false` is only allowed inside a Client Component, so we wrap the
 * dynamic import here and re-export it for use in the Server-Component layout.
 */

import dynamic from "next/dynamic";

const WarpCut = dynamic(() => import("./WarpCut"), { ssr: false });

export default function WarpCutClient() {
  return <WarpCut />;
}
