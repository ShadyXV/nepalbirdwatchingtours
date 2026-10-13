/**
 * MapController: the imperative side of the map. Owns the MapLibre instance, the DOM markers and
 * the camera, and turns a declarative `MapView` (what the URL says) into the S0–S3 states:
 *
 *   S0 overview  /                     gestures off, trip pins, few labels, faint routes
 *   S1 trip      /trips/:slug          route draws in, stops pop in, gestures on
 *   S2 stop      /trips/:slug?stop=id  ease to the stop, lens ring, other stops dimmed
 *   S3 place     /places/:id           place framed, its range softly lit
 *
 * The first view after load is applied without animation (direct landings arrive "already there");
 * later changes animate, unless the visitor prefers reduced motion.
 * Rendering is on demand: nothing animates while the map is idle.
 */
import { AttributionControl, Map as MapLibreMap, Marker, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { Landmark, LngLat, Trip } from "~/content/types";
import { readDurationMs, readToken } from "~/design/tokens";
import { parseEasing } from "~/lib/easing";
import { graticule, handDrawn, maskOutside, outerRings, type LineFeature } from "~/lib/geo";
import { mapInsets } from "~/lib/mapLayout";
import {
  CAMERA,
  cameraBounds,
  minZoomFor,
  NEPAL_FRAME,
  overviewCamera,
  placeCamera,
  previewCamera,
  stopCamera,
  tripAnchor,
  tripCamera,
  type CameraTarget,
  type Frame,
} from "./camera";
import { placeLabels, type LabelCandidate } from "./labels";
import { buildStyle, GRATICULE, LAYER, NEPAL_GEOJSON_URL, RANGE_GLOW, SRC, TERRAIN_EXAGGERATION } from "./look";
import { createLens, createPlaceLabel, createStopMarker, createTripPin, placeAnchor, type MarkerDom } from "./markers";
import { canAfford3D, initialPixelRatio, watchFrames } from "./perf";
import { drawRoute, setRouteProgress, type RouteColors } from "./routeDraw";

setWorkerUrl(workerUrl);

/* ------------------------------------------------------------- tunables */

/** Labels of tier-2 places appear from this zoom. */
const TIER2_FROM_ZOOM = 8.6;
/** Range names belong to the middle scales. */
const RANGE_ZOOMS = [6.6, 10.6] as const;
/** Small points of interest appear from this zoom. */
const POI_FROM_ZOOM = 10;
/** Pass-through stops get their name from this zoom (stays a little earlier). */
const STOP_LABEL_ZOOM = { stay: 11.2, spot: 12.6 };
/** Share of the flight after which the route starts drawing / the stops start popping. */
const DRAW_AT = 0.55;
const POP_AT = 0.62;
/** Highest pitch used when 3D terrain is off (a flat map at high pitch looks empty). */
const FLAT_MAX_PITCH = 45;
/** Below this map width, swiping the home trip cards also moves the camera. */
const PREVIEW_CAMERA_BELOW = 1024;

/* ---------------------------------------------------------------- types */

export type MapView = {
  tripSlug: string | null;
  waypointId: string | null;
  placeId: string | null;
  previewSlug: string | null;
};

export type MapHandlers = {
  onSelectTrip: (slug: string | null) => void;
  onSelectWaypoint: (id: string | null) => void;
  onSelectPlace: (id: string | null) => void;
};

export type MapContent = {
  trips: Trip[];
  landmarks: Landmark[];
  /** "142 birds" for a trip (already translated) and the number in it. */
  birds: (trip: Trip) => { label: string; count: number };
  /** Accessible name of a stop, e.g. "Day 4, Tadapani". */
  stopLabel: (trip: Trip, index: number) => string;
};

type MapStateName = "overview" | "trip" | "stop" | "place";

type PlacedMarker = { marker: Marker; dom: MarkerDom };

const stateOf = (v: MapView): MapStateName =>
  v.placeId ? "place" : v.tripSlug ? (v.waypointId ? "stop" : "trip") : "overview";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ----------------------------------------------------------- controller */

export class MapController {
  private readonly map: MapLibreMap;
  private readonly container: HTMLElement;
  private readonly content: MapContent;
  private readonly handlers: () => MapHandlers;

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
  private stops: { slug: string; items: (PlacedMarker & { id: string; stay: boolean })[] } | null = null;
  private lens: HTMLElement | null = null;

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
      maxBounds: cameraBounds(),
      pixelRatio: initialPixelRatio(),
      canvasContextAttributes: { antialias: (window.devicePixelRatio || 1) < 2 },
      attributionControl: false,
      fadeDuration: 0,
      renderWorldCopies: false,
    });
    this.map.setPadding(start.padding);
    // Top right: bottom corners are under the sheet / home content.
    this.map.addControl(new AttributionControl({ compact: true }), "top-right");
    this.setGestures(stateOf(initial) !== "overview");

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
    );

    let resizeTimer = 0;
    this.map.on("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => this.reframe(), 200);
    });
    if (document.fonts) document.fonts.ready.then(() => this.updateLabels());
  }

  /** Apply what the URL says. Safe to call before the map has loaded. */
  setView(next: MapView): void {
    const prev = this.view;
    this.view = next;
    if (!this.loaded) return;
    const animate = this.appliedOnce && !prefersReducedMotion();
    this.apply(this.appliedOnce ? prev : null, next, animate);
    this.appliedOnce = true;
  }

  /**
   * The "outside Nepal" muting is its own layer (LAYER.outside). Lower it to let something behind
   * the map show through around Nepal (e.g. a trip photo), 0 = no veil. Default: OUTSIDE.opacity.
   */
  setOutsideVeil(opacity: number, durationMs = 400): void {
    this.map.setPaintProperty(LAYER.outside, "fill-opacity-transition", { duration: durationMs, delay: 0 });
    this.map.setPaintProperty(LAYER.outside, "fill-opacity", opacity);
  }

  /**
   * Nepal's outline projected for the current camera, as an SVG path in map-container pixels
   * (usable as an SVG clipPath or CSS `clip-path: path()` / mask over the map). Null until the
   * outline has loaded. Recompute after camera moves ("moveend") if used as a live mask.
   */
  nepalOutlinePath(): string | null {
    if (this.nepalRings.length === 0) return null;
    return this.nepalRings
      .map((ring) => {
        const pts = ring.map((c) => this.map.project(c));
        return `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L")}Z`;
      })
      .join("");
  }

  destroy(): void {
    this.cancelDraw?.();
    for (const id of this.timers) window.clearTimeout(id);
    for (const dispose of this.disposers) dispose();
    this.map.remove();
  }

  /* ----------------------------------------------------------- loading */

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

  /* ---------------------------------------------------------- applying */

  private apply(prev: MapView | null, next: MapView, animate: boolean): void {
    const state = stateOf(next);
    const trip = next.tripSlug ? this.tripsBySlug.get(next.tripSlug) : undefined;
    const tripChanged = (prev?.tripSlug ?? null) !== (trip?.slug ?? null) || !prev;
    const flightMs = readDurationMs("--duration-map-flight");

    this.container.dataset.state = state;
    this.setGestures(state !== "overview");

    // Trip pins: only on the overview; the previewed one is raised.
    for (const [slug, { marker, dom }] of this.pins) {
      const preview = slug === next.previewSlug;
      dom.inner.classList.toggle("is-shown", state === "overview");
      dom.inner.classList.toggle("is-preview", preview);
      marker.getElement().style.zIndex = preview ? "3" : "2";
      dom.button.tabIndex = state === "overview" ? 0 : -1;
    }

    // Route and stops.
    if (tripChanged) {
      this.cancelDraw?.();
      this.cancelDraw = null;
      this.map.setFilter(LAYER.route, ["==", ["get", "slug"], trip?.slug ?? ""]);
      this.map.setFilter(LAYER.routeCasing, ["==", ["get", "slug"], trip?.slug ?? ""]);
      this.map.setFilter(LAYER.routesFaint, ["!=", ["get", "slug"], trip?.slug ?? ""]);
      this.clearStops(animate);
      if (trip) {
        if (animate) {
          this.cancelDraw = drawRoute(this.map, this.colors, {
            delayMs: flightMs * DRAW_AT,
            durationMs: readDurationMs("--duration-route-draw"),
            easing: parseEasing(readToken("--ease-sheet")),
          });
        } else {
          setRouteProgress(this.map, this.colors, 1);
        }
        this.createStops(trip, animate ? flightMs * POP_AT : null);
      }
    }
    this.setActiveStop(trip ? next.waypointId : null);

    // Places: the open one, its lit range, the trip's own landmarks.
    this.updatePlaceStates(next, trip);

    this.moveCamera(prev, next, animate);
    if (!animate || !this.map.isMoving()) this.later(() => this.updateLabels(), 0);
  }

  private moveCamera(prev: MapView | null, next: MapView, animate: boolean): void {
    const state = stateOf(next);
    const target = this.targetFor(next, this.frameFor(state));
    if (!animate || !prev) {
      this.map.jumpTo(target);
      return;
    }
    const prevState = stateOf(prev);
    const easing = parseEasing(readToken("--ease-map"));

    if (state === "overview" && prevState === "overview") {
      // Only the home carousel preview can change here.
      const swiped = prev.previewSlug && next.previewSlug && prev.previewSlug !== next.previewSlug;
      const trip = next.previewSlug ? this.tripsBySlug.get(next.previewSlug) : undefined;
      if (swiped && trip && this.container.clientWidth < PREVIEW_CAMERA_BELOW) {
        this.map.easeTo({ ...previewCamera(target, tripAnchor(trip)), duration: readDurationMs("--duration-map"), easing });
      }
      return;
    }
    if (prev.tripSlug && prev.tripSlug === next.tripSlug) {
      // S1 <-> S2, or stop to stop: a short ease.
      this.map.easeTo({ ...target, duration: readDurationMs("--duration-map"), easing });
      return;
    }
    const duration = state === "overview" ? readDurationMs("--duration-map-return") : readDurationMs("--duration-map-flight");
    this.map.flyTo({ ...target, duration, easing, curve: CAMERA.flightCurve });
  }

  /** Re-frame the current state after a resize (e.g. phone rotation). */
  private reframe(): void {
    if (!this.loaded || this.map.isMoving()) return;
    const target = this.targetFor(this.view, this.frameFor(stateOf(this.view)));
    this.map.setMinZoom(Math.min(target.zoom, minZoomFor(this.container.clientWidth, this.container.clientHeight)));
    this.map.easeTo({ ...target, duration: prefersReducedMotion() ? 0 : 400 });
  }

  private frameFor(state: MapStateName): Frame {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      padding: mapInsets(state === "overview" ? "home" : "sheet", this.container),
    };
  }

  private targetFor(view: MapView, frame: Frame): CameraTarget {
    const trip = view.tripSlug ? this.tripsBySlug.get(view.tripSlug) : undefined;
    const place = view.placeId ? this.placesById.get(view.placeId) : undefined;
    let target: CameraTarget;
    if (place) target = placeCamera(place, this.viewpoints, frame);
    else if (trip && view.waypointId) target = stopCamera(trip, view.waypointId, frame) ?? tripCamera(trip, frame);
    else if (trip) target = tripCamera(trip, frame);
    else target = overviewCamera({ nepal: NEPAL_FRAME, focus: this.focusPoints }, frame);
    if (!this.terrainOn) target = { ...target, pitch: Math.min(target.pitch, FLAT_MAX_PITCH) };
    return target;
  }

  /* -------------------------------------------------------- gestures */

  private setGestures(on: boolean): void {
    const m = this.map;
    const handlers: { enable(): void; disable(): void }[] = [
      m.dragPan,
      m.scrollZoom,
      m.boxZoom,
      m.dragRotate,
      m.keyboard,
      m.doubleClickZoom,
      m.touchZoomRotate,
      m.touchPitch,
    ];
    for (const h of handlers) (on ? h.enable() : h.disable());
    this.container.classList.toggle("is-explorable", on);
  }

  private setTerrain(on: boolean): void {
    this.terrainOn = on;
    this.map.setTerrain(on ? { source: SRC.demTerrain, exaggeration: TERRAIN_EXAGGERATION } : null);
  }

  /* ------------------------------------------------------------ pins */

  private createPins(): void {
    for (const trip of this.content.trips) {
      const { label, count } = this.content.birds(trip);
      const dom = createTripPin(trip, label, count);
      dom.button.addEventListener("click", () => this.handlers().onSelectTrip(trip.slug));
      const marker = new Marker({ element: dom.root, anchor: "bottom", opacityWhenCovered: "1", subpixelPositioning: true })
        .setLngLat(tripAnchor(trip))
        .addTo(this.map);
      this.pins.set(trip.slug, { marker, dom });
    }
  }

  /* ----------------------------------------------------------- stops */

  private createStops(trip: Trip, popDelayMs: number | null): void {
    const stagger = readDurationMs("--duration-stagger");
    const items = trip.waypoints.map((waypoint, index) => {
      const dom = createStopMarker(waypoint, index, this.content.stopLabel(trip, index));
      if (popDelayMs !== null) {
        dom.inner.classList.add("is-popping");
        dom.inner.style.setProperty("--pop-delay", `${Math.round(popDelayMs + index * stagger)}ms`);
      }
      dom.button.addEventListener("click", () => {
        const active = this.view.waypointId === waypoint.id;
        this.handlers().onSelectWaypoint(active ? null : waypoint.id);
      });
      const marker = new Marker({ element: dom.root, anchor: "center", opacityWhenCovered: "0.35", subpixelPositioning: true })
        .setLngLat(waypoint.coords)
        .addTo(this.map);
      return { marker, dom, id: waypoint.id, stay: waypoint.nights > 0 };
    });
    this.stops = { slug: trip.slug, items };
  }

  private clearStops(animate: boolean): void {
    if (!this.stops) return;
    const leaving = this.stops.items;
    this.stops = null;
    this.lens = null;
    if (!animate) {
      for (const s of leaving) s.marker.remove();
      return;
    }
    for (const s of leaving) s.dom.inner.classList.add("is-leaving");
    this.later(() => leaving.forEach((s) => s.marker.remove()), 320);
  }

  private setActiveStop(id: string | null): void {
    this.container.classList.toggle("has-active-stop", Boolean(id && this.stops));
    if (!this.stops) return;
    for (const s of this.stops.items) {
      const active = s.id === id;
      s.dom.inner.classList.toggle("is-active", active);
      s.dom.button.setAttribute("aria-pressed", String(active));
      s.marker.getElement().style.zIndex = active ? "4" : "1";
      if (active && this.lens?.parentElement !== s.dom.inner) {
        this.lens?.remove();
        this.lens = createLens();
        s.dom.inner.prepend(this.lens);
      }
    }
    if (!id) {
      this.lens?.remove();
      this.lens = null;
    }
  }

  /* ---------------------------------------------------------- places */

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

  /* ---------------------------------------------------------- labels */

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
      const active = s.id === this.view.waypointId;
      candidates.push({
        el: label,
        eligible: active || zoom >= (s.stay ? STOP_LABEL_ZOOM.stay : STOP_LABEL_ZOOM.spot),
        forced: active,
        priority: active ? 90 : s.stay ? 40 : 12,
      });
    }

    // Labels keep clear of the pins (overview) or the stop blobs (trip).
    const obstacles =
      state === "overview"
        ? [...this.pins.values()].flatMap((p) => [...p.dom.inner.querySelectorAll(".nbt-pin__photo, .nbt-pin__label")])
        : (this.stops?.items ?? []).flatMap((s) => s.dom.inner.querySelector(".nbt-stop__blob") ?? []);
    placeLabels(candidates, obstacles, this.container.getBoundingClientRect());
  }

  /* ----------------------------------------------------------- utils */

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
