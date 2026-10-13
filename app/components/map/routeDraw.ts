/**
 * Draw the active route along its length: animate the `line-gradient` cut-off over `line-progress`
 * (the source has `lineMetrics: true`). A short rAF loop that stops when the line is complete;
 * nothing runs while idle.
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import { readToken } from "~/design/tokens";
import { drawnGradient, LAYER } from "./look";

export type RouteColors = { line: string; casing: string };

let cached: RouteColors | null = null;

/** The route's colours on the map: the MAP tokens (pale line, dark casing), not the UI's `--color-route`. */
export function mapRouteColors(): RouteColors {
  // Read once (tokens are static): the draw-in calls this every frame.
  cached ??= { line: readToken("--color-map-route"), casing: readToken("--color-map-route-casing") };
  return cached;
}

/**
 * Show the first `progress` (0..1) of the active route. The line is always drawn in the map's route
 * colours (`mapRouteColors()`); `colors` is kept for API compatibility and ignored, so a caller
 * still passing the UI teal cannot bring back a saturated route.
 */
export function setRouteProgress(map: MapLibreMap, _colors: RouteColors, progress: number): void {
  const colors = mapRouteColors();
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
