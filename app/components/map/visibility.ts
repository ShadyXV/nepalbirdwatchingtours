/**
 * Visibility-aware framing: make sure the thing the camera is about (a stop, a peak, a trip's key
 * stops) is not hidden behind a ridge in the 3D view.
 *
 * How: for a candidate camera (centre, zoom, bearing, pitch) we reconstruct where MapLibre puts the
 * eye: `D = 0.5 / tan(fov / 2) * viewportHeight` pixels from the centre, converted to metres at that
 * zoom, tilted by the pitch and placed behind the centre (opposite the bearing). Then we walk the
 * straight line from the eye to each target and sample the ground (DemSampler) at SAMPLES points:
 * if the ground, exaggerated like the rendered terrain, rises above the line (minus a margin), the
 * target is hidden. Candidates are tried from the least rotation (and highest pitch) outwards; the
 * first clear one wins. Cost: ~SAMPLES lookups per target per candidate, a few thousand array reads
 * at most, well under a millisecond; it runs once per camera move and results are cached.
 */
import type { LngLat } from "~/content/types";
import { wrapDegrees } from "~/lib/geo";
import type { DemSampler } from "./dem";

const EARTH_CIRCUMFERENCE = 40075016.686;
const DEG = Math.PI / 180;

export const VISIBILITY = {
  /** Points sampled along each line of sight. */
  samples: 40,
  /** The ground must stay this far (rendered metres) below the line of sight. */
  marginM: 25,
  /** Ignore the last stretch next to the target (its own slope), as a share of the line. */
  skipNearTarget: 0.03,
  /** Cost of turning away from the direction of travel, relative to turning away from the current view. */
  travelWeight: 0.35,
};

export type Eye = { lngLat: LngLat; alt: number };

/** Move a point `metres` along a compass bearing. */
function offset([lng, lat]: LngLat, bearingDeg: number, metres: number): LngLat {
  const b = bearingDeg * DEG;
  const dLat = (metres * Math.cos(b)) / 111320;
  const dLng = (metres * Math.sin(b)) / (111320 * Math.cos(lat * DEG));
  return [lng + dLng, lat + dLat];
}

/** Where the eye of a MapLibre camera is, in lng/lat and rendered metres above sea level. */
export function eyeFor(
  view: { center: LngLat; zoom: number; bearing: number; pitch: number },
  viewportHeight: number,
  fovDeg: number,
  centerAlt: number,
): Eye {
  const metresPerPx = (EARTH_CIRCUMFERENCE * Math.cos(view.center[1] * DEG)) / (512 * 2 ** view.zoom);
  const distance = (0.5 / Math.tan((fovDeg / 2) * DEG)) * viewportHeight * metresPerPx;
  return {
    lngLat: offset(view.center, view.bearing + 180, distance * Math.sin(view.pitch * DEG)),
    alt: centerAlt + distance * Math.cos(view.pitch * DEG),
  };
}

export type SightResult = "clear" | "hidden" | "unknown";

/** Is the straight line from the eye to the target above the (exaggerated) ground? */
export function lineOfSight(dem: DemSampler, exaggeration: number, eye: Eye, target: LngLat, targetAlt: number): SightResult {
  let unknown = 0;
  const n = VISIBILITY.samples;
  for (let i = 1; i < n; i++) {
    const t = i / n; // 0 = eye, 1 = target
    if (t > 1 - VISIBILITY.skipNearTarget) break;
    const point: LngLat = [eye.lngLat[0] + (target[0] - eye.lngLat[0]) * t, eye.lngLat[1] + (target[1] - eye.lngLat[1]) * t];
    const ground = dem.elevation(point);
    if (ground === null) {
      unknown++;
      continue;
    }
    const lineAlt = eye.alt + (targetAlt - eye.alt) * t;
    if (ground * exaggeration + VISIBILITY.marginM > lineAlt) return "hidden";
  }
  return unknown > n / 4 ? "unknown" : "clear";
}

export type ViewSearch = {
  dem: DemSampler;
  exaggeration: number;
  viewportHeight: number;
  fovDeg: number;
  /** Bearings are tried around this one, nearest first. */
  baseBearing: number;
  /** Optional second preference (e.g. the route's direction of travel). */
  travelBearing?: number;
  /** Try base ± step, ± 2·step … up to ± span. */
  bearingStep: number;
  bearingSpan: number;
  /** Highest (most 3D) first; the first pitch with a clear bearing wins. */
  pitches: readonly number[];
  /** Centre and zoom for a bearing/pitch (fixed for a stop, refit for a whole route). */
  frame: (bearing: number, pitch: number) => { center: LngLat; zoom: number };
  targets: LngLat[];
};

export type ViewChoice = {
  center: LngLat;
  zoom: number;
  bearing: number;
  pitch: number;
  /** Targets still hidden in the chosen view (0 = all visible). */
  hidden: number;
  /** False when the DEM didn't cover enough to judge: don't cache. */
  decided: boolean;
};

/** The clear view with the least rotation; if none, the one hiding the fewest targets at the lowest pitch. */
export function chooseView(s: ViewSearch): ViewChoice {
  const bearings: number[] = [];
  for (let k = 0; k * s.bearingStep <= s.bearingSpan; k++) {
    if (k === 0) bearings.push(s.baseBearing);
    else bearings.push(s.baseBearing + k * s.bearingStep, s.baseBearing - k * s.bearingStep);
  }
  const cost = (b: number) =>
    Math.abs(wrapDegrees(b - s.baseBearing)) +
    (s.travelBearing === undefined ? 0 : VISIBILITY.travelWeight * Math.abs(wrapDegrees(b - s.travelBearing)));
  bearings.sort((a, b) => cost(a) - cost(b));

  const targetAlts = s.targets.map((t) => (s.dem.elevation(t) ?? 0) * s.exaggeration);
  let best: ViewChoice | null = null;
  let decided = true;

  for (const pitch of s.pitches) {
    for (const raw of bearings) {
      const bearing = wrapDegrees(raw);
      const { center, zoom } = s.frame(bearing, pitch);
      const centerAlt = (s.dem.elevation(center) ?? 0) * s.exaggeration;
      const eye = eyeFor({ center, zoom, bearing, pitch }, s.viewportHeight, s.fovDeg, centerAlt);
      let hidden = 0;
      s.targets.forEach((target, i) => {
        const result = lineOfSight(s.dem, s.exaggeration, eye, target, targetAlts[i]);
        if (result === "hidden") hidden++;
        if (result === "unknown") decided = false;
      });
      const choice = { center, zoom, bearing, pitch, hidden, decided };
      if (hidden === 0) return { ...choice, decided };
      if (!best || hidden < best.hidden || (hidden === best.hidden && pitch <= best.pitch)) best = choice;
    }
  }
  return { ...(best as ViewChoice), decided };
}
