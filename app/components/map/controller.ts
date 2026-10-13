/**
 * MapController: the imperative side of the map. Owns the MapLibre instance, the DOM markers and
 * the camera, and turns a declarative `MapView` (what the URL says) into the map states:
 *
 *   S0 overview  /                     trip pins, few labels, faint routes; home gestures
 *   S1 trip      /trips/:slug          route draws in, stops pop in, autoplay may start
 *   S2 stop      /trips/:slug?stop=id  focus on the stop (lens), camera chosen so it is visible
 *   S3 place     /places/:id           place framed (peaks: an unobstructed face), range lit
 *
 * It also hosts the STEPPING ENGINE (see `StepperApi` below and docs/MAP.md): focus a trip's stops
 * one by one with a visibility-aware camera, remember where the camera was before stepping began,
 * and an autoplay timer. The URL (?stop=) uses it; a scroll-driven trip journey can drive it directly.
 *
 * The first view after load is applied without animation (direct landings arrive "already there");
 * later changes animate, unless the visitor prefers reduced motion (then everything jumps).
 * Rendering is on demand: nothing animates while the map is idle.
 */
import { AttributionControl, Map as MapLibreMap, Marker, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { Landmark, LngLat, Trip, Waypoint } from "~/content/types";
import { readDurationMs, readToken } from "~/design/tokens";
import { parseEasing } from "~/lib/easing";
import { boundsOf, distanceKm, graticule, handDrawn, maskOutside, outerRings, type Bounds, type LineFeature } from "~/lib/geo";
import { mapInsets, type MapLayoutMode } from "~/lib/mapLayout";
import { keyStops } from "~/lib/tripStops";
import {
  CAMERA,
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
  type Frame,
} from "./camera";
import { DemSampler } from "./dem";
import { Gestures, type HintTexts } from "./gestures";
import { placeLabels, type LabelCandidate } from "./labels";
import { buildStyle, DEM, GRATICULE, LAYER, NEPAL_GEOJSON_URL, OUTSIDE, RANGE_GLOW, SRC, TERRAIN_EXAGGERATION } from "./look";
import { createLens, createPlaceLabel, createStopMarker, createTourTag, createTripPin, placeAnchor, type MarkerDom } from "./markers";
import { canAfford3D, initialPixelRatio, watchFrames } from "./perf";
import { drawRoute, setRouteProgress, type RouteColors } from "./routeDraw";
import { MediaReveal, type RevealContent } from "./reveal";
import { Autoplay, type AutoplayStatus } from "./tour";
import { chooseView } from "./visibility";

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
/** Autoplay starts this long after a direct landing (no flight to wait for). */
const AUTOPLAY_AFTER_LANDING_MS = 2600;

/* ---------------------------------------------------------------- types */

export type MapView = {
  tripSlug: string | null;
  waypointId: string | null;
  placeId: string | null;
  previewSlug: string | null;
};

/** How a stop came into focus. */
export type StepSource = "url" | "engine" | "autoplay";

/** What the stepping engine is doing; sent to React on every change. */
export type StepState = {
  tripSlug: string | null;
  /** The trip's key stops (what next / prev / autoplay step through), in order. */
  keyStopIds: string[];
  /** Index of the focused stop among the key stops; -1 = whole route, or a non-key stop. */
  index: number;
  /** The focused stop, or null for the whole route. */
  waypointId: string | null;
  source: StepSource | null;
  autoplay: AutoplayStatus;
};

export type StepOptions = {
  /** 1 = moving forward along the route (camera prefers the direction of travel), -1 = backwards. */
  direction?: 1 | -1;
  /** "autoplay" frames a little wider and glides slower. */
  source?: StepSource;
};

/**
 * The stepping engine, as exposed to React (via NepalMap's onReady) and to a future scroll-driven
 * journey. Camera-only: it never changes the URL. Indexes are into the trip's key stops.
 */
export type StepperApi = {
  /** Focus key stop `index` (camera + highlight). Resolves when the camera has arrived. */
  goToStop: (index: number, options?: StepOptions) => Promise<void>;
  /** Next / previous key stop; resolves false when there is none (nothing moves). */
  next: (options?: StepOptions) => Promise<boolean>;
  prev: (options?: StepOptions) => Promise<boolean>;
  /** Back to exactly where the camera was before stepping began (usually the whole route). */
  back: () => Promise<void>;
  /** Autoplay: step on a timer (dwell from tokens), pull back to the whole route at the end. */
  play: () => void;
  pause: () => void;
  state: () => StepState;
};

export type MapApi = StepperApi & {
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
  private autoplay: Autoplay | null = null;
  private autoplayStart = 0;
  private autoplayResumeOnShow = false;
  /** Chosen visible views, per stop / trip / place (bearing + pitch). */
  private viewCache = new Map<string, { bearing: number; pitch: number }>();
  /** Bumped on every camera move request, so a slow visibility check never moves a stale camera. */
  private moveGeneration = 0;
  private previewTimer = 0;

  /** Nepal's outline rings once /geo/nepal.geojson has loaded (see nepalOutlinePath). */
  private nepalRings: LngLat[][] = [];

  private cancelDraw: (() => void) | null = null;
  private timers = new Set<number>();
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
    this.colors = { line: readToken("--color-route"), casing: readToken("--color-night") };
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
    // Top right: the bottom of the map is under the content peek.
    this.map.addControl(new AttributionControl({ compact: true }), "top-right");

    this.gestures = new Gestures(this.map, container, content.hints, {
      onUserInput: () => this.onUserInput(),
      onAdjusted: (adjusted) => this.handlers().onViewAdjusted(adjusted),
    });
    this.gestures.setMode(stateOf(initial) === "overview" ? "overview" : "explore");

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
    this.map.on("moveend", () => this.updateLabels());
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
    const onVisibility = () => this.onPageVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    this.disposers.push(() => document.removeEventListener("visibilitychange", onVisibility));
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
      play: () => this.play(),
      pause: () => this.autoplay?.pause(),
      state: () => this.stepState(),
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
    this.autoplay?.stop();
    this.watchInterruptions(false);
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

    this.container.dataset.state = state;
    this.reveal.hide();
    this.gestures.setMode(state === "overview" ? "overview" : "explore");

    // Trip pins: only on the overview; the previewed one is raised.
    for (const [slug, { marker, dom }] of this.pins) {
      const preview = slug === next.previewSlug;
      dom.inner.classList.toggle("is-shown", state === "overview");
      dom.inner.classList.toggle("is-preview", preview);
      marker.getElement().style.zIndex = preview ? "3" : "2";
      dom.button.tabIndex = state === "overview" ? 0 : -1;
    }

    if (tripChanged) this.enterTrip(trip ?? null, animate, flightMs, !next.waypointId);
    this.updatePlaceStates(next, trip);

    // Camera.
    if (trip && !tripChanged && next.waypointId !== (prev?.waypointId ?? null)) {
      // Same trip, the URL's stop changed: a deliberate step (or closing the stop).
      this.autoplay?.pause();
      if (next.waypointId) void this.focusStop(next.waypointId, { source: "url" }, animate);
      else void this.back(animate);
    } else if (trip && next.waypointId && tripChanged) {
      // Landing on (or flying to) a trip with ?stop: straight to the stop, the route is "before".
      void this.focusStop(next.waypointId, { source: "url" }, animate, { fromRoute: true });
    } else if (!(trip && !tripChanged)) {
      // A new state (or the home preview changed). Same trip + same stop: the camera stays put.
      this.moveCamera(prev, prevState, next, animate);
    }
    if (!animate || !this.map.isMoving()) this.later(() => this.updateLabels(), 0);
  }

  /** Route, stops and stepping engine for a newly opened trip (or none). */
  private enterTrip(trip: Trip | null, animate: boolean, flightMs: number, mayAutoplay: boolean): void {
    this.cancelDraw?.();
    this.cancelDraw = null;
    this.autoplay?.stop();
    this.autoplay = null;
    window.clearTimeout(this.autoplayStart);
    this.watchInterruptions(false);
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

      this.autoplay = new Autoplay({
        step: () => this.stepBy(1, { source: "autoplay", direction: 1 }),
        finish: () => this.back(),
        dwellMs: () => readDurationMs("--duration-tour-dwell"),
        onStatus: (status) => {
          this.watchInterruptions(status === "playing");
          if (status === "ended") this.setFocusHighlight(null, null);
          this.emitStep();
        },
      });

      // Autoplay only on arrival (in-app or direct landing) without ?stop.
      if (mayAutoplay) {
        const pops = flightMs * POP_AT + trip.waypoints.length * readDurationMs("--duration-stagger") + readDurationMs("--duration-pop");
        const arrival = animate ? Math.max(flightMs, flightMs * DRAW_AT + drawMs, pops) + CAMERA.tour.startDelayMs : AUTOPLAY_AFTER_LANDING_MS;
        this.autoplayStart = window.setTimeout(() => this.autoplay?.play(), arrival);
      }
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
      autoplay: this.autoplay?.current ?? "off",
    };
  }

  private emitStep(): void {
    this.handlers().onStepChange(this.stepState());
  }

  private goToStop(index: number, options: StepOptions = {}): Promise<void> {
    const stop = this.trip ? keyStops(this.trip)[index] : undefined;
    if (!stop) return Promise.resolve();
    if (options.source !== "autoplay") this.autoplay?.pause();
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
    // Reduced motion: autoplay steps the highlight in place; the camera doesn't move.
    if (source === "autoplay" && prefersReducedMotion()) return;

    const generation = ++this.moveGeneration;
    const frame = this.frameFor("stop");
    const zoomOffset = source === "autoplay" ? -CAMERA.tour.zoomOut : 0;
    const geometric = stopCamera(trip, waypointId, frame);
    if (!geometric) return;
    const target =
      (await this.visibleStop(trip, waypointId, frame, CAMERA.visibilityWaitMs, { direction, zoomOffset })) ??
      this.flatten({ ...geometric, zoom: geometric.zoom + zoomOffset });
    if (generation !== this.moveGeneration) return;
    if (!animate) {
      this.map.jumpTo(target);
      return;
    }
    const from = this.map.getCenter();
    const far = distanceKm([from.lng, from.lat], target.center) > CAMERA.stepFlyKm;
    const duration = source === "autoplay" ? readDurationMs("--duration-tour-glide") : readDurationMs("--duration-map-step");
    await this.animate(target, duration, far && source !== "autoplay" ? "fly" : "ease");
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

  private play(): void {
    if (!this.autoplay || this.view.waypointId) return; // a deliberately opened stop stays put
    if (this.autoplay.current === "ended") {
      this.step = { waypointId: null, source: null };
      this.beforeStepping = null;
    }
    this.autoplay.play();
  }

  private snapshot(): CameraSnapshot {
    const c = this.map.getCenter();
    return { center: [c.lng, c.lat], zoom: this.map.getZoom(), bearing: this.map.getBearing(), pitch: this.map.getPitch() };
  }

  private snapshotOf(target: CameraTarget): CameraSnapshot {
    return { center: target.center, zoom: target.zoom, bearing: target.bearing, pitch: target.pitch };
  }

  /** The user did something with the map: stop automatic moves (autoplay, a pending start). */
  private onUserInput(): void {
    window.clearTimeout(this.autoplayStart);
    this.autoplay?.pause();
  }

  /**
   * While autoplay runs, any tap, key, wheel or page scroll pauses it (controls marked
   * data-map-control are exempt, so "pause" / "play" buttons work).
   */
  private interruptions: (() => void) | null = null;
  private watchInterruptions(on: boolean): void {
    this.interruptions?.();
    this.interruptions = null;
    if (!on) return;
    const stop = (event: Event) => {
      const target = event.target as Element | null;
      if (target?.closest?.("[data-map-control]")) return;
      this.autoplay?.pause();
    };
    const opts = { passive: true, capture: true } as const;
    const events = ["pointerdown", "keydown", "wheel"] as const;
    for (const e of events) document.addEventListener(e, stop, opts);
    window.addEventListener("scroll", stop, { passive: true });
    this.interruptions = () => {
      for (const e of events) document.removeEventListener(e, stop, opts);
      window.removeEventListener("scroll", stop);
    };
  }

  /** Hidden tab: pause autoplay, and pick it up again when the visitor comes back. */
  private onPageVisibility(): void {
    if (document.hidden) {
      if (this.autoplay?.current === "playing") {
        this.autoplayResumeOnShow = true;
        this.autoplay.pause();
      }
    } else if (this.autoplayResumeOnShow) {
      this.autoplayResumeOnShow = false;
      this.play();
    }
  }

  /* ============================================================ view tools */

  private resetView(): void {
    const state = stateOf(this.view);
    const own = this.targetFor(this.view, this.frameFor(state));
    this.gestures.resetAdjusted();
    void this.animate({ ...own, center: this.snapshot().center, zoom: this.map.getZoom(), bearing: 0 }, readDurationMs("--duration-map"), "ease");
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
        const active = this.view.waypointId === waypoint.id;
        this.handlers().onSelectWaypoint(active ? null : waypoint.id);
      });
      // Reveal on the trip overview (not over a focused stop, where the story already shows it).
      this.reveal.bind(dom.root, dom.button, () =>
        stateOf(this.view) === "trip" && !this.map.isMoving() ? this.content.revealStop(trip, waypoint, key) : null,
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
   * engine / autoplay. Other stops dim while one is in focus.
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
      const focused = s.waypoint.id === this.step.waypointId;
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

/** Mountains first, then cities, parks, ranges, the rest. */
function labelPriority(place: Landmark, boosted: boolean): number {
  const height = (place.elevationM ?? 0) / 10000; // taller peaks win ties
  const base = { peak: 50, city: 44, park: 30, range: 26, poi: 10 }[place.kind];
  return base + (place.labelTier === 1 ? 20 : 0) + (boosted ? 25 : 0) + height;
}
