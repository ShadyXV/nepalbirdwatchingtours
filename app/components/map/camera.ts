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
 *   S2 stop      closer on the stop, a slight orbit
 *   S3 place     framed by kind; peaks seen from a low camera, looking at the face
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
  /** MapLibre's pitch limit; peaks need a low camera. */
  maxPitch: 72,
  /**
   * How far past Nepal's outline the camera may go, degrees (lng, lat). Enough that edge places
   * (Kanchenjunga, Rara, Mahakali) are not cramped and that pitched views and the sheet padding
   * never push a framing into the bounds; small enough that nobody wanders off Nepal.
   */
  boundsMargin: [2, 1.8] as const,
  /** Zoom-out limit: this much below the "all of Nepal" fit for the current viewport. */
  minZoomSlack: 0.3,
  /** Zoom-in limit. The DEM goes to z12; beyond ~z14.5 overzoomed relief gets soft. */
  maxZoom: 14.5,
  /** flyTo zoom-out curve (MapLibre default 1.42); lower = flatter arc. */
  flightCurve: 1.3,
  overview: {
    /** Nepal runs WNW–ESE at about 20°; this bearing lays it nearly level. */
    bearing: 17,
    pitch: 24,
    margin: 18,
    minZoom: 5,
    maxZoom: 7.8,
    /** Free map area narrower than this (width / height) counts as portrait: frame the trips band. */
    portraitBelow: 1.35,
  },
  /** Home trip-card swipe: ease towards the card's pin. */
  preview: { zoomIn: 0.7 },
  trip: {
    pitch: 58,
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
  },
  stop: { zoomIn: 1.3, minZoom: 11.6, maxZoom: 13.8, pitch: 62, orbit: 12 },
  place: {
    peak: { zoom: 11.2, pitch: 70 },
    range: { zoom: 9.3, pitch: 58 },
    park: { zoom: 9.2, pitch: 46 },
    city: { zoom: 11, pitch: 44 },
    poi: { zoom: 12, pitch: 52 },
    /** Peaks are viewed from the nearest stop or city within this distance … */
    viewpointKm: 70,
    /** … but never turned further than this from north (Nepal sees its peaks from the south). */
    maxTurn: 35,
  },
} as const;

export type Frame = { width: number; height: number; padding: Insets };

/** Nepal's bounds plus CAMERA.boundsMargin: the map's maxBounds. */
export function cameraBounds(): [[number, number], [number, number]] {
  const b = boundsOf(NEPAL_FRAME);
  const [mx, my] = CAMERA.boundsMargin;
  return [
    [b.west - mx, b.south - my],
    [b.east + mx, b.north + my],
  ];
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
  return boundsCenter(boundsOf(trip.waypoints.map((w) => w.coords)));
}

/** Every point that should be in view for a trip. */
export function tripPoints(trip: Trip): LngLat[] {
  return [...(trip.route ?? []), ...trip.waypoints.map((w) => w.coords)];
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

export function tripCamera(trip: Trip, frame: Frame): CameraTarget {
  const t = CAMERA.trip;
  const points = tripPoints(trip);
  const bearing = tripBearing(points, frame);
  const fit = fitPoints({
    points,
    bearing,
    pitch: t.pitch,
    ...frame,
    margin: t.margin,
    pitchSlack: t.pitchSlack,
    minZoom: t.minZoom,
    maxZoom: t.maxZoom,
  });
  return { ...fit, bearing, pitch: t.pitch, padding: frame.padding };
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
    bearing: base.bearing + s.orbit,
    pitch: s.pitch,
    padding: frame.padding,
  };
}

/* ------------------------------------------------------------------ S3 */

/**
 * The direction to look at a peak from: from the nearest trip stop or city (where guests actually
 * see it), kept within a turn of north so the familiar southern faces show.
 */
function faceBearing(peak: Landmark, viewpoints: LngLat[]): number {
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
