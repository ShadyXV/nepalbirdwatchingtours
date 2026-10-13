/**
 * Small, dependency-free geometry helpers for the map: Web Mercator maths, camera fitting in a
 * rotated frame, route smoothing, graticule and mask generation. Pure functions, safe on the server.
 *
 * Coordinates are [lng, lat] (GeoJSON order), like `LngLat` in ~/content/types.
 */
import type { LngLat } from "~/content/types";

export type Bounds = { west: number; south: number; east: number; north: number };

/* Minimal GeoJSON shapes (structurally compatible with MapLibre's GeoJSON types). */
export type LineFeature<P> = { type: "Feature"; properties: P; geometry: { type: "LineString"; coordinates: LngLat[] } };
export type PointFeature<P> = { type: "Feature"; properties: P; geometry: { type: "Point"; coordinates: LngLat } };
export type PolygonFeature<P> = { type: "Feature"; properties: P; geometry: { type: "Polygon"; coordinates: LngLat[][] } };
export type FeatureCollection<F> = { type: "FeatureCollection"; features: F[] };
type AnyGeometry = { type: string; coordinates?: unknown };
type AnyCollection = { type: "FeatureCollection"; features: { geometry: AnyGeometry | null }[] };

const DEG = Math.PI / 180;

/** MapLibre's world size at zoom 0, in CSS pixels (512 px tiles). */
const WORLD_PX = 512;

/* ------------------------------------------------------------- mercator */

/** Web Mercator, normalised to 0..1 (x east, y south). */
export function toMercator([lng, lat]: LngLat): [number, number] {
  const x = (lng + 180) / 360;
  const sin = Math.sin(lat * DEG);
  const y = 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
  return [x, y];
}

export function fromMercator([x, y]: [number, number]): LngLat {
  const lng = x * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;
  return [lng, lat];
}

export function boundsOf(points: LngLat[]): Bounds {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const [lng, lat] of points) {
    if (lng < west) west = lng;
    if (lng > east) east = lng;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  return { west, south, east, north };
}

export function boundsCenter(b: Bounds): LngLat {
  return [(b.west + b.east) / 2, (b.south + b.north) / 2];
}

/** Great-circle-free approximation, fine for distances inside Nepal. Kilometres. */
export function distanceKm(a: LngLat, b: LngLat): number {
  const x = (b[0] - a[0]) * Math.cos(((a[1] + b[1]) / 2) * DEG);
  const y = b[1] - a[1];
  return Math.hypot(x, y) * 111.32;
}

/** Compass bearing from a to b, degrees (0 = north, 90 = east). */
export function bearingBetween(a: LngLat, b: LngLat): number {
  const x = (b[0] - a[0]) * Math.cos(((a[1] + b[1]) / 2) * DEG);
  const y = b[1] - a[1];
  return (Math.atan2(x, y) * 180) / Math.PI;
}

/** Normalise an angle to -180..180. */
export function wrapDegrees(deg: number): number {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

/* ------------------------------------------------------- camera fitting */

/**
 * The main axis of a set of points (principal component in Mercator space), as a compass
 * bearing in 0..180, plus how elongated the set is (1 = round, larger = a clear line).
 */
export function principalAxis(points: LngLat[]): { bearing: number; elongation: number } {
  const m = points.map(toMercator);
  const n = m.length || 1;
  const cx = m.reduce((s, p) => s + p[0], 0) / n;
  const cy = m.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of m) {
    sxx += (x - cx) ** 2;
    syy += (y - cy) ** 2;
    sxy += (x - cx) * (y - cy);
  }
  // Angle of the major axis in screen-like coords (x east, y south).
  const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const common = Math.sqrt(((sxx - syy) / 2) ** 2 + sxy ** 2);
  const major = (sxx + syy) / 2 + common;
  const minor = Math.max((sxx + syy) / 2 - common, 1e-18);
  // Direction (cos θ, sin θ) with y pointing south → compass bearing.
  const bearing = (((90 + (theta * 180) / Math.PI) % 180) + 180) % 180;
  return { bearing, elongation: Math.sqrt(major / minor) };
}

export type Insets = { top: number; right: number; bottom: number; left: number };

export type FitRequest = {
  points: LngLat[];
  /** Camera bearing in degrees: the compass direction the top of the screen faces. */
  bearing: number;
  pitch: number;
  /** Map container size in CSS px. */
  width: number;
  height: number;
  /** Area covered by UI (sheet, column); the fit happens in what is left. */
  padding: Insets;
  /** Extra breathing room inside the free area, px. */
  margin: number;
  /**
   * How much a pitched view squeezes the vertical extent. The fit multiplies the free height by
   * 1 / min(1, cos(pitch) * slack); larger slack = tighter framing at high pitch.
   */
  pitchSlack: number;
  minZoom: number;
  maxZoom: number;
};

/**
 * Fit points into the free area of the viewport for a rotated (and pitched) camera.
 * MapLibre's own cameraForBounds fits the axis-aligned box, which is loose for a diagonal
 * country like Nepal; this fits the points themselves in the rotated frame.
 */
export function fitPoints(req: FitRequest): { center: LngLat; zoom: number } {
  const b = req.bearing * DEG;
  const cos = Math.cos(b), sin = Math.sin(b);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of req.points) {
    const [x, y] = toMercator(p);
    const sx = x * cos + y * sin;
    const sy = -x * sin + y * cos;
    if (sx < minX) minX = sx;
    if (sx > maxX) maxX = sx;
    if (sy < minY) minY = sy;
    if (sy > maxY) maxY = sy;
  }
  const freeW = Math.max(40, req.width - req.padding.left - req.padding.right - 2 * req.margin);
  const freeH = Math.max(40, req.height - req.padding.top - req.padding.bottom - 2 * req.margin);
  const squeeze = Math.min(1, Math.cos(req.pitch * DEG) * req.pitchSlack);
  const spanX = Math.max(maxX - minX, 1e-9) * WORLD_PX;
  const spanY = Math.max(maxY - minY, 1e-9) * WORLD_PX * squeeze;
  const zoom = Math.log2(Math.min(freeW / spanX, freeH / spanY));

  const sx = (minX + maxX) / 2, sy = (minY + maxY) / 2;
  const center = fromMercator([sx * cos - sy * sin, sx * sin + sy * cos]);
  return { center, zoom: Math.min(req.maxZoom, Math.max(req.minZoom, zoom)) };
}

/* ------------------------------------------------------ hand-drawn lines */

/** Chaikin corner cutting: rounds corners, keeps both end points. */
export function chaikin(points: LngLat[], iterations = 2): LngLat[] {
  let line = points;
  for (let k = 0; k < iterations && line.length > 2; k++) {
    const next: LngLat[] = [line[0]];
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, ay] = line[i];
      const [bx, by] = line[i + 1];
      next.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    next.push(line[line.length - 1]);
    line = next;
  }
  return line;
}

/** Deterministic 0..1 noise from a string seed (mulberry32 over a string hash). */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A slightly hand-drawn version of a line: each long segment gets a soft sideways bow
 * (a fraction of its length, seeded so it never changes between renders), then Chaikin smoothing.
 *
 * The bow depends only on the segment's two end points, not on their order or position in the
 * line: a trail walked out and back (A→B … B→A) bows the same way both times, so the two legs
 * stay one line instead of splitting into two parallel ones.
 */
export function handDrawn(points: LngLat[], seed: string, bow = 0.06): LngLat[] {
  if (points.length < 2) return points;
  const key = ([x, y]: LngLat) => `${x.toFixed(5)},${y.toFixed(5)}`;
  const bowed: LngLat[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    // Canonical order, so A→B and B→A get the same bow and the same midpoint.
    const [ka, kb] = [key(a), key(b)];
    const [[px, py], [qx, qy]] = ka <= kb ? [a, b] : [b, a];
    const dx = qx - px, dy = qy - py;
    const amount = (seededRandom(`${seed}|${ka <= kb ? ka : kb}|${ka <= kb ? kb : ka}`)() - 0.5) * 2 * bow;
    // Midpoint pushed perpendicular to the segment.
    bowed.push([px + dx / 2 - dy * amount, py + dy / 2 + dx * amount], b);
  }
  return chaikin(bowed, 2);
}

/* ---------------------------------------------------- generated geometry */

/** Lat/lng lines every `step` degrees over an area; every `majorEvery`-th line is "major". */
export function graticule(area: Bounds, step: number, majorEvery: number): FeatureCollection<LineFeature<{ major: boolean }>> {
  const features: LineFeature<{ major: boolean }>[] = [];
  const sub = step / 4; // vertices along each line, so it follows the curvature under pitch
  const isMajor = (v: number) => Math.abs(v / (step * majorEvery) - Math.round(v / (step * majorEvery))) < 1e-6;
  for (let lng = Math.ceil(area.west / step) * step; lng <= area.east + 1e-9; lng += step) {
    const coords: LngLat[] = [];
    for (let lat = area.south; lat <= area.north + 1e-9; lat += sub) coords.push([lng, lat]);
    features.push({ type: "Feature", properties: { major: isMajor(lng) }, geometry: { type: "LineString", coordinates: coords } });
  }
  for (let lat = Math.ceil(area.south / step) * step; lat <= area.north + 1e-9; lat += step) {
    const coords: LngLat[] = [];
    for (let lng = area.west; lng <= area.east + 1e-9; lng += sub) coords.push([lng, lat]);
    features.push({ type: "Feature", properties: { major: isMajor(lat) }, geometry: { type: "LineString", coordinates: coords } });
  }
  return { type: "FeatureCollection", features };
}

/** A rectangle with holes cut out: used to veil everything outside Nepal. */
export function maskOutside(area: Bounds, holes: LngLat[][]): PolygonFeature<Record<string, never>> {
  const { west, south, east, north } = area;
  const outer: LngLat[] = [[west, south], [east, south], [east, north], [west, north], [west, south]];
  // Holes must wind opposite to the outer ring; GeoJSON renderers in MapLibre accept either,
  // but reversing keeps it valid for any other tool reading it.
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [outer, ...holes.map((ring) => [...ring].reverse())] },
  };
}

/** The outer rings of every polygon in a FeatureCollection. */
export function outerRings(fc: AnyCollection): LngLat[][] {
  const rings: LngLat[][] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    if (g?.type === "Polygon") rings.push((g.coordinates as LngLat[][])[0]);
    if (g?.type === "MultiPolygon") for (const poly of g.coordinates as LngLat[][][]) rings.push(poly[0]);
  }
  return rings;
}
