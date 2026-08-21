"use client";

/**
 * Tiny WebAudio wrapper — synthesized oscillator tones, no audio files,
 * no new deps. Default OFF, persisted in localStorage; every play call
 * checks the flag itself, so callers (SpineNodesOverlay, FaultSequence)
 * never need to branch on it themselves.
 *
 * AudioContext is created lazily on first real play — browsers require
 * a user gesture before audio can start, and a hover/click on a spine
 * node or the toggle button itself both count.
 */

const STORAGE_KEY = "vj:sound-enabled";
let ctx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function setSoundEnabled(on: boolean) {
  localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, peakGain: number) {
  if (!isSoundEnabled()) return;
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, audio.currentTime);
  gain.gain.linearRampToValueAtTime(peakGain, audio.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration + 0.02);
}

/** Soft tick — spine-node hover. */
export function playTick() {
  tone(880, 0.08, 0.05);
}

/** A short two-note rise — the fault-and-heal "heal" beat. */
export function playSignal() {
  tone(660, 0.05, 0.06);
  if (typeof window !== "undefined") {
    window.setTimeout(() => tone(990, 0.12, 0.05), 60);
  }
}
