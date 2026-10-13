/**
 * MapController: the imperative side of the map. Owns the MapLibre instance, the DOM markers and
 * the camera, and turns a declarative `MapView` (what the URL says) into the map states:
 *
 *   S0 overview  /                     trip pins, few labels, faint routes; home gestures
 *   S1 trip      /trips/:slug          route draws in, stops pop in
 *   S2 stop      /trips/:slug?stop=id  focus on the stop (lens), camera chosen so it is visible
 *   S3 place     /places/:id           place framed (peaks: an unobstructed face), range lit
 *
 * It also hosts the STEPPING ENGINE (see `StepperApi` below and docs/MAP.md): focus a trip's stops
 * one by one with a visibility-aware camera, and remember where the camera was before stepping
 * began. The URL (?stop=) uses it.
 *
 * And the DAY VIEW engine ("the journey", `JourneyApi`, docs/JOURNEY.md): a trip's days one by one,
 * each straightened (the day's walk runs up the screen), the map muted, today's stretch drawn in,
 * plus the ORBIT controls (orbit.ts) that turn the camera around the point in focus.
 *
 * The first view after load is applied without animation (direct landings arrive "already there");
 * later changes animate, unless the visitor prefers reduced motion (then everything jumps).
 * Rendering is on demand: nothing animates while the map is idle.
 */
import { Map as MapLibreMap, Marker, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { Landmark, LngLat, Trip, Waypoint } from "~/content/types";
import { readDurationMs, readToken } from "~/design/tokens";
import { parseEasing } from "~/lib/easing";
import { boundsOf, distanceKm, graticule, handDrawn, maskOutside, outerRings, wrapDegrees, type Bounds, type LineFeature } from "~/lib/geo";
import { dayInsets, mapInsets, type MapLayoutMode } from "~/lib/mapLayout";
import { alongLine, tripDays, tripLine, type TripDay } from "~/lib/tripDays";
import { keyStops } from "~/lib/tripStops";
import {
  CAMERA,
  dayBearing,
  dayMoveMs,
  dayPitch,
  fitDay,
  faceBearing,
  fitTrip,
  minZoomFor,
  NEPAL_FRAME,
  nepalBounds,
  overviewCamera,
  placeCamera,
  previewCamera,
  stopCamera,
  travelBearing,
  tripAnchor,
  tripCamera,
  tripPoints,
  type CameraTarget,
  type DayFraming,
  type Frame,
} from "./camera";
import { DemSampler } from "./dem";
import { Gestures, type HintTexts } from "./gestures";
import { placeLabels, type LabelCandidate } from "./labels";
import { buildStyle, DEM, drawnGradient, GRATICULE, HILLSHADE, LAYER, NEPAL_GEOJSON_URL, OUTSIDE, RANGE_GLOW, SRC, TERRAIN_EXAGGERATION } from "./look";
import { createLens, createPlaceLabel, createStopMarker, createTourTag, createTripPin, placeAnchor, type MarkerDom } from "./markers";
import { canAfford3D, initialPixelRatio, watchFrames } from "./perf";
import { Orbit } from "./orbit";
import { drawRoute, mapRouteColors, setRouteProgress, type RouteColors } from "./routeDraw";
import { MediaReveal, type RevealContent } from "./reveal";
import { chooseView, eyeFor, lineOfSight } from "./visibility";

setWorkerUrl(workerUrl);

/* ------------------------------------------------------------- tunables */

/** Labels of tier-2 places appear from this zoom. */
const TIER2_FROM_ZOOM = 8.6;
/** Range names belong to the middle scales. */
const RANGE_ZOOMS = [6.6, 10.6] as const;
/** Small points of interest appear from this zoom. */
const POI_FROM_ZOOM = 10;
/** Stop names appear from these zooms (key stops earlier; minor stops only when close). */
const STOP_LABEL_ZOOM = { key: 11.2, minor: 13 };
/** Share of the flight after which the route starts drawing / the stops start popping. */
const DRAW_AT = 0.55;
const POP_AT = 0.62;
/** Highest pitch used when 3D terrain is off (a flat map at high pitch looks empty). */
const FLAT_MAX_PITCH = 45;
/** Below this map width, swiping the home trip cards also moves the camera. */
const PREVIEW_CAMERA_BELOW = 1024;

/**
 * Day view: the map's quiet "day mood" (paint overrides, restored on leaving; look.ts is untouched)
 * and the route there: the whole trip faint, the days walked so far pale, today's stretch drawn in.
 */
const DAY_MOOD = {
  /** Paint transitions into / out of the mood, ms (reduced motion: instant). */
  ms: 400,
  /** How much the terrain (relief colour and hillshade) recedes: the token `--map-day-terrain-dim`. */
  terrainDim: () => Math.min(1, Math.max(0, Number.parseFloat(readToken("--map-day-terrain-dim")) || 0)),
  /** The trip's whole route (and its casing) under the day overlay. */
  routeOpacity: 0.28,
};
const DAY_ROUTE = {
  doneOpacity: 0.6,
  doneWidth: 2.4,
  todayWidth: 4.2,
  todayCasingWidth: 8,
  todayCasingOpacity: 0.55,
  /** A soft warm glow along today's walk: its corridor stays a little clearer than the dimmed land. */
  corridorWidth: 120,
  corridorOpacity: 0.1,
  /** Today's stretch draws in over this long, starting this long after the step. */
  drawMs: 900,
  drawDelayMs: 250,
};
/** Day overlay ids (added at runtime on top of the trip's route; look.ts is not touched). */
const JOURNEY_SRC = "journey-route";
const JOURNEY_LAYER = { corridor: "journey-corridor", done: "journey-done", casing: "journey-today-casing", today: "journey-today" } as const;
/** Line of sight for "seen from here": eye height over the ground, refraction, tolerance. */
const PEAK_SIGHT = { eyeM: 10, refraction: 0.13, marginM: 20, samples: 64, skipStart: 0.02, skipEnd: 0.03 };
const EARTH_RADIUS_M = 6371000;
/** After leaving the day view, the stage shrinks back: don't re-frame the restored camera. */
const AFTER_JOURNEY_QUIET_MS = 1200;

/* ---------------------------------------------------------------- types */

export type MapView = {
  tripSlug: string | null;
  waypointId: string | null;
  placeId: string | null;
  previewSlug: string | null;
};

/** How a stop came into focus. */
export type StepSource = "url" | "engine";

/** What the stepping engine is doing; sent to React on every change. */
export type StepState = {
  tripSlug: string | null;
  /** The trip's key stops (what next / prev step through), in order. */
  keyStopIds: string[];
  /** Index of the focused stop among the key stops; -1 = whole route, or a non-key stop. */
  index: number;
  /** The focused stop, or null for the whole route. */
  waypointId: string | null;
  source: StepSource | null;
};

export type StepOptions = {
  /** 1 = moving forward along the route (camera prefers the direction of travel), -1 = backwards. */
  direction?: 1 | -1;
  source?: StepSource;
};

/**
 * The stepping engine, as exposed to React (via NepalMap's onReady). Camera-only: it never changes
 * the URL. Indexes are into the trip's key stops.
 */
export type StepperApi = {
  /** Focus key stop `index` (camera + highlight). Resolves when the camera has arrived. */
  goToStop: (index: number, options?: StepOptions) => Promise<void>;
  /** Next / previous key stop; resolves false when there is none (nothing moves). */
  next: (options?: StepOptions) => Promise<boolean>;
  prev: (options?: StepOptions) => Promise<boolean>;
  /** Back to exactly where the camera was before stepping began (usually the whole route). */
  back: () => Promise<void>;
  state: () => StepState;
};

/** Options for one day step. */
export type DayStepOptions = {
  /** 1 = forward along the trip, -1 = back. */
  direction?: 1 | -1;
  /** False: jump (direct landing, resize). Reduced motion always jumps. */
  animate?: boolean;
};

/**
 * The day view engine ("the journey", docs/JOURNEY.md). Camera-only, like the stepper: the URL
 * (`?day=`) and the day composition live in React (components/journey). Days are 1-based; day
 * D + 1 is "the whole way" (the full route).
 */
export type JourneyApi = {
  /** Enter the day view on `day`: remembers the camera (closeJourney returns to it), mutes the map. */
  openJourney: (day: number, options?: DayStepOptions) => Promise<void>;
  /** Move to another day: straightened, fitted, visibility-checked camera; today's stretch draws in. */
  goToDay: (day: number, options?: DayStepOptions) => Promise<void>;
  /** One of the current day's stops was chosen (a midpoint tap): camera there; null = back to the day. */
  focusDayStop: (waypointId: string | null) => Promise<void>;
  /** Leave the day view: the camera returns to exactly where it was, the map look comes back. */
  closeJourney: (options?: { animate?: boolean }) => Promise<void>;
  /** "day": the muted day look; "normal": the map as styled. */
  setMapMood: (mood: "day" | "normal", durationMs?: number) => void;
  /** Day-view events: a stop marker tapped (one of today's stops), the camera settled (re-layout). */
  setJourneyListener: (listener: JourneyListener | null) => void;
  /**
   * Where the day sits on screen (map container px; the container is the whole screen in the day
   * view): the bounds of today's route (the whole route on the last card), its stop markers and
   * their visible labels, and the anchor's point. Null outside the day view.
   */
  journeyFootprint: () => JourneyFootprint | null;
  /**
   * "Seen from here": which of `peaks` have a clear line of sight from `from` (eye 10 m over the
   * ground, earth curvature and refraction included). Null when the elevation data isn't available.
   */
  visiblePeaks: (from: LngLat, peaks: Landmark[]) => Promise<Set<string> | null>;
};

export type JourneyListener = {
  stop?: (waypointId: string) => void;
  /** The camera came to rest (after a step, a midpoint, an orbit, a resize). */
  frame?: () => void;
};

export type JourneyFootprint = {
  rect: { x: number; y: number; w: number; h: number };
  anchor: { x: number; y: number } | null;
};

/** Orbit controls (orbit.ts): turn around the point in focus, keeping pitch and zoom. */
export type OrbitApi = {
  /** One eased turn (CAMERA.orbitStepDeg); 1 = bearing grows, -1 = back. */
  orbit: (direction: 1 | -1) => void;
  /** Press and hold: keep turning (CAMERA.orbitDegPerSec) until orbitRelease(). */
  orbitHold: (direction: 1 | -1) => void;
  orbitRelease: () => void;
};

export type MapApi = StepperApi &
  JourneyApi &
  OrbitApi & {
  /** Back to the state's own bearing and pitch (in the day view: the straightened day camera). */
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Opacity of the "outside Nepal" veil (0 = none); see look.ts OUTSIDE. */
  setOutsideVeil: (opacity: number, durationMs?: number) => void;
  /** Nepal's outline as an SVG path in map pixels for the current camera. */
  nepalOutlinePath: () => string | null;
};

export type MapHandlers = {
  onSelectTrip: (slug: string | null) => void;
  onSelectWaypoint: (id: string | null) => void;
  onSelectPlace: (id: string | null) => void;
  onStepChange: (state: StepState) => void;
  /** The user turned or tilted the view away from the app's (show "reset view"). */
  onViewAdjusted: (adjusted: boolean) => void;
};

export type MapContent = {
  trips: Trip[];
  landmarks: Landmark[];
  /** "142 birds" for a trip (already translated) and the number in it. */
  birds: (trip: Trip) => { label: string; count: number };
  /** Accessible name of a stop, e.g. "Day 4, Tadapani". */
  stopLabel: (trip: Trip, index: number) => string;
  /** "Day 4". */
  dayLabel: (day: number) => string;
  hints: HintTexts;
  /** Hover media reveal content (null = nothing to reveal for that marker). */
  revealTrip: (trip: Trip) => RevealContent | null;
  revealStop: (trip: Trip, waypoint: Waypoint, key: boolean) => RevealContent | null;
};

type MapStateName = "overview" | "trip" | "stop" | "place";

type PlacedMarker = { marker: Marker; dom: MarkerDom };
type StopMarker = PlacedMarker & { waypoint: Waypoint; key: boolean };
type CameraSnapshot = { center: LngLat; zoom: number; bearing: number; pitch: number };

/** The open day view. */
type Journey = {
  trip: Trip;
  days: TripDay[];
  /** Current day, 1-based; days.length + 1 = "the whole way". */
  day: number;
  /** Straightened bearing per day (index = day − 1). */
  bearings: number[];
  /** The trip's hand-drawn line (as on the map) and each day's anchor position along it. */
  line: LngLat[];
  anchorVertex: number[];
  /** Exactly where the camera was before the day view opened (with its padding). */
  before: CameraSnapshot & { padding: ReturnType<MapLibreMap["getPadding"]> };
  /** The stepping engine's focus before (restored on close). */
  stepBefore: { waypointId: string | null; source: StepSource | null };
  /** A tapped stop of the current day, or null (the day's own view). */
  focusId: string | null;
  /** The day camera last applied (for midpoint taps and reset view). */
  target: CameraTarget | null;
  /** Today's stretch of the hand-drawn line (the whole line on the last card). */
  todayLine: LngLat[];
};

const stateOf = (v: MapView): MapStateName =>
  v.placeId ? "place" : v.tripSlug ? (v.waypointId ? "stop" : "trip") : "overview";

const layoutModeOf = (state: MapStateName): MapLayoutMode =>
  state === "overview" ? "home" : state === "place" ? "place" : "trip";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Bounds around a set of points, grown by `km` on every side. */
function grow(points: LngLat[], km: number): Bounds {
  const b = boundsOf(points);
  const dLat = km / 111.32;
  const dLng = km / (111.32 * Math.cos((((b.south + b.north) / 2) * Math.PI) / 180));
  return { west: b.west - dLng, south: b.south - dLat, east: b.east + dLng, north: b.north + dLat };
}

/* ----------------------------------------------------------- controller */

export class MapController {
  private readonly map: MapLibreMap;
  private readonly container: HTMLElement;
  private readonly content: MapContent;
  private readonly handlers: () => MapHandlers;
  private readonly gestures: Gestures;
  private readonly dem: DemSampler;
  private readonly reveal: MediaReveal;

  private readonly tripsBySlug: Map<string, Trip>;
  private readonly placesById: Map<string, Landmark>;
  /** Trip pins and always-labelled places: what the portrait overview frames. */
  private readonly focusPoints: LngLat[];
  /** Trip stops and cities: where peaks are looked at from. */
  private readonly viewpoints: LngLat[];

  private view: MapView;
  private loaded = false;
  private appliedOnce = false;
  private terrainOn: boolean;
  private colors: RouteColors;

  private pins = new Map<string, PlacedMarker>();
  private places = new Map<string, PlacedMarker>();
  private stops: { slug: string; items: StopMarker[] } | null = null;
  private lens: HTMLElement | null = null;
  private tourTag: HTMLElement | null = null;

  /* stepping engine */
  private trip: Trip | null = null;
  private step: { waypointId: string | null; source: StepSource | null } = { waypointId: null, source: null };
  /** Where the camera was before stepping began (camera history for back()). */
  private beforeStepping: CameraSnapshot | null = null;
  /** Chosen visible views, per stop / trip / place (bearing + pitch). */
  private viewCache = new Map<string, { bearing: number; pitch: number }>();
  /** Bumped on every camera move request, so a slow visibility check never moves a stale camera. */
  private moveGeneration = 0;
  private previewTimer = 0;

  /** Nepal's outline rings once /geo/nepal.geojson has loaded (see nepalOutlinePath). */
  private nepalRings: LngLat[][] = [];

  private cancelDraw: (() => void) | null = null;
  private timers = new Set<number>();

  /* day view, orbit */
  private journey: Journey | null = null;
  private journeyListener: JourneyListener | null = null;
  private journeyClosedAt = Number.NEGATIVE_INFINITY;
  private cancelDayDraw: (() => void) | null = null;
  /** Paint values the day mood replaced (restored by setMapMood("normal")). */
  private moodSaved: [layer: string, property: string, value: unknown][] | null = null;
  private readonly orbitControl: Orbit;
  private disposers: (() => void)[] = [];

  constructor(container: HTMLElement, content: MapContent, handlers: () => MapHandlers, initial: MapView) {
    this.container = container;
    this.content = content;
    this.handlers = handlers;
    this.view = initial;
    this.tripsBySlug = new Map(content.trips.map((t) => [t.slug, t]));
    this.placesById = new Map(content.landmarks.map((l) => [l.id, l]));
    this.focusPoints = [
      ...content.trips.map(tripAnchor),
      ...content.landmarks.filter((l) => l.labelTier === 1).map((l) => l.coords),
    ];
    this.viewpoints = [
      ...content.trips.flatMap((t) => t.waypoints.map((w) => w.coords)),
      ...content.landmarks.filter((l) => l.kind === "city").map((l) => l.coords),
    ];
    this.terrainOn = canAfford3D();
    this.colors = mapRouteColors();
    this.dem = new DemSampler(DEM.tiles[0]);

    // Start already framed on the initial state: no jump after load.
    const start = this.targetFor(initial, this.frameFor(stateOf(initial)));
    this.map = new MapLibreMap({
      container,
      style: buildStyle({ terrain: this.terrainOn }),
      center: start.center,
      zoom: start.zoom,
      bearing: start.bearing,
      pitch: start.pitch,
      minZoom: Math.min(start.zoom, minZoomFor(container.clientWidth, container.clientHeight)),
      maxZoom: CAMERA.maxZoom,
      maxPitch: CAMERA.maxPitch,
      maxBounds: nepalBounds(CAMERA.hardBoundsMargin),
      pixelRatio: initialPixelRatio(),
      canvasContextAttributes: { antialias: (window.devicePixelRatio || 1) < 2 },
      attributionControl: false,
      fadeDuration: 0,
      renderWorldCopies: false,
    });
    this.map.setPadding(start.padding);

    this.gestures = new Gestures(this.map, container, content.hints, {
      onUserInput: () => this.reveal.hide(),
      onAdjusted: (adjusted) => this.handlers().onViewAdjusted(adjusted),
    });
    this.gestures.setMode(stateOf(initial) === "overview" ? "overview" : "explore");

    // Orbit around the point in focus (buttons, Q / E, right-drag): see orbit.ts.
    this.orbitControl = new Orbit(this.map, container, {
      focus: () => this.orbitFocus(),
      onStart: () => {
        this.gestures.orbitStart();
        this.reveal.hide();
      },
      onEnd: () => {
        this.gestures.orbitEnd();
        this.updateLabels();
        if (this.journey) this.journeyListener?.frame?.();
      },
      dragAllowed: () => Boolean(this.journey) || stateOf(this.view) !== "overview",
    });
    this.disposers.push(() => this.orbitControl.destroy());

    // Hover media reveal: placed in the map wrapper, clear of the content peek and stepper.
    this.reveal = new MediaReveal(container.parentElement ?? container, () => this.frameFor(stateOf(this.view)).padding);
    this.map.on("movestart", () => this.reveal.hide());
    const hideReveal = () => this.reveal.hide();
    window.addEventListener("scroll", hideReveal, { passive: true });
    this.disposers.push(() => {
      window.removeEventListener("scroll", hideReveal);
      this.reveal.destroy();
    });

    this.map.on("load", () => this.onLoad());
    this.map.once("idle", () => {
      container.classList.add("is-ready");
      this.updateLabels(); // terrain has loaded: markers sit at their final heights
    });
    this.later(() => container.classList.add("is-ready"), 2500);
    this.map.on("moveend", () => {
      if (this.orbitControl.active) return;
      this.updateLabels();
      // After the label pass (same frame): the day view re-lays its text and media around the route.
      if (this.journey) this.later(() => this.journeyListener?.frame?.(), 0);
    });
    this.disposers.push(
      watchFrames(this.map, (level) => {
        if (level === 1) this.setTerrain(false);
        else this.map.setPixelRatio(1);
      }),
      () => this.gestures.destroy(),
    );

    let resizeTimer = 0;
    this.map.on("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => this.reframe(), 200);
    });
    if (document.fonts) document.fonts.ready.then(() => this.updateLabels());
  }

  /* ================================================================ public */

  /** Apply what the URL says. Safe to call before the map has loaded. */
  setView(next: MapView): void {
    const prev = this.view;
    this.view = next;
    if (!this.loaded) return;
    const animate = this.appliedOnce && !prefersReducedMotion();
    this.apply(this.appliedOnce ? prev : null, next, animate);
    this.appliedOnce = true;
  }

  /** Everything React (and later the trip journey) may call. */
  api(): MapApi {
    return {
      goToStop: (index, options) => this.goToStop(index, options),
      next: (options) => this.stepBy(1, options),
      prev: (options) => this.stepBy(-1, options),
      back: () => this.back(),
      state: () => this.stepState(),
      openJourney: (day, options) => this.openJourney(day, options),
      goToDay: (day, options) => this.goToDay(day, options),
      focusDayStop: (id) => this.focusDayStop(id),
      closeJourney: (options) => this.closeJourney(options),
      setMapMood: (mood, ms) => this.setMapMood(mood, ms),
      setJourneyListener: (listener) => {
        this.journeyListener = listener;
      },
      journeyFootprint: () => this.journeyFootprint(),
      visiblePeaks: (from, peaks) => this.visiblePeaks(from, peaks),
      orbit: (direction) => void this.orbitControl.by(direction),
      orbitHold: (direction) => this.orbitControl.hold(direction),
      orbitRelease: () => this.orbitControl.release(),
      resetView: () => this.resetView(),
      zoomIn: () => {
        this.gestures.markInput();
        this.map.zoomIn();
      },
      zoomOut: () => {
        this.gestures.markInput();
        this.map.zoomOut();
      },
      setOutsideVeil: (opacity, durationMs) => this.setOutsideVeil(opacity, durationMs),
      nepalOutlinePath: () => this.nepalOutlinePath(),
    };
  }

  destroy(): void {
    this.cancelDraw?.();
    this.cancelDayDraw?.();
    window.clearTimeout(this.previewTimer);
    for (const id of this.timers) window.clearTimeout(id);
    for (const dispose of this.disposers) dispose();
    this.map.remove();
  }

  /* =============================================================== loading */

  private async onLoad(): Promise<void> {
    const map = this.map;
    this.geojson(SRC.graticule).setData(graticule(GRATICULE.area, GRATICULE.step, GRATICULE.majorEvery));
    this.geojson(SRC.routes).setData({
      type: "FeatureCollection",
      features: this.content.trips.map(
        (trip): LineFeature<{ slug: string }> => ({
          type: "Feature",
          properties: { slug: trip.slug },
          geometry: { type: "LineString", coordinates: handDrawn(trip.route ?? trip.waypoints.map((w) => w.coords), trip.slug) },
        }),
      ),
    });
    this.createPins();
    this.createPlaceLabels();

    this.loaded = true;
    this.apply(null, this.view, false);
    this.appliedOnce = true;

    // The outline is a small static file; until it arrives the map simply has no veil.
    try {
      const response = await fetch(NEPAL_GEOJSON_URL);
      const nepal = await response.json();
      if (!map.getSource(SRC.nepal)) return; // map was removed meanwhile
      this.nepalRings = outerRings(nepal);
      this.geojson(SRC.nepal).setData(nepal);
      this.geojson(SRC.outside).setData(maskOutside({ west: 60, south: 10, east: 110, north: 45 }, this.nepalRings));
    } catch {
      /* no veil: the map still works */
    }
  }

  private geojson(id: string) {
    const source = this.map.getSource(id);
    if (!source || source.type !== "geojson") throw new Error(`Missing GeoJSON source ${id}`);
    return source as unknown as { setData: (data: unknown) => void };
  }

  /* ============================================================== applying */

  private apply(prev: MapView | null, next: MapView, animate: boolean): void {
    const state = stateOf(next);
    const prevState = prev ? stateOf(prev) : null;
    const trip = next.tripSlug ? this.tripsBySlug.get(next.tripSlug) : undefined;
    const tripChanged = !prev || (prev.tripSlug ?? null) !== (trip?.slug ?? null);
    const flightMs = readDurationMs("--duration-map-flight");

    if (this.journey && tripChanged) this.dropJourney();
    this.container.dataset.state = state;
    this.reveal.hide();
    this.gestures.setMode(this.journey ? "journey" : state === "overview" ? "overview" : "explore");

    // Trip pins: only on the overview; the previewed one is raised.
    for (const [slug, { marker, dom }] of this.pins) {
      const preview = slug === next.previewSlug;
      dom.inner.classList.toggle("is-shown", state === "overview");
      dom.inner.classList.toggle("is-preview", preview);
      marker.getElement().style.zIndex = preview ? "3" : "2";
      dom.button.tabIndex = state === "overview" ? 0 : -1;
    }

    if (tripChanged) this.enterTrip(trip ?? null, animate, flightMs);
    this.updatePlaceStates(next, trip);

    // Camera.
    if (trip && !tripChanged && next.waypointId !== (prev?.waypointId ?? null)) {
      // Same trip, the URL's stop changed: a deliberate step (or closing the stop).
      if (next.waypointId) void this.focusStop(next.waypointId, { source: "url" }, animate);
      else void this.back(animate);
    } else if (trip && next.waypointId && tripChanged) {
      // Landing on (or flying to) a trip with ?stop: straight to the stop, the route is "before".
      void this.focusStop(next.waypointId, { source: "url" }, animate, { fromRoute: true });
    } else if (this.journey) {
      // The day view owns the camera; the overview's view is restored when it closes.
    } else if (!(trip && !tripChanged)) {
      // A new state (or the home preview changed). Same trip + same stop: the camera stays put.
      this.moveCamera(prev, prevState, next, animate);
    }
    if (!animate || !this.map.isMoving()) this.later(() => this.updateLabels(), 0);
  }

  /** Route, stops and stepping engine for a newly opened trip (or none). */
  private enterTrip(trip: Trip | null, animate: boolean, flightMs: number): void {
    this.cancelDraw?.();
    this.cancelDraw = null;
    this.trip = trip;
    this.step = { waypointId: null, source: null };
    this.beforeStepping = null;

    const slug = trip?.slug ?? "";
    this.map.setFilter(LAYER.route, ["==", ["get", "slug"], slug]);
    this.map.setFilter(LAYER.routeCasing, ["==", ["get", "slug"], slug]);
    this.map.setFilter(LAYER.routesFaint, ["!=", ["get", "slug"], slug]);
    this.clearStops(animate);
    this.setFocusHighlight(null, null);

    if (trip) {
      const drawMs = readDurationMs("--duration-route-draw");
      if (animate) {
        this.cancelDraw = drawRoute(this.map, this.colors, { delayMs: flightMs * DRAW_AT, durationMs: drawMs, easing: parseEasing(readToken("--ease-sheet")) });
      } else {
        setRouteProgress(this.map, this.colors, 1);
      }
      this.createStops(trip, animate ? flightMs * POP_AT : null);
      if (this.terrainOn) void this.dem.load(grow(tripPoints(trip), CAMERA.visibilityMarginKm), 15000);
    }
    this.emitStep();
  }

  private moveCamera(prev: MapView | null, prevState: MapStateName | null, next: MapView, animate: boolean): void {
    const state = stateOf(next);
    const frame = this.frameFor(state);
    const generation = ++this.moveGeneration;

    if (!animate || !prev) {
      this.map.jumpTo(this.targetFor(next, frame));
      // Direct landing: once the elevation is in, correct the view if the subject is hidden.
      void this.visibleTarget(next, frame, 15000).then((target) => {
        if (generation !== this.moveGeneration || !target || this.gestures.idleIn() > 0) return;
        if (Math.abs(target.bearing - this.map.getBearing()) < 3 && Math.abs(target.pitch - this.map.getPitch()) < 3) return;
        this.animate(target, readDurationMs("--duration-map-step"), "ease");
      });
      return;
    }

    if (state === "overview" && prevState === "overview") {
      // Only the home carousel preview can change here.
      const swiped = prev.previewSlug && next.previewSlug && prev.previewSlug !== next.previewSlug;
      if (swiped && this.container.clientWidth < PREVIEW_CAMERA_BELOW) this.previewWhenIdle(next.previewSlug!);
      return;
    }

    const duration = state === "overview" ? readDurationMs("--duration-map-return") : readDurationMs("--duration-map-flight");
    void this.visibleTarget(next, frame, CAMERA.visibilityWaitMs).then((checked) => {
      if (generation !== this.moveGeneration) return;
      this.animate(checked ?? this.targetFor(next, frame), duration, "fly");
    });
  }

  /** Home carousel swipe: ease to the card's pin, but never while the user is handling the map. */
  private previewWhenIdle(slug: string): void {
    window.clearTimeout(this.previewTimer);
    const wait = this.gestures.idleIn();
    if (wait > 0) {
      this.previewTimer = window.setTimeout(() => this.previewWhenIdle(slug), wait);
      return;
    }
    const trip = this.tripsBySlug.get(slug);
    if (!trip || stateOf(this.view) !== "overview" || this.view.previewSlug !== slug) return;
    const overview = this.targetFor(this.view, this.frameFor("overview"));
    this.animate(previewCamera(overview, tripAnchor(trip)), readDurationMs("--duration-map"), "ease");
  }

  /** Re-frame the current state after a resize (e.g. phone rotation). */
  private reframe(): void {
    if (!this.loaded || this.map.isMoving()) return;
    if (this.journey) {
      if (this.journey.focusId) void this.focusDayStop(this.journey.focusId, false);
      else void this.goToDay(this.journey.day, { animate: false });
      return;
    }
    if (performance.now() - this.journeyClosedAt < AFTER_JOURNEY_QUIET_MS) return;
    const target = this.targetFor(this.view, this.frameFor(stateOf(this.view)));
    this.map.setMinZoom(Math.min(target.zoom, minZoomFor(this.container.clientWidth, this.container.clientHeight)));
    if (this.gestures.idleIn() > 0 || this.step.waypointId) return; // don't undo the user's (or a stop's) view
    this.map.easeTo({ ...target, duration: prefersReducedMotion() ? 0 : 400 });
  }

  private frameFor(state: MapStateName): Frame {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      padding: mapInsets(layoutModeOf(state), this.container),
    };
  }

  /** The geometric camera for a view (no visibility check). */
  private targetFor(view: MapView, frame: Frame): CameraTarget {
    const trip = view.tripSlug ? this.tripsBySlug.get(view.tripSlug) : undefined;
    const place = view.placeId ? this.placesById.get(view.placeId) : undefined;
    let target: CameraTarget;
    if (place) target = placeCamera(place, this.viewpoints, frame);
    else if (trip && view.waypointId) target = stopCamera(trip, view.waypointId, frame) ?? tripCamera(trip, frame);
    else if (trip) target = tripCamera(trip, frame);
    else target = overviewCamera({ nepal: NEPAL_FRAME, focus: this.focusPoints }, frame);
    return this.flatten(target);
  }

  private flatten(target: CameraTarget): CameraTarget {
    return this.terrainOn ? target : { ...target, pitch: Math.min(target.pitch, FLAT_MAX_PITCH) };
  }

  /** Move the camera; resolves on arrival (or interruption). "fly" arcs out, "ease" glides. */
  private animate(target: CameraTarget, duration: number, kind: "fly" | "ease"): Promise<void> {
    this.orbitControl.stop();
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        this.map.off("moveend", finish);
        resolve();
      };
      this.map.on("moveend", finish);
      this.later(finish, duration + 400); // safety: no moveend when nothing had to move
      if (prefersReducedMotion() || duration <= 0) {
        this.map.jumpTo(target);
        return;
      }
      const easing = parseEasing(readToken("--ease-map"));
      if (kind === "fly") this.map.flyTo({ ...target, duration, easing, curve: CAMERA.flightCurve });
      else this.map.easeTo({ ...target, duration, easing });
    });
  }

  /* ===================================================== visibility checks */

  /**
   * The camera for a view, turned / tilted so its subject is not hidden behind terrain (see
   * visibility.ts). Null when there is nothing to check (overview, no 3D) or the elevation data
   * didn't arrive within `waitMs` (callers then use the geometric camera).
   */
  private async visibleTarget(view: MapView, frame: Frame, waitMs: number): Promise<CameraTarget | null> {
    if (!this.terrainOn) return null;
    const trip = view.tripSlug ? this.tripsBySlug.get(view.tripSlug) : undefined;
    const place = view.placeId ? this.placesById.get(view.placeId) : undefined;
    if (place?.kind === "peak") return this.visiblePeak(place, frame, waitMs);
    if (trip && view.waypointId) return this.visibleStop(trip, view.waypointId, frame, waitMs, {});
    if (trip) return this.visibleRoute(trip, frame, waitMs);
    return null;
  }

  private async visibleStop(
    trip: Trip,
    waypointId: string,
    frame: Frame,
    waitMs: number,
    { direction = 1, zoomOffset = 0 }: { direction?: 1 | -1; zoomOffset?: number },
  ): Promise<CameraTarget | null> {
    const base = stopCamera(trip, waypointId, frame);
    if (!base) return null;
    const target = { ...base, zoom: base.zoom + zoomOffset };
    if (!this.terrainOn) return this.flatten(target);
    const key = `stop:${trip.slug}/${waypointId}`;
    const cached = this.viewCache.get(key);
    if (cached) return { ...target, ...cached };
    if (!(await this.dem.load(grow([target.center], CAMERA.visibilityMarginKm), waitMs))) return null;
    const travel = travelBearing(trip, waypointId);
    const v = CAMERA.stop.visibility;
    const choice = chooseView({
      dem: this.dem,
      exaggeration: TERRAIN_EXAGGERATION,
      viewportHeight: frame.height,
      fovDeg: this.map.getVerticalFieldOfView(),
      baseBearing: this.map.getBearing(),
      travelBearing: travel === undefined ? undefined : direction === 1 ? travel : travel + 180,
      bearingStep: v.bearingStep,
      bearingSpan: v.bearingSpan,
      pitches: v.pitches,
      frame: () => ({ center: target.center, zoom: target.zoom }),
      targets: [target.center],
    });
    if (choice.decided) this.viewCache.set(key, { bearing: choice.bearing, pitch: choice.pitch });
    return { ...target, bearing: choice.bearing, pitch: choice.pitch };
  }

  private async visibleRoute(trip: Trip, frame: Frame, waitMs: number): Promise<CameraTarget | null> {
    const base = tripCamera(trip, frame);
    const key = `trip:${trip.slug}:${frame.width}x${frame.height}`;
    const cached = this.viewCache.get(key);
    const refit = (bearing: number, pitch: number) => ({ ...fitTrip(trip, frame, bearing, pitch), bearing, pitch, padding: frame.padding });
    if (cached) return refit(cached.bearing, cached.pitch);
    if (!(await this.dem.load(grow(tripPoints(trip), CAMERA.visibilityMarginKm), waitMs))) return null;
    const v = CAMERA.trip.visibility;
    const choice = chooseView({
      dem: this.dem,
      exaggeration: TERRAIN_EXAGGERATION,
      viewportHeight: frame.height,
      fovDeg: this.map.getVerticalFieldOfView(),
      baseBearing: base.bearing,
      bearingStep: v.bearingStep,
      bearingSpan: v.bearingSpan,
      pitches: v.pitches,
      frame: (bearing, pitch) => fitTrip(trip, frame, bearing, pitch),
      targets: keyStops(trip).map((w) => w.coords),
    });
    if (choice.decided) this.viewCache.set(key, { bearing: choice.bearing, pitch: choice.pitch });
    return refit(choice.bearing, choice.pitch);
  }

  private async visiblePeak(peak: Landmark, frame: Frame, waitMs: number): Promise<CameraTarget | null> {
    const base = placeCamera(peak, this.viewpoints, frame);
    const key = `place:${peak.id}`;
    const cached = this.viewCache.get(key);
    if (cached) return { ...base, ...cached };
    if (!(await this.dem.load(grow([peak.coords], CAMERA.visibilityMarginKm), waitMs))) return null;
    const v = CAMERA.place.visibility;
    const choice = chooseView({
      dem: this.dem,
      exaggeration: TERRAIN_EXAGGERATION,
      viewportHeight: frame.height,
      fovDeg: this.map.getVerticalFieldOfView(),
      baseBearing: faceBearing(peak, this.viewpoints),
      bearingStep: v.bearingStep,
      bearingSpan: v.bearingSpan,
      pitches: v.pitches,
      frame: () => ({ center: base.center, zoom: base.zoom }),
      targets: [peak.coords],
    });
    if (choice.decided) this.viewCache.set(key, { bearing: choice.bearing, pitch: choice.pitch });
    return { ...base, bearing: choice.bearing, pitch: choice.pitch };
  }

  /* ======================================================= stepping engine */

  private stepState(): StepState {
    const keys = this.trip ? keyStops(this.trip) : [];
    return {
      tripSlug: this.trip?.slug ?? null,
      keyStopIds: keys.map((w) => w.id),
      index: keys.findIndex((w) => w.id === this.step.waypointId),
      waypointId: this.step.waypointId,
      source: this.step.source,
    };
  }

  private emitStep(): void {
    this.handlers().onStepChange(this.stepState());
  }

  private goToStop(index: number, options: StepOptions = {}): Promise<void> {
    const stop = this.trip ? keyStops(this.trip)[index] : undefined;
    if (!stop) return Promise.resolve();
    return this.focusStop(stop.id, { source: options.source ?? "engine", direction: options.direction }, true);
  }

  private async stepBy(delta: 1 | -1, options: StepOptions = {}): Promise<boolean> {
    if (!this.trip) return false;
    const keys = keyStops(this.trip);
    const order = (id: string) => this.trip!.waypoints.findIndex((w) => w.id === id);
    const at = this.step.waypointId ? order(this.step.waypointId) : -1;
    const target = delta === 1 ? keys.find((k) => order(k.id) > at) : [...keys].reverse().find((k) => order(k.id) < at);
    if (!target) return false;
    await this.goToStop(keys.indexOf(target), { direction: delta, ...options });
    return true;
  }

  /**
   * Focus one stop: highlight it, remember where the camera was if this starts stepping, and move a
   * camera that can actually see it. `fromRoute`: the "before" view is the whole route (deep links).
   */
  private async focusStop(
    waypointId: string,
    { source, direction }: { source: StepSource; direction?: 1 | -1 },
    animate: boolean,
    { fromRoute = false } = {},
  ): Promise<void> {
    const trip = this.trip;
    if (!trip || !trip.waypoints.some((w) => w.id === waypointId)) return;
    if (!this.step.waypointId && !this.beforeStepping) {
      this.beforeStepping = fromRoute ? this.snapshotOf(tripCamera(trip, this.frameFor("trip"))) : this.snapshot();
    }
    this.step = { waypointId, source };
    this.setFocusHighlight(waypointId, source);
    this.emitStep();
    const generation = ++this.moveGeneration;
    const frame = this.frameFor("stop");
    const geometric = stopCamera(trip, waypointId, frame);
    if (!geometric) return;
    const target =
      (await this.visibleStop(trip, waypointId, frame, CAMERA.visibilityWaitMs, { direction })) ?? this.flatten(geometric);
    if (generation !== this.moveGeneration) return;
    if (!animate) {
      this.map.jumpTo(target);
      return;
    }
    const from = this.map.getCenter();
    const far = distanceKm([from.lng, from.lat], target.center) > CAMERA.stepFlyKm;
    await this.animate(target, readDurationMs("--duration-map-step"), far ? "fly" : "ease");
  }

  /** Leave stepping: back to exactly where the camera was before it began. */
  private async back(animate = !prefersReducedMotion()): Promise<void> {
    const before = this.beforeStepping;
    this.beforeStepping = null;
    this.step = { waypointId: null, source: null };
    this.setFocusHighlight(null, null);
    this.emitStep();
    const generation = ++this.moveGeneration;
    const frame = this.frameFor("trip");
    const target = before
      ? { ...before, padding: frame.padding }
      : this.trip
        ? ((await this.visibleRoute(this.trip, frame, CAMERA.visibilityWaitMs)) ?? this.flatten(tripCamera(this.trip, frame)))
        : null;
    if (!target || generation !== this.moveGeneration) return;
    if (!animate) this.map.jumpTo(target);
    else await this.animate(target, readDurationMs("--duration-map-step"), "ease");
  }

  private snapshot(): CameraSnapshot {
    const c = this.map.getCenter();
    return { center: [c.lng, c.lat], zoom: this.map.getZoom(), bearing: this.map.getBearing(), pitch: this.map.getPitch() };
  }

  private snapshotOf(target: CameraTarget): CameraSnapshot {
    return { center: target.center, zoom: target.zoom, bearing: target.bearing, pitch: target.pitch };
  }

  /* ============================================================== day view */

  private openJourney(day: number, { animate = true }: DayStepOptions = {}): Promise<void> {
    const trip = this.trip;
    if (!trip || !this.loaded) return Promise.resolve();
    if (this.journey) return this.goToDay(day, { animate });

    this.orbitControl.stop();
    this.reveal.hide();
    // The stage may just have grown to the full screen (CSS): measure before framing.
    this.map.resize();

    const days = tripDays(trip);
    const bearings: number[] = [];
    days.forEach((d, i) => bearings.push(dayBearing(this.framing(d), i > 0 ? bearings[i - 1] : null)));
    const line = handDrawn(tripLine(trip), trip.slug);
    const vertex = alongLine(line, trip.waypoints.map((w) => w.coords));
    const vertexOf = new Map(trip.waypoints.map((w, i) => [w.id, vertex[i]]));

    this.journey = {
      trip,
      days,
      day: 1,
      bearings,
      line,
      anchorVertex: days.map((d) => vertexOf.get(d.anchor.id) ?? 0),
      before: { ...this.snapshot(), padding: this.map.getPadding() },
      stepBefore: { ...this.step },
      focusId: null,
      target: null,
      todayLine: [],
    };
    this.container.dataset.journey = "";
    this.gestures.setMode("journey");
    this.ensureJourneyLayers();
    this.setMapMood("day");
    return this.goToDay(day, { animate, entering: true });
  }

  private framing(day: TripDay): DayFraming {
    return { segment: day.segment, points: [...day.segment, ...day.waypoints.map((w) => w.coords)], anchor: day.anchor.coords };
  }

  private dayFrame(): Frame {
    return { width: this.container.clientWidth, height: this.container.clientHeight, padding: dayInsets(this.container) };
  }

  private async goToDay(n: number, options: DayStepOptions & { entering?: boolean } = {}): Promise<void> {
    const j = this.journey;
    if (!j) return;
    const total = j.days.length;
    const dayNumber = Math.min(total + 1, Math.max(1, Math.round(n)));
    const animate = (options.animate ?? true) && !prefersReducedMotion();
    j.day = dayNumber;
    j.focusId = null;
    const generation = ++this.moveGeneration;
    const frame = this.dayFrame();

    let target: CameraTarget;
    if (dayNumber > total) {
      // "The whole way": the full route, framed in the day layout's clear area.
      this.setJourneyHighlight(null, null);
      this.setDayRoute(null, animate);
      target = this.flatten(tripCamera(j.trip, frame));
    } else {
      const day = j.days[dayNumber - 1];
      this.setJourneyHighlight(day, null);
      this.setDayRoute(dayNumber, animate);
      target = await this.visibleDay(j, day, frame);
    }
    if (generation !== this.moveGeneration || this.journey !== j) return;
    j.target = target;
    this.gestures.resetAdjusted();

    if (!animate) {
      this.map.jumpTo(target);
      return;
    }
    const c = this.map.getCenter();
    const km = distanceKm([c.lng, c.lat], target.center);
    const turn = Math.abs(wrapDegrees(target.bearing - this.map.getBearing()));
    if (options.entering) await this.animate(target, CAMERA.day.enterMs, "fly");
    else await this.animate(target, dayMoveMs(km, turn), km > CAMERA.stepFlyKm ? "fly" : "ease");
  }

  /**
   * The day's camera, kept straight: bearings within ±20° of the direction of travel, lower pitches
   * preferred over turning; accepted when the anchor and most of the walk are in sight.
   */
  private async visibleDay(j: Journey, day: TripDay, frame: Frame): Promise<CameraTarget> {
    const base = j.bearings[day.n - 1];
    const framing = this.framing(day);
    const pitch0 = dayPitch(frame);
    const geometric = this.flatten({ ...fitDay(framing, frame, base, pitch0), bearing: base, pitch: pitch0, padding: frame.padding });
    if (!this.terrainOn) return geometric;

    const v = CAMERA.day.visibility;
    const key = `day:${j.trip.slug}:${day.n}:${frame.width}x${frame.height}`;
    const refit = (bearing: number, pitch: number): CameraTarget => ({ ...fitDay(framing, frame, bearing, pitch), bearing, pitch, padding: frame.padding });
    const cached = this.viewCache.get(key);
    if (cached) return refit(cached.bearing, cached.pitch);
    if (!(await this.dem.load(grow(framing.points, 4), CAMERA.visibilityWaitMs))) return geometric;

    // Samples along the walk (the anchor is checked separately and must be clear).
    const samples: LngLat[] = [];
    const seg = day.segment;
    for (let i = 1; i <= v.samples; i++) samples.push(seg[Math.min(seg.length - 1, Math.round((i / (v.samples + 1)) * (seg.length - 1)))]);
    const ex = TERRAIN_EXAGGERATION;
    const altOf = (p: LngLat) => (this.dem.elevation(p) ?? 0) * ex;
    const fov = this.map.getVerticalFieldOfView();
    let best: { bearing: number; pitch: number; score: number } | null = null;
    let decided = true;

    for (const offset of v.bearingOffsets) {
      for (const pitch of v.pitches) {
        const bearing = wrapDegrees(base + offset);
        const { center, zoom } = fitDay(framing, frame, bearing, pitch);
        const eye = eyeFor({ center, zoom, bearing, pitch }, frame.height, fov, altOf(center));
        const anchor = lineOfSight(this.dem, ex, eye, day.anchor.coords, altOf(day.anchor.coords));
        if (anchor === "unknown") decided = false;
        let clear = 0;
        for (const p of samples) {
          const r = lineOfSight(this.dem, ex, eye, p, altOf(p));
          if (r !== "hidden") clear++;
          if (r === "unknown") decided = false;
        }
        const share = samples.length ? clear / samples.length : 1;
        if (anchor !== "hidden" && share >= v.minShare) {
          if (decided) this.viewCache.set(key, { bearing, pitch });
          return refit(bearing, pitch);
        }
        const score = (anchor === "hidden" ? 0 : 1) + share;
        if (!best || score > best.score) best = { bearing, pitch, score };
      }
    }
    const chosen = best ?? { bearing: base, pitch: pitch0 };
    if (decided) this.viewCache.set(key, { bearing: chosen.bearing, pitch: chosen.pitch });
    return refit(chosen.bearing, chosen.pitch);
  }

  /** A stop of the current day chosen in the day view: go there, still straight; null = the day again. */
  private async focusDayStop(waypointId: string | null, animate = true): Promise<void> {
    const j = this.journey;
    if (!j || j.day > j.days.length) return;
    const day = j.days[j.day - 1];
    const stop = waypointId ? day.waypoints.find((w) => w.id === waypointId) : undefined;
    if (!stop) {
      if (j.focusId) await this.goToDay(j.day, { animate });
      return;
    }
    j.focusId = stop.id;
    this.setJourneyHighlight(day, stop.id);
    const generation = ++this.moveGeneration;
    const frame = this.dayFrame();
    const base = j.target ?? (await this.visibleDay(j, day, frame));
    if (this.journey !== j || j.focusId !== stop.id) return;
    const target: CameraTarget = {
      center: stop.coords,
      zoom: Math.min(CAMERA.day.maxZoom, base.zoom + CAMERA.day.midpointZoomIn),
      bearing: j.bearings[day.n - 1],
      pitch: base.pitch,
      padding: frame.padding,
    };
    if (generation !== this.moveGeneration) return;
    if (!animate || prefersReducedMotion()) this.map.jumpTo(target);
    else await this.animate(target, readDurationMs("--duration-map-step"), "ease");
  }

  private onJourneyStopTap(waypointId: string): void {
    const j = this.journey;
    if (!j || j.day > j.days.length) return;
    const day = j.days[j.day - 1];
    if (!day.waypoints.some((w) => w.id === waypointId)) return; // other days' stops: not in this step
    this.journeyListener?.stop?.(waypointId);
  }

  private async closeJourney({ animate = true }: { animate?: boolean } = {}): Promise<void> {
    const j = this.journey;
    if (!j) return;
    this.dropJourney();
    const target = { ...j.before };
    const generation = ++this.moveGeneration;
    if (!animate || prefersReducedMotion()) this.map.jumpTo(target);
    else await this.animate(target as CameraTarget, readDurationMs("--duration-map-step"), "ease");
    if (generation === this.moveGeneration) this.journeyClosedAt = performance.now();
  }

  /** Leave the day-view state (map look, overlay, highlight, gestures) without moving the camera. */
  private dropJourney(): void {
    const j = this.journey;
    if (!j) return;
    this.journey = null;
    this.journeyClosedAt = performance.now();
    this.cancelDayDraw?.();
    this.cancelDayDraw = null;
    this.orbitControl.stop();
    delete this.container.dataset.journey;
    this.setMapMood("normal");
    this.setDayRoute(null, false, true);
    this.gestures.setMode(stateOf(this.view) === "overview" ? "overview" : "explore");
    this.gestures.resetAdjusted();
    for (const s of this.stops?.items ?? []) s.dom.inner.classList.remove("is-journey-day");
    this.step = { ...j.stepBefore };
    this.setFocusHighlight(this.step.waypointId, this.step.source);
    this.emitStep();
  }

  /** The day's anchor carries the lens (or the tapped stop does); the day's stops stay bright. */
  private setJourneyHighlight(day: TripDay | null, focusId: string | null): void {
    const focus = focusId ?? day?.anchor.id ?? null;
    this.setFocusHighlight(focus, focus ? "url" : null);
    const ids = new Set([...(day?.waypoints ?? []).map((w) => w.id), ...(day ? [day.anchor.id] : [])]);
    for (const s of this.stops?.items ?? []) {
      s.dom.inner.classList.toggle("is-journey-day", ids.has(s.waypoint.id));
      s.dom.button.removeAttribute("aria-pressed");
    }
    this.later(() => this.updateLabels(), 0);
  }

  /* --------------------------------------------------- day route overlay */

  private ensureJourneyLayers(): void {
    const map = this.map;
    if (map.getSource(JOURNEY_SRC)) return;
    const colors = mapRouteColors();
    map.addSource(JOURNEY_SRC, { type: "geojson", data: { type: "FeatureCollection", features: [] }, lineMetrics: true });
    const round = { "line-cap": "round", "line-join": "round" } as const;
    map.addLayer({
      id: JOURNEY_LAYER.corridor,
      type: "line",
      source: JOURNEY_SRC,
      filter: ["==", ["get", "part"], "today"],
      layout: round,
      paint: {
        "line-color": readToken("--color-map-light"),
        "line-width": DAY_ROUTE.corridorWidth,
        "line-blur": DAY_ROUTE.corridorWidth * 0.8,
        "line-opacity": DAY_ROUTE.corridorOpacity,
      },
    });
    map.addLayer({
      id: JOURNEY_LAYER.done,
      type: "line",
      source: JOURNEY_SRC,
      filter: ["==", ["get", "part"], "done"],
      layout: round,
      paint: { "line-color": colors.line, "line-width": DAY_ROUTE.doneWidth, "line-opacity": DAY_ROUTE.doneOpacity },
    });
    map.addLayer({
      id: JOURNEY_LAYER.casing,
      type: "line",
      source: JOURNEY_SRC,
      filter: ["==", ["get", "part"], "today"],
      layout: round,
      paint: { "line-gradient": drawnGradient(colors.casing, 1), "line-width": DAY_ROUTE.todayCasingWidth, "line-opacity": DAY_ROUTE.todayCasingOpacity, "line-blur": 1 },
    });
    map.addLayer({
      id: JOURNEY_LAYER.today,
      type: "line",
      source: JOURNEY_SRC,
      filter: ["==", ["get", "part"], "today"],
      layout: round,
      paint: { "line-gradient": drawnGradient(colors.line, 1), "line-width": DAY_ROUTE.todayWidth },
    });
  }

  /** Overlay for day `n`: the days walked so far, pale, and today's stretch drawn in. null = none. */
  private setDayRoute(n: number | null, animate: boolean, clear = false): void {
    this.cancelDayDraw?.();
    this.cancelDayDraw = null;
    const source = this.map.getSource(JOURNEY_SRC);
    if (!source || source.type !== "geojson") return;
    const set = (features: unknown[]) => (source as unknown as { setData: (d: unknown) => void }).setData({ type: "FeatureCollection", features });
    const j = this.journey;
    if (clear || !j) {
      set([]);
      return;
    }
    const line = j.line;
    const feature = (part: "done" | "today", coordinates: LngLat[]) =>
      coordinates.length > 1 ? [{ type: "Feature", properties: { part }, geometry: { type: "LineString", coordinates } }] : [];
    if (n === null) {
      // The whole way: the full route, walked.
      j.todayLine = line;
      set(feature("today", line));
      this.drawToday(1, false);
      return;
    }
    const day = j.days[n - 1];
    const startVertex = n > 1 ? (j.anchorVertex[n - 2] ?? 0) : 0;
    const endVertex = day.rest ? startVertex : (j.anchorVertex[n - 1] ?? startVertex);
    const today = line.slice(Math.min(startVertex, endVertex), Math.max(startVertex, endVertex) + 1);
    j.todayLine = today.length > 0 ? today : [day.anchor.coords];
    set([...feature("done", line.slice(0, startVertex + 1)), ...feature("today", today)]);
    this.drawToday(animate ? 0 : 1, animate);
  }

  /** Draw today's stretch from yesterday's end (a short rAF loop that stops). */
  private drawToday(from: number, animate: boolean): void {
    const colors = mapRouteColors();
    const paint = (p: number) => {
      if (!this.map.getLayer(JOURNEY_LAYER.today)) return;
      this.map.setPaintProperty(JOURNEY_LAYER.today, "line-gradient", drawnGradient(colors.line, p));
      this.map.setPaintProperty(JOURNEY_LAYER.casing, "line-gradient", drawnGradient(colors.casing, p));
    };
    if (!animate) {
      paint(1);
      return;
    }
    paint(from);
    const ease = parseEasing(readToken("--ease-sheet"));
    const start = performance.now() + DAY_ROUTE.drawDelayMs;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / DAY_ROUTE.drawMs));
      paint(Math.max(from, ease(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
      else this.cancelDayDraw = null;
    };
    frame = requestAnimationFrame(tick);
    this.cancelDayDraw = () => {
      cancelAnimationFrame(frame);
      paint(1);
    };
  }

  /** See JourneyApi.journeyFootprint. */
  private journeyFootprint(): JourneyFootprint | null {
    const j = this.journey;
    if (!j) return null;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const add = (x: number, y: number) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    };
    // The line, sampled (projected points behind a steep horizon are clamped to the screen).
    const line = j.todayLine;
    const step = Math.max(1, Math.floor(line.length / 80));
    for (let i = 0; i < line.length; i += step) {
      const p = this.map.project(line[i]);
      add(p.x, p.y);
    }
    if (line.length) {
      const p = this.map.project(line[line.length - 1]);
      add(p.x, p.y);
    }
    // The day's markers and their visible labels (the whole way: every stop).
    const box = this.container.getBoundingClientRect();
    const whole = j.day > j.days.length;
    for (const s of this.stops?.items ?? []) {
      if (!whole && !s.dom.inner.classList.contains("is-journey-day")) continue;
      const els: Element[] = [s.dom.button];
      const label = s.dom.inner.querySelector(".nbt-stop__label");
      if (label && !label.classList.contains("is-hidden")) els.push(label);
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        add(r.left - box.left, r.top - box.top);
        add(r.right - box.left, r.bottom - box.top);
      }
    }
    if (!Number.isFinite(x0)) return null;
    x0 = Math.max(0, x0);
    y0 = Math.max(0, y0);
    x1 = Math.min(w, x1);
    y1 = Math.min(h, y1);
    if (x1 <= x0 || y1 <= y0) return null;
    let anchor: JourneyFootprint["anchor"] = null;
    if (!whole) {
      const a = this.map.project(j.days[j.day - 1].anchor.coords);
      anchor = { x: a.x, y: a.y };
    }
    return { rect: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, anchor };
  }

  /* ------------------------------------------------------------ day mood */

  /**
   * The day view's quiet map: relief and hillshade softened, graticule and other trips gone, the
   * trip's whole route faint under the day overlay. Paint overrides with transitions; the values
   * they replace are kept and restored ("normal"), so look.ts stays the single source of the look.
   */
  private setMapMood(mood: "day" | "normal", durationMs = DAY_MOOD.ms): void {
    if (!this.loaded) return;
    const map = this.map;
    const ms = prefersReducedMotion() ? 0 : durationMs;
    type PaintName = Parameters<MapLibreMap["setPaintProperty"]>[1];
    const set = (layer: string, property: string, value: unknown) => {
      if (!map.getLayer(layer)) return;
      map.setPaintProperty(layer, `${property}-transition` as PaintName, { duration: ms, delay: 0 });
      map.setPaintProperty(layer, property as PaintName, value as never);
    };
    if (mood === "normal") {
      for (const [layer, property, value] of this.moodSaved ?? []) set(layer, property, value);
      this.moodSaved = null;
      return;
    }
    if (this.moodSaved) return;
    const keep = 1 - DAY_MOOD.terrainDim();
    const overrides: [string, string, unknown][] = [
      [LAYER.relief, "color-relief-opacity", keep],
      [
        LAYER.hillshade,
        "hillshade-exaggeration",
        ["interpolate", ["linear"], ["zoom"], ...HILLSHADE.exaggeration.flatMap(([z, v]) => [z, v * keep])],
      ],
      [LAYER.graticuleMinor, "line-opacity", 0],
      [LAYER.graticuleMajor, "line-opacity", 0],
      [LAYER.routesFaint, "line-opacity", 0],
      [LAYER.route, "line-opacity", DAY_MOOD.routeOpacity],
      [LAYER.routeCasing, "line-opacity", DAY_MOOD.routeOpacity * 0.5],
    ];
    this.moodSaved = overrides
      .filter(([layer]) => map.getLayer(layer))
      .map(([layer, property]) => [layer, property, map.getPaintProperty(layer, property as PaintName) ?? defaultPaint(property)]);
    for (const [layer, property, value] of overrides) set(layer, property, value);
  }

  /* ------------------------------------------------------- seen from here */

  private async visiblePeaks(from: LngLat, peaks: Landmark[]): Promise<Set<string> | null> {
    if (peaks.length === 0) return new Set();
    const ok = await this.dem.load(grow([from, ...peaks.map((p) => p.coords)], 2), 8000);
    if (!ok) return null;
    const ground0 = this.dem.elevation(from);
    if (ground0 === null) return null;
    const eyeAlt = ground0 + PEAK_SIGHT.eyeM;
    const effectiveR = EARTH_RADIUS_M / (1 - PEAK_SIGHT.refraction);
    const seen = new Set<string>();
    for (const peak of peaks) {
      const top = peak.elevationM ?? this.dem.elevation(peak.coords) ?? 0;
      const total = distanceKm(from, peak.coords) * 1000;
      let clear = true;
      for (let i = 1; i < PEAK_SIGHT.samples; i++) {
        const t = i / PEAK_SIGHT.samples;
        if (t < PEAK_SIGHT.skipStart || t > 1 - PEAK_SIGHT.skipEnd) continue;
        const point: LngLat = [from[0] + (peak.coords[0] - from[0]) * t, from[1] + (peak.coords[1] - from[1]) * t];
        const ground = this.dem.elevation(point);
        if (ground === null) continue;
        const d = total * t;
        const bulge = (d * (total - d)) / (2 * effectiveR);
        if (ground + bulge > eyeAlt + (top - eyeAlt) * t + PEAK_SIGHT.marginM) {
          clear = false;
          break;
        }
      }
      if (clear) seen.add(peak.id);
    }
    return seen;
  }

  /* ================================================================ orbit */

  /** What the orbit turns around: today's tapped stop or anchor, the focused stop, the place. */
  private orbitFocus(): LngLat | null {
    const j = this.journey;
    if (j) {
      if (j.day > j.days.length) return null;
      const day = j.days[j.day - 1];
      return (j.focusId ? day.waypoints.find((w) => w.id === j.focusId)?.coords : undefined) ?? day.anchor.coords;
    }
    if (this.trip && this.step.waypointId) return this.trip.waypoints.find((w) => w.id === this.step.waypointId)?.coords ?? null;
    if (this.view.placeId) return this.placesById.get(this.view.placeId)?.coords ?? null;
    return null;
  }

  /* ============================================================ view tools */

  /**
   * Back to the state's own bearing and pitch (the view the app chose, visibility included),
   * keeping where the user is looking and how close. In the day view: the straightened day camera.
   */
  private async resetView(): Promise<void> {
    this.orbitControl.stop();
    this.gestures.resetAdjusted();
    if (this.journey) {
      if (this.journey.focusId) await this.focusDayStop(this.journey.focusId);
      else await this.goToDay(this.journey.day);
      return;
    }
    const state = stateOf(this.view);
    const frame = this.frameFor(state);
    const generation = ++this.moveGeneration;
    const own = (await this.visibleTarget(this.view, frame, CAMERA.visibilityWaitMs)) ?? this.targetFor(this.view, frame);
    if (generation !== this.moveGeneration) return;
    void this.animate({ ...own, center: this.snapshot().center, zoom: this.map.getZoom() }, readDurationMs("--duration-map"), "ease");
  }

  private setOutsideVeil(opacity: number, durationMs = 400): void {
    this.map.setPaintProperty(LAYER.outside, "fill-opacity-transition", { duration: durationMs, delay: 0 });
    this.map.setPaintProperty(LAYER.outside, "fill-opacity", opacity ?? OUTSIDE.opacity);
  }

  private nepalOutlinePath(): string | null {
    if (this.nepalRings.length === 0) return null;
    return this.nepalRings
      .map((ring) => {
        const pts = ring.map((c) => this.map.project(c));
        return `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L")}Z`;
      })
      .join("");
  }

  private setTerrain(on: boolean): void {
    this.terrainOn = on;
    this.map.setTerrain(on ? { source: SRC.demTerrain, exaggeration: TERRAIN_EXAGGERATION } : null);
  }

  /* ================================================================== pins */

  private createPins(): void {
    for (const trip of this.content.trips) {
      const { label, count } = this.content.birds(trip);
      const dom = createTripPin(trip, label, count);
      dom.button.addEventListener("click", () => this.handlers().onSelectTrip(trip.slug));
      // Hover media reveal (reveal.ts), on the overview, never while the camera moves the pin.
      this.reveal.bind(dom.root, dom.button, () =>
        stateOf(this.view) === "overview" && !this.map.isMoving() ? this.content.revealTrip(trip) : null,
      );
      const marker = new Marker({ element: dom.root, anchor: "bottom", opacityWhenCovered: "1", subpixelPositioning: true })
        .setLngLat(tripAnchor(trip))
        .addTo(this.map);
      this.pins.set(trip.slug, { marker, dom });
    }
  }

  /* ================================================================= stops */

  private createStops(trip: Trip, popDelayMs: number | null): void {
    const stagger = readDurationMs("--duration-stagger");
    const keys = new Set(keyStops(trip).map((w) => w.id));
    const items = trip.waypoints.map((waypoint, index): StopMarker => {
      const key = keys.has(waypoint.id);
      const dom = createStopMarker(waypoint, index, this.content.stopLabel(trip, index), key);
      if (popDelayMs !== null) {
        dom.inner.classList.add("is-popping");
        dom.inner.style.setProperty("--pop-delay", `${Math.round(popDelayMs + index * stagger)}ms`);
      }
      dom.button.addEventListener("click", () => {
        if (this.journey) {
          this.onJourneyStopTap(waypoint.id);
          return;
        }
        const active = this.view.waypointId === waypoint.id;
        this.handlers().onSelectWaypoint(active ? null : waypoint.id);
      });
      // Reveal on the trip overview (not over a focused stop, where the story already shows it).
      this.reveal.bind(dom.root, dom.button, () =>
        stateOf(this.view) === "trip" && !this.journey && !this.map.isMoving() ? this.content.revealStop(trip, waypoint, key) : null,
      );
      // Covered stops stay fully visible (styled as "behind the ridge" in map.css), never silently hidden.
      const marker = new Marker({ element: dom.root, anchor: "center", opacityWhenCovered: "1", subpixelPositioning: true })
        .setLngLat(waypoint.coords)
        .addTo(this.map);
      return { marker, dom, waypoint, key };
    });
    this.stops = { slug: trip.slug, items };
  }

  private clearStops(animate: boolean): void {
    if (!this.stops) return;
    const leaving = this.stops.items;
    this.stops = null;
    this.lens = null;
    this.tourTag = null;
    if (!animate) {
      for (const s of leaving) s.marker.remove();
      return;
    }
    for (const s of leaving) s.dom.inner.classList.add("is-leaving");
    this.later(() => leaving.forEach((s) => s.marker.remove()), 320);
  }

  /**
   * Highlight the focused stop: a lens for a deliberate choice (URL), a pulse + `DAY n` tag for the
   * engine (goToStop / next / prev). Other stops dim while one is in focus.
   */
  private setFocusHighlight(id: string | null, source: StepSource | null): void {
    this.container.classList.toggle("has-active-stop", Boolean(id && this.stops));
    this.lens?.remove();
    this.lens = null;
    this.tourTag?.remove();
    this.tourTag = null;
    if (!this.stops) return;
    for (const s of this.stops.items) {
      const focused = s.waypoint.id === id;
      s.dom.inner.classList.toggle("is-active", focused);
      s.dom.inner.classList.toggle("is-touring", focused && source !== "url");
      s.dom.button.setAttribute("aria-pressed", String(focused && source === "url"));
      s.marker.getElement().style.zIndex = focused ? "4" : s.key ? "2" : "1";
      if (!focused) continue;
      if (source === "url") {
        this.lens = createLens();
        s.dom.inner.prepend(this.lens);
      } else {
        this.tourTag = createTourTag(s.waypoint, this.content.dayLabel(s.waypoint.day));
        s.dom.inner.appendChild(this.tourTag);
      }
    }
  }

  /* ================================================================ places */

  private createPlaceLabels(): void {
    for (const place of this.content.landmarks) {
      const dom = createPlaceLabel(place);
      dom.button.addEventListener("click", () => this.handlers().onSelectPlace(place.id));
      const anchor = placeAnchor(place);
      const marker = new Marker({
        element: dom.root,
        anchor,
        offset: anchor === "left" ? [-4, 0] : [0, 0],
        opacityWhenCovered: "1",
        subpixelPositioning: true,
      })
        .setLngLat(place.coords)
        .addTo(this.map);
      dom.inner.classList.add("is-hidden");
      this.places.set(place.id, { marker, dom });
    }
  }

  /** The range a place lights up: a peak's own range, or the range itself. */
  private litRange(place: Landmark | undefined): string | null {
    if (!place) return null;
    if (place.kind === "peak") return place.range ?? null;
    if (place.kind === "range") return place.name;
    return null;
  }

  private updatePlaceStates(view: MapView, trip: Trip | undefined): void {
    const active = view.placeId ? this.placesById.get(view.placeId) : undefined;
    const range = this.litRange(active);
    const inTrip = new Set(trip?.landmarkIds ?? []);
    const litPeaks: Landmark[] = [];

    for (const [id, { marker, dom }] of this.places) {
      const place = this.placesById.get(id)!;
      const lit = range !== null && ((place.kind === "peak" && place.range === range) || (place.kind === "range" && place.name === range));
      if (lit && place.kind === "peak") litPeaks.push(place);
      dom.inner.classList.toggle("is-active", id === view.placeId);
      dom.inner.classList.toggle("is-lit", lit);
      dom.inner.classList.toggle("is-in-trip", inTrip.has(id));
      marker.getElement().style.zIndex = id === view.placeId ? "3" : "1";
    }

    // The soft glow along the lit range (a blurred line through its peaks, or a glow on a lone peak).
    const glowPoints = litPeaks.length ? litPeaks : active?.kind === "range" ? [active] : [];
    const sorted = [...glowPoints].sort((a, b) => a.coords[0] - b.coords[0]);
    this.geojson(SRC.rangeGlow).setData({
      type: "FeatureCollection",
      features: [
        ...(sorted.length > 1
          ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: sorted.map((p) => p.coords) } }]
          : []),
        ...sorted.map((p) => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: p.coords } })),
      ],
    });
    const on = sorted.length > 0 ? RANGE_GLOW.opacity : 0;
    this.map.setPaintProperty(LAYER.rangeGlow, "line-opacity", on);
    this.map.setPaintProperty(LAYER.rangeGlowPeaks, "circle-opacity", on * 0.8);
  }

  /* ================================================================ labels */

  /** Decide which labels show for the settled camera (collision pass). */
  private updateLabels(): void {
    if (!this.loaded) return;
    const zoom = this.map.getZoom();
    const state = stateOf(this.view);
    const candidates: LabelCandidate[] = [];

    for (const [id, { dom }] of this.places) {
      const place = this.placesById.get(id)!;
      const active = id === this.view.placeId;
      const inTrip = dom.inner.classList.contains("is-in-trip") && state !== "overview";
      const lit = dom.inner.classList.contains("is-lit");
      let eligible = place.labelTier === 1 || zoom >= TIER2_FROM_ZOOM;
      if (place.kind === "range") eligible = zoom >= RANGE_ZOOMS[0] && zoom <= RANGE_ZOOMS[1];
      if (place.kind === "poi") eligible = zoom >= POI_FROM_ZOOM;
      candidates.push({
        el: dom.inner,
        eligible: eligible || active || inTrip || lit,
        forced: active,
        priority: labelPriority(place, inTrip || lit),
      });
    }
    for (const s of this.stops?.items ?? []) {
      const label = s.dom.inner.querySelector<HTMLElement>(".nbt-stop__label");
      if (!label) continue;
      const focused = s.waypoint.id === this.step.waypointId || s.dom.inner.classList.contains("is-journey-day");
      candidates.push({
        el: label,
        eligible: focused || zoom >= (s.key ? STOP_LABEL_ZOOM.key : STOP_LABEL_ZOOM.minor),
        forced: focused,
        priority: focused ? 90 : s.key ? 40 : 12,
      });
    }

    // Labels keep clear of the pins (overview) or the stop blobs (trip).
    const obstacles =
      state === "overview"
        ? [...this.pins.values()].flatMap((p) => [...p.dom.inner.querySelectorAll(".nbt-pin__photo, .nbt-pin__label")])
        : (this.stops?.items ?? []).flatMap((s) => s.dom.inner.querySelector(".nbt-stop__blob") ?? []);
    placeLabels(candidates, obstacles, this.container.getBoundingClientRect());
  }

  /* ================================================================= utils */

  private later(fn: () => void, ms: number): void {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
  }
}

/** MapLibre's defaults for the paint properties the day mood overrides (when the style leaves them unset). */
function defaultPaint(property: string): unknown {
  return property === "hillshade-exaggeration" ? 0.5 : 1;
}

/** Mountains first, then cities, parks, ranges, the rest. */
function labelPriority(place: Landmark, boosted: boolean): number {
  const height = (place.elevationM ?? 0) / 10000; // taller peaks win ties
  const base = { peak: 50, city: 44, park: 30, range: 26, poi: 10 }[place.kind];
  return base + (place.labelTier === 1 ? 20 : 0) + (boosted ? 25 : 0) + height;
}
