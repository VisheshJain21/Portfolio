"use client";

/**
 * useSiteReady — React view of the site-ready bus. False until the
 * preloader begins its exit transition (signalSiteReady), then true.
 * Both canvas Gates read this to stay paused (frameloop "never") behind
 * the black loader and resume exactly when it clears.
 */

import { useEffect, useState } from "react";
import { isSiteReady, onSiteReady } from "@/lib/site-ready";

export function useSiteReady(): boolean {
  const [ready, setReady] = useState<boolean>(isSiteReady);
  useEffect(() => onSiteReady(() => setReady(true)), []);
  return ready;
}
