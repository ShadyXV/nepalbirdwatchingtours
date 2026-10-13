/**
 * THE MAP LOOK: every visual constant of the terrain and the map-drawn layers, and the MapLibre
 * style built from them. Colours come from the design tokens (app/design/tokens.css, group 4 "map");
 * this file holds the numbers: elevation stops, light directions, opacities, widths.
 *
 * Retuning the terrain: change the colours in tokens.css, the elevation stops in RELIEF_STOPS,
 * the light in HILLSHADE. Nothing else needs to change.
 */
import type { StyleSpecification } from "maplibre-gl";
import { readToken, type TokenName } from "~/design/tokens";
import { assetUrl } from "~/lib/site";

/* ------------------------------------------------------------ elevation */

/**
 * Public Terrarium-encoded DEM tiles (AWS Open Data "Terrain Tiles", from Mapzen).
 * Development only: before launch we self-host a Nepal-only tile set (docs/MAP.md).
 */
export const DEM = {
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  encoding: "terrarium" as const,
  tileSize: 256,
  /** Highest zoom fetched for colour + hillshade; MapLibre overzooms beyond it. */
  maxzoom: 12,
  /** The 3D mesh needs less detail than the shading. */
  terrainMaxzoom: 11,
  /** Never request tiles outside this box (lng/lat). */
  bounds: [75.5, 23, 93, 33.5] as [number, number, number, number],
  attribution:
    '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noopener">Terrain: Mapzen / AWS (SRTM and others)</a> · <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a>',
};

/** 3D terrain exaggeration (used only on devices that can afford 3D, see perf.ts). */
export const TERRAIN_EXAGGERATION = 1.3;

/** Elevation (m) → relief colour token. Natural colours: Terai greens → ochre ridges → greys → snow. */
export const RELIEF_STOPS: [elevationM: number, token: TokenName][] = [
  [80, "--color-map-terai"],
  [500, "--color-map-lowland"],
  [1100, "--color-map-hills"],
  [1900, "--color-map-midhills"],
  [2900, "--color-map-ridge"],
  [3800, "--color-map-alpine"],
  [4600, "--color-map-rock"],
  [5400, "--color-map-scree"],
  [6000, "--color-map-snow"],
];

/**
 * Multidirectional hillshade: several lights, averaged. The first is the warm "low sun" from the
 * north-west that gives the San Rita-like raking read of the ridges; the others fill in.
 * Directions are relative to the screen (anchor "viewport"), so light always falls from the
 * upper left however the camera is turned.
 */
export const HILLSHADE = {
  exaggeration: 0.55,
  lights: [
    { direction: 315, altitude: 30, highlight: 0.42, shadow: 0.62 },
    { direction: 270, altitude: 40, highlight: 0.18, shadow: 0.36 },
    { direction: 350, altitude: 45, highlight: 0.14, shadow: 0.3 },
  ],
};

/* --------------------------------------------------------------- layers */

/** Veil over the land outside Nepal: dark, so the country reads as the object. */
export const OUTSIDE = { opacity: 0.66, edgeGlowWidth: 26, edgeGlowOpacity: 0.55, borderOpacity: 0.32 };

/** Faint paper-sheet graticule: opacity by zoom. */
export const GRATICULE = {
  step: 0.5,
  majorEvery: 2,
  area: { west: 77.5, south: 24.5, east: 91, north: 32 },
  opacity: { major: [[5, 0.16], [9, 0.1], [12, 0.04]], minor: [[6.5, 0], [8, 0.07], [12, 0.03]] } as const,
};

/** Route lines (px). The active trip route draws over a thin dark casing. */
export const ROUTE = {
  width: [[6, 2], [10, 3.5], [13, 4.5]] as const,
  casingExtra: 3,
  casingOpacity: 0.7,
  blur: 0.6,
  /** Other trips' routes, shown faintly on the overview and on place pages. */
  faintOpacity: 0.45,
  faintWidth: [[6, 1.2], [12, 2.5]] as const,
};

/** Soft glow along a mountain range while one of its peaks (or the range itself) is open. */
export const RANGE_GLOW = { opacity: 0.32, width: [[7, 40], [10, 120], [12, 260]] as const, blur: 1 };

/** Sky and haze at pitched views (horizon blends into the dark page). */
export const SKY = { fogGroundBlend: 0.4, horizonFogBlend: 0.7, skyHorizonBlend: 0.75 };

/* --------------------------------------------------------- source / ids */

export const SRC = {
  dem: "dem",
  demTerrain: "dem-terrain",
  outside: "outside",
  nepal: "nepal",
  graticule: "graticule",
  routes: "routes",
  rangeGlow: "range-glow",
} as const;

export const LAYER = {
  relief: "relief",
  hillshade: "hillshade",
  outside: "outside-veil",
  edgeGlow: "nepal-edge-glow",
  border: "nepal-border",
  graticuleMajor: "graticule-major",
  graticuleMinor: "graticule-minor",
  rangeGlow: "range-glow",
  rangeGlowPeaks: "range-glow-peaks",
  routesFaint: "routes-faint",
  routeCasing: "route-casing",
  route: "route",
} as const;

export const NEPAL_GEOJSON_URL = assetUrl("/geo/nepal.geojson");

/* ---------------------------------------------------------------- style */

/** "#rrggbb" + alpha → rgba(). */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

type ZoomStops = readonly (readonly [number, number])[];
const byZoom = (stops: ZoomStops) => ["interpolate", ["linear"], ["zoom"], ...stops.flat()] as unknown as number;
const byZoomExp = (stops: ZoomStops) => ["interpolate", ["exponential", 1.6], ["zoom"], ...stops.flat()] as unknown as number;

/** A line-gradient that is one colour along the whole line. */
export function solidGradient(color: string) {
  return ["interpolate", ["linear"], ["line-progress"], 0, color, 1, color] as never;
}

/** A line-gradient that shows the first `progress` (0..1) of the line, transparent after. */
export function drawnGradient(color: string, progress: number) {
  if (progress >= 1) return solidGradient(color);
  const p = Math.max(0.0001, Math.min(0.998, progress));
  return ["interpolate", ["linear"], ["line-progress"], 0, color, p, color, p + 0.001, "rgba(0,0,0,0)", 1, "rgba(0,0,0,0)"] as never;
}

const EMPTY = { type: "FeatureCollection" as const, features: [] };

/** The full MapLibre style. Client only (reads tokens from CSS). */
export function buildStyle({ terrain }: { terrain: boolean }): StyleSpecification {
  const c = (name: TokenName) => readToken(name);
  const relief = RELIEF_STOPS.flatMap(([m, token]) => [m, c(token)]);
  const route = c("--color-route");
  const night = c("--color-night");

  return {
    version: 8,
    sources: {
      [SRC.dem]: {
        type: "raster-dem",
        tiles: DEM.tiles,
        encoding: DEM.encoding,
        tileSize: DEM.tileSize,
        maxzoom: DEM.maxzoom,
        bounds: DEM.bounds,
        attribution: DEM.attribution,
      },
      // A separate source for the 3D mesh (MapLibre renders better with one source per use).
      [SRC.demTerrain]: {
        type: "raster-dem",
        tiles: DEM.tiles,
        encoding: DEM.encoding,
        tileSize: DEM.tileSize,
        maxzoom: DEM.terrainMaxzoom,
        bounds: DEM.bounds,
      },
      [SRC.outside]: { type: "geojson", data: EMPTY },
      [SRC.nepal]: { type: "geojson", data: EMPTY },
      [SRC.graticule]: { type: "geojson", data: EMPTY },
      [SRC.routes]: { type: "geojson", data: EMPTY, lineMetrics: true },
      [SRC.rangeGlow]: { type: "geojson", data: EMPTY },
    },
    ...(terrain ? { terrain: { source: SRC.demTerrain, exaggeration: TERRAIN_EXAGGERATION } } : {}),
    sky: {
      "sky-color": night,
      "horizon-color": c("--color-map-haze"),
      "fog-color": c("--color-map-haze"),
      "fog-ground-blend": SKY.fogGroundBlend,
      "horizon-fog-blend": SKY.horizonFogBlend,
      "sky-horizon-blend": SKY.skyHorizonBlend,
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": night } },
      {
        id: LAYER.relief,
        type: "color-relief",
        source: SRC.dem,
        paint: { "color-relief-color": ["interpolate", ["linear"], ["elevation"], ...relief] as never },
      },
      {
        id: LAYER.hillshade,
        type: "hillshade",
        source: SRC.dem,
        paint: {
          "hillshade-method": "multidirectional",
          "hillshade-exaggeration": HILLSHADE.exaggeration,
          "hillshade-illumination-anchor": "viewport",
          "hillshade-illumination-direction": HILLSHADE.lights.map((l) => l.direction),
          "hillshade-illumination-altitude": HILLSHADE.lights.map((l) => l.altitude),
          "hillshade-highlight-color": HILLSHADE.lights.map((l) => withAlpha(c("--color-map-light"), l.highlight)),
          "hillshade-shadow-color": HILLSHADE.lights.map((l) => withAlpha(c("--color-map-shade"), l.shadow)),
        },
      },
      {
        id: LAYER.outside,
        type: "fill",
        source: SRC.outside,
        paint: { "fill-color": c("--color-map-outside"), "fill-opacity": OUTSIDE.opacity, "fill-antialias": false },
      },
      {
        id: LAYER.edgeGlow,
        type: "line",
        source: SRC.nepal,
        layout: { "line-join": "round" },
        paint: {
          "line-color": c("--color-map-outside"),
          "line-width": OUTSIDE.edgeGlowWidth,
          "line-blur": OUTSIDE.edgeGlowWidth,
          "line-opacity": OUTSIDE.edgeGlowOpacity,
        },
      },
      {
        id: LAYER.border,
        type: "line",
        source: SRC.nepal,
        layout: { "line-join": "round" },
        paint: { "line-color": c("--color-snow"), "line-width": 1, "line-opacity": OUTSIDE.borderOpacity },
      },
      {
        id: LAYER.graticuleMinor,
        type: "line",
        source: SRC.graticule,
        filter: ["!=", ["get", "major"], true],
        paint: { "line-color": c("--color-mist"), "line-width": 1, "line-opacity": byZoom(GRATICULE.opacity.minor) },
      },
      {
        id: LAYER.graticuleMajor,
        type: "line",
        source: SRC.graticule,
        filter: ["==", ["get", "major"], true],
        paint: { "line-color": c("--color-mist"), "line-width": 1, "line-opacity": byZoom(GRATICULE.opacity.major) },
      },
      {
        id: LAYER.rangeGlow,
        type: "line",
        source: SRC.rangeGlow,
        filter: ["==", ["geometry-type"], "LineString"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": c("--color-map-light"),
          "line-width": byZoomExp(RANGE_GLOW.width),
          "line-blur": byZoomExp(RANGE_GLOW.width),
          "line-opacity": 0,
          "line-opacity-transition": { duration: 900, delay: 0 },
        },
      },
      {
        id: LAYER.rangeGlowPeaks,
        type: "circle",
        source: SRC.rangeGlow,
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-color": c("--color-map-light"),
          "circle-radius": byZoomExp(RANGE_GLOW.width),
          "circle-blur": RANGE_GLOW.blur,
          "circle-opacity": 0,
          "circle-opacity-transition": { duration: 900, delay: 0 },
          "circle-pitch-alignment": "map",
        },
      },
      {
        id: LAYER.routesFaint,
        type: "line",
        source: SRC.routes,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": route,
          "line-width": byZoom(ROUTE.faintWidth),
          "line-opacity": ROUTE.faintOpacity,
          "line-blur": ROUTE.blur,
        },
      },
      {
        id: LAYER.routeCasing,
        type: "line",
        source: SRC.routes,
        filter: ["==", ["get", "slug"], ""],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-gradient": solidGradient(night),
          "line-width": byZoom(ROUTE.width.map(([z, w]) => [z, w + ROUTE.casingExtra] as const)),
          "line-opacity": ROUTE.casingOpacity,
          "line-blur": ROUTE.blur,
        },
      },
      {
        id: LAYER.route,
        type: "line",
        source: SRC.routes,
        filter: ["==", ["get", "slug"], ""],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-gradient": solidGradient(route),
          "line-width": byZoom(ROUTE.width),
          "line-blur": ROUTE.blur,
        },
      },
    ],
  };
}
