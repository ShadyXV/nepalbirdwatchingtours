/**
 * Keep the map light on mid-range phones.
 *  - Up front: no 3D terrain on low-memory / few-core devices or with Save-Data.
 *  - While the camera moves: watch frame times; after repeated slow windows, drop 3D terrain,
 *    then render at 1x pixel ratio. Sampling only happens during camera moves, never while idle.
 */
import type { Map as MapLibreMap } from "maplibre-gl";

/** Device pixel ratio cap for the map canvas. */
export const MAX_PIXEL_RATIO = 2;

/** Frame-time budget: a window whose median frame is slower than this counts as slow. */
const SLOW_FRAME_MS = 55;
const WINDOW_FRAMES = 30;
const SLOW_WINDOWS_TO_DEGRADE = 2;

type NavigatorHints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

export function canAfford3D(): boolean {
  const nav = navigator as NavigatorHints;
  if (nav.connection?.saveData) return false;
  if ((nav.deviceMemory ?? 8) < 4) return false;
  if ((nav.hardwareConcurrency ?? 8) < 4) return false;
  return true;
}

export function initialPixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
}

/**
 * Calls `degrade(level)` with level 1 (drop terrain), then 2 (pixel ratio 1) when frames stay slow.
 * Returns a dispose function.
 */
export function watchFrames(map: MapLibreMap, degrade: (level: 1 | 2) => void): () => void {
  let level = 0;
  let slowWindows = 0;
  let last = 0;
  let samples: number[] = [];

  const onRender = () => {
    const now = performance.now();
    if (last) samples.push(now - last);
    last = now;
    if (samples.length < WINDOW_FRAMES) return;
    const sorted = [...samples].sort((a, b) => a - b);
    samples = [];
    if (sorted[sorted.length >> 1] > SLOW_FRAME_MS) slowWindows++;
    else slowWindows = Math.max(0, slowWindows - 1);
    if (slowWindows >= SLOW_WINDOWS_TO_DEGRADE && level < 2) {
      level++;
      slowWindows = 0;
      degrade(level as 1 | 2);
    }
  };
  const onStart = () => {
    last = 0;
    samples = [];
    map.on("render", onRender);
  };
  const onEnd = () => map.off("render", onRender);

  map.on("movestart", onStart);
  map.on("moveend", onEnd);
  return () => {
    map.off("movestart", onStart);
    map.off("moveend", onEnd);
    map.off("render", onRender);
  };
}
