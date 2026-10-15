/**
 * CAMERA: where the camera goes in each map state, and the numbers that shape each framing.
 * Timings and easings come from the motion tokens (tokens.css group 4); this file holds pitch,
 * bearing, zoom limits and margins. All framings are computed from the content data, so new
 * trips and places frame themselves.
 *
 *   S0 overview  all of Nepal (landscape screens) or the band where the trips and big peaks are
 *                (portrait phones, where all of Nepal would be a thin strip), low pitch, a bearing
 *                that lays Nepal's long axis level
 *   S1 trip      fit the route, pitched, bearing roughly along the route
 *   S2 stop      closer on the stop, turned and tilted so the stop is not hidden by a ridge
 *   S3 place     framed by kind; peaks seen from a low camera, looking at the face
 *   day view     one day's walk, straightened: the bearing follows the direction of travel so the
 *                walk runs up the screen, pitched, fitted to the clear band of the day layout
 */
import type { Landmark, LngLat, Trip } from "~/content/types";
import {
  bearingBetween,
  boundsCenter,
  boundsOf,
  distanceKm,
  fitPoints,
  principalAxis,
  wrapDegrees,
  type Insets,
} from "~/lib/geo";

export const CAMERA = {
  /** MapLibre's pitch limit (users can tilt up to this; peaks' face views use up to ~62°). */
  maxPitch: 70,
  /**
   * Soft edge: when a pan ends with the centre further than this past Nepal's outline (degrees,
   * lng / lat), the camera eases back inside. Panning itself is never blocked here.
   */
  softBoundsMargin: [2.2, 1.8] as const,
  /** Hard wall far beyond the soft edge (MapLibre maxBounds), only a safety net. */
  hardBoundsMargin: [7, 5.5] as const,
  /** Zoom-out limit: this much below the "all of Nepal" fit for the current viewport. */
  minZoomSlack: 0.6,
  /** Zoom-in limit. Shading DEM tiles go to z14 (the 3D mesh to z11, look.ts DEM); beyond ~z14.5 relief gets soft. */
  maxZoom: 14.5,
  /** flyTo zoom-out curve (MapLibre default 1.42); lower = flatter arc. */
  flightCurve: 1.3,
  /** Deliberate stop steps longer than this travel with flyTo (a small arc), shorter with easeTo. */
  stepFlyKm: 6,
  /** After the user pans, zooms, rotates or tilts, automatic camera moves wait this long. */
  userIdleMs: 6000,
  /** A user rotation / tilt this far from the state's own view shows the "reset view" control. */
  adjustedDeg: 4,
  /** Drag-pan inertia (MapLibre dragPan options). */
  inertia: { linearity: 0.25, maxSpeed: 1600, deceleration: 2200 },
  overview: {
    /** Nepal runs WNW–ESE at about 20°; this bearing lays it nearly level. */
    bearing: 17,
    pitch: 20,
    margin: 18,
    minZoom: 5,
    maxZoom: 7.8,
    /** Free map area narrower than this (width / height) counts as portrait: frame the trips band. */
    portraitBelow: 1.35,
  },
  /** Home trip-card swipe: ease towards the card's pin. */
  preview: { zoomIn: 0.7 },
  trip: {
    pitch: 45,
    margin: 34,
    minZoom: 7.5,
    maxZoom: 13.2,
    /** 0 = keep north up, 1 = turn fully to the route's axis. */
    alignment: 0.6,
    maxBearing: 40,
    /** Routes rounder than this (major / minor axis) keep the default bearing. */
    minElongation: 1.6,
    defaultBearing: 8,
    /** Higher = tighter vertical fit at this pitch (see fitPoints). */
    pitchSlack: 1.3,
    /** Visibility search for the whole-route view: key stops must be visible. */
    visibility: { pitches: [45, 38, 30], bearingStep: 15, bearingSpan: 45 },
  },
  stop: {
    zoomIn: 1.3,
    minZoom: 11.6,
    maxZoom: 13.8,
    pitch: 50,
    /** Visibility search: try every bearingStep around the current view, then lower pitches. */
    visibility: { pitches: [50, 43, 36, 28], bearingStep: 25, bearingSpan: 175 },
  },
  place: {
    peak: { zoom: 11.2, pitch: 62 },
    range: { zoom: 9.3, pitch: 50 },
    park: { zoom: 9.2, pitch: 40 },
    city: { zoom: 11, pitch: 40 },
    poi: { zoom: 12, pitch: 45 },
    /** Peaks are viewed from the nearest stop or city within this distance … */
    viewpointKm: 70,
    /** … but never turned further than this from north (Nepal sees its peaks from the south). */
    maxTurn: 35,
    /** Visibility search for a peak's face: stay near the face bearing, lower the camera if hidden. */
    visibility: { pitches: [62, 54, 46, 38], bearingStep: 20, bearingSpan: 60 },
  },
  /**
   * Day view ("the journey", docs/JOURNEY.md): one day's walk, straightened (bearing = direction of
   * travel, so the walk runs up the screen), pitched like a view along the trail.
   */
  day: {
    pitch: { desktop: 52, phone: 56 },
    /** Bus days zoom out to minZoom; short birding days zoom in to maxZoom. */
    minZoom: 10,
    maxZoom: 13.4,
    /** Rest days (no walk): this close on the stay. */
    restZoom: 12.6,
    margin: 24,
    pitchSlack: 1.25,
    /** A day whose start and end are closer than this has no direction: use the walk's axis. */
    minChordKm: 0.3,
    /**
     * Visibility search, kept straight: bearings within ±20° of the travel bearing, and lowering
     * the pitch is preferred over turning. Accept a view when the anchor and at least `minShare`
     * of `samples` points along the walk are in sight.
     */
    visibility: { pitches: [52, 44, 36], bearingOffsets: [0, 10, -10, 20, -20], minShare: 0.7, samples: 8 },
    /** Day-to-day move: base + perLog2Km·log2(1 + km/2) + perDeg·|Δbearing| ms, clamped. */
    move: { baseMs: 900, perLog2Km: 300, perDeg: 4, minMs: 900, maxMs: 1800 },
    /** Opening the day view from the overview: one longer flight. */
    enterMs: 2000,
    /** Tapping one of the day's other stops: the camera goes there, this much closer. */
    midpointZoomIn: 0.7,
  },
  /**
   * Orbit controls (↺ ↻, Q / E): turn the camera around the point in focus (the day's anchor or
   * tapped stop, the focused stop, the place; else the screen centre), keeping pitch and zoom.
   */
  orbitStepDeg: 35,
  /** One tap's turn, ms (--ease-map). */
  orbitMs: 700,
  /** Press and hold longer than this: keep orbiting, slowly, until release. */
  orbitHoldMs: 320,
  orbitDegPerSec: 24,
  /** Reduced motion: one instant snap of this size per tap, no continuous orbit. */
  orbitReducedDeg: 45,
  /** How long a camera move waits for the elevation data before going ahead without the check. */
  visibilityWaitMs: 450,
  /** Area around a trip / place for which elevation is fetched up front, km. */
  visibilityMarginKm: 22,
} as const;

export type Frame = { width: number; height: number; padding: Insets };

/** Nepal's bounds plus a margin (degrees lng, lat). */
export function nepalBounds(margin: readonly [number, number]): [[number, number], [number, number]] {
  const b = boundsOf(NEPAL_FRAME);
  const [mx, my] = margin;
  return [
    [b.west - mx, b.south - my],
    [b.east + mx, b.north + my],
  ];
}

/** The centre clamped into the soft bounds, or null when it is already inside. */
export function softBoundsCorrection(center: LngLat): LngLat | null {
  const [[w, s], [e, n]] = nepalBounds(CAMERA.softBoundsMargin);
  const lng = Math.min(e, Math.max(w, center[0]));
  const lat = Math.min(n, Math.max(s, center[1]));
  return lng === center[0] && lat === center[1] ? null : [lng, lat];
}

/**
 * The zoom-out limit for a viewport: a little below the zoom at which all of Nepal fits the whole
 * map (no sheet padding), at the overview bearing and pitch. Recomputed on resize.
 */
export function minZoomFor(width: number, height: number): number {
  const o = CAMERA.overview;
  const { zoom } = fitPoints({
    points: NEPAL_FRAME,
    bearing: o.bearing,
    pitch: o.pitch,
    width,
    height,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    margin: o.margin,
    pitchSlack: 1.3,
    minZoom: 3,
    maxZoom: o.maxZoom,
  });
  return zoom - CAMERA.minZoomSlack;
}

export type CameraTarget = {
  center: LngLat;
  zoom: number;
  bearing: number;
  pitch: number;
  padding: Insets;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Where a trip's pin sits on the overview: the centre of its stops. */
export function tripAnchor(trip: Trip): LngLat {
  return boundsCenter(boundsOf(fieldStops(trip).map((w) => w.coords)));
}

/** Every point that should be in view for a trip. */
export function tripPoints(trip: Trip): LngLat[] {
  return [...(trip.route ?? []), ...fieldStops(trip).map((w) => w.coords)];
}

/** Stops in the trip's field area; transit stops (e.g. a Kathmandu arrival night) would drag the frame. */
function fieldStops(trip: Trip) {
  const field = trip.waypoints.filter((w) => !w.transit);
  return field.length > 0 ? field : trip.waypoints;
}

/* ------------------------------------------------------------------ S0 */

/**
 * Nepal's outline, coarsely (Natural Earth, simplified to ~35 points): enough to frame the
 * overview before /geo/nepal.geojson has loaded, and to keep this module synchronous.
 */
export const NEPAL_FRAME: LngLat[] = [
  [88.1182, 27.8609], [88.0443, 26.4057], [87.3005, 26.346], [87.0413, 26.5802], [86.7136, 26.4146],
  [86.2844, 26.612], [85.8285, 26.5661], [85.5986, 26.8544], [85.1949, 26.7589], [84.1172, 27.5133],
  [83.2824, 27.3309], [82.7521, 27.495], [82.6797, 27.6944], [81.8557, 27.8509], [80.0311, 28.8978],
  [80.369, 29.7579], [80.8839, 30.2104], [81.2168, 30.0082], [81.3875, 30.3739], [81.614, 30.4169],
  [82.0888, 30.3301], [82.1538, 30.0582], [83.1736, 29.6213], [83.5237, 29.1836], [84.0897, 29.2566],
  [84.4508, 28.7339], [85.161, 28.595], [85.1094, 28.2923], [85.6929, 28.3352], [85.9627, 27.8914],
  [86.156, 28.1565], [86.4253, 27.9099], [86.662, 28.1068], [87.1558, 27.8258],
];

export type OverviewInput = {
  /** Nepal's outline (or its bounding box corners before the outline has loaded). */
  nepal: LngLat[];
  /** The band that matters most: trip pins and the always-labelled places. */
  focus: LngLat[];
};

export function overviewCamera(input: OverviewInput, frame: Frame): CameraTarget {
  const o = CAMERA.overview;
  const freeW = frame.width - frame.padding.left - frame.padding.right;
  const freeH = frame.height - frame.padding.top - frame.padding.bottom;
  const portrait = freeW / Math.max(freeH, 1) < o.portraitBelow;
  const fit = fitPoints({
    points: portrait && input.focus.length > 1 ? input.focus : input.nepal,
    bearing: o.bearing,
    pitch: o.pitch,
    ...frame,
    margin: o.margin,
    pitchSlack: 1.3,
    minZoom: o.minZoom,
    maxZoom: o.maxZoom,
  });
  return { ...fit, bearing: o.bearing, pitch: o.pitch, padding: frame.padding };
}

/** Home carousel preview: a little closer, centred on the trip's pin. */
export function previewCamera(overview: CameraTarget, anchor: LngLat): CameraTarget {
  return { ...overview, center: anchor, zoom: overview.zoom + CAMERA.preview.zoomIn };
}

/* ------------------------------------------------------------------ S1 */

/**
 * Bearing for a trip: on a portrait map the camera looks along the route (diving up the valley,
 * towards the mountains); on a landscape map the route is laid across the screen.
 */
function tripBearing(points: LngLat[], frame: Frame): number {
  const t = CAMERA.trip;
  const { bearing: axis, elongation } = principalAxis(points);
  if (elongation < t.minElongation) return t.defaultBearing;
  const freeW = frame.width - frame.padding.left - frame.padding.right;
  const freeH = frame.height - frame.padding.top - frame.padding.bottom;
  let target = freeH > freeW ? axis : axis - 90;
  // An axis has no direction: pick the end that keeps north roughly up.
  target = wrapDegrees(target);
  if (target > 90) target -= 180;
  if (target < -90) target += 180;
  return clamp(target * t.alignment, -t.maxBearing, t.maxBearing);
}

/** Centre and zoom that fit a trip for a given bearing and pitch (used by the visibility search too). */
export function fitTrip(trip: Trip, frame: Frame, bearing: number, pitch: number): { center: LngLat; zoom: number } {
  const t = CAMERA.trip;
  return fitPoints({
    points: tripPoints(trip),
    bearing,
    pitch,
    ...frame,
    margin: t.margin,
    pitchSlack: t.pitchSlack,
    minZoom: t.minZoom,
    maxZoom: t.maxZoom,
  });
}

/** The geometric whole-route view (before the visibility check). */
export function tripCamera(trip: Trip, frame: Frame): CameraTarget {
  const bearing = tripBearing(tripPoints(trip), frame);
  const pitch = CAMERA.trip.pitch;
  return { ...fitTrip(trip, frame, bearing, pitch), bearing, pitch, padding: frame.padding };
}

/** The direction of travel at a stop: from the stop before it (or towards the next, at the start). */
export function travelBearing(trip: Trip, waypointId: string): number | undefined {
  const i = trip.waypoints.findIndex((w) => w.id === waypointId);
  if (i < 0 || trip.waypoints.length < 2) return undefined;
  const from = trip.waypoints[Math.max(0, i - 1)].coords;
  const to = trip.waypoints[i === 0 ? 1 : i].coords;
  return bearingBetween(from, to);
}

/* ------------------------------------------------------------------ S2 */

export function stopCamera(trip: Trip, waypointId: string, frame: Frame): CameraTarget | null {
  const waypoint = trip.waypoints.find((w) => w.id === waypointId);
  if (!waypoint) return null;
  const s = CAMERA.stop;
  const base = tripCamera(trip, frame);
  return {
    center: waypoint.coords,
    zoom: clamp(base.zoom + s.zoomIn, s.minZoom, s.maxZoom),
    bearing: base.bearing,
    pitch: s.pitch,
    padding: frame.padding,
  };
}

/* ------------------------------------------------------------------ S3 */

/**
 * The direction to look at a peak from: from the nearest trip stop or city (where guests actually
 * see it), kept within a turn of north so the familiar southern faces show.
 */
export function faceBearing(peak: Landmark, viewpoints: LngLat[]): number {
  const p = CAMERA.place;
  let best: LngLat | null = null;
  let bestKm: number = p.viewpointKm;
  for (const v of viewpoints) {
    const km = distanceKm(v, peak.coords);
    if (km > 3 && km < bestKm) {
      best = v;
      bestKm = km;
    }
  }
  if (!best) return 0;
  return clamp(wrapDegrees(bearingBetween(best, peak.coords)), -p.maxTurn, p.maxTurn);
}

export function placeCamera(place: Landmark, viewpoints: LngLat[], frame: Frame): CameraTarget {
  const framing = CAMERA.place[place.kind];
  const bearing = place.kind === "peak" ? faceBearing(place, viewpoints) : CAMERA.overview.bearing / 2;
  return { center: place.coords, zoom: framing.zoom, bearing, pitch: framing.pitch, padding: frame.padding };
}

/* ------------------------------------------------------------ day view */

export type DayFraming = {
  /** The day's walk, from the previous anchor to this one (one point on a rest day). */
  segment: LngLat[];
  /** Every point that should be in the frame (the walk and the day's stops). */
  points: LngLat[];
  anchor: LngLat;
};

/**
 * The direction of travel for a day: from the walk's start to its end. Loops and short days use
 * the walk's long axis (the end nearer the previous bearing); rest days keep the previous bearing.
 */
export function dayBearing(day: DayFraming, previous: number | null): number {
  const d = CAMERA.day;
  const start = day.segment[0];
  const end = day.segment[day.segment.length - 1];
  if (day.segment.length > 1 && distanceKm(start, end) >= d.minChordKm) return wrapDegrees(bearingBetween(start, end));
  const fallback = previous ?? CAMERA.trip.defaultBearing;
  if (day.points.length < 2) return fallback;
  const { bearing: axis, elongation } = principalAxis(day.points);
  if (elongation < CAMERA.trip.minElongation) return fallback;
  const flip = Math.abs(wrapDegrees(axis - fallback)) > 90 ? 180 : 0;
  return wrapDegrees(axis + flip);
}

export function dayPitch(frame: Frame): number {
  return frame.width >= 1024 ? CAMERA.day.pitch.desktop : CAMERA.day.pitch.phone;
}

/** Centre and zoom that fit a day for a bearing and pitch (used by the visibility search too). */
export function fitDay(day: DayFraming, frame: Frame, bearing: number, pitch: number): { center: LngLat; zoom: number } {
  const d = CAMERA.day;
  if (day.points.length < 2 || boundsSpanKm(day.points) < 0.05) return { center: day.anchor, zoom: d.restZoom };
  return fitPoints({
    points: day.points,
    bearing,
    pitch,
    ...frame,
    margin: d.margin,
    pitchSlack: d.pitchSlack,
    minZoom: d.minZoom,
    maxZoom: d.maxZoom,
  });
}

/** The geometric day camera (before the visibility check). */
export function dayCamera(day: DayFraming, frame: Frame, previousBearing: number | null): CameraTarget {
  const bearing = dayBearing(day, previousBearing);
  const pitch = dayPitch(frame);
  return { ...fitDay(day, frame, bearing, pitch), bearing, pitch, padding: frame.padding };
}

/** Duration of a day-to-day camera move, ms. */
export function dayMoveMs(km: number, turnDeg: number): number {
  const m = CAMERA.day.move;
  return clamp(m.baseMs + m.perLog2Km * Math.log2(1 + km / 2) + m.perDeg * Math.abs(turnDeg), m.minMs, m.maxMs);
}

function boundsSpanKm(points: LngLat[]): number {
  const b = boundsOf(points);
  return distanceKm([b.west, b.south], [b.east, b.north]);
}
