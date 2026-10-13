/**
 * Draw the active route along its length: animate the `line-gradient` cut-off over `line-progress`
 * (the source has `lineMetrics: true`). A short rAF loop that stops when the line is complete;
 * nothing runs while idle.
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import { drawnGradient, LAYER } from "./look";

export type RouteColors = { line: string; casing: string };

export function setRouteProgress(map: MapLibreMap, colors: RouteColors, progress: number): void {
  map.setPaintProperty(LAYER.route, "line-gradient", drawnGradient(colors.line, progress));
  map.setPaintProperty(LAYER.routeCasing, "line-gradient", drawnGradient(colors.casing, progress));
}

/** Starts after `delayMs`; returns a cancel function (which leaves the line fully drawn). */
export function drawRoute(
  map: MapLibreMap,
  colors: RouteColors,
  { delayMs, durationMs, easing }: { delayMs: number; durationMs: number; easing: (t: number) => number },
): () => void {
  let frame = 0;
  let start = 0;
  let done = false;
  setRouteProgress(map, colors, 0);

  const tick = (now: number) => {
    if (!start) start = now + delayMs;
    const t = Math.min(1, Math.max(0, (now - start) / durationMs));
    if (now >= start) setRouteProgress(map, colors, easing(t));
    if (t < 1) frame = requestAnimationFrame(tick);
    else done = true;
  };
  frame = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(frame);
    if (!done) setRouteProgress(map, colors, 1);
  };
}
