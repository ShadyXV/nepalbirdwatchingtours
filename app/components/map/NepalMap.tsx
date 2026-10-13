import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";
import "./controls.css";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { getMemoriesForWaypoint, speciesCountForTrip } from "~/content";
import { t } from "~/i18n";
import { CAMERA } from "./camera";
import { MapController, type MapApi, type MapContent, type MapHandlers, type MapView } from "./controller";
import type { NepalMapProps } from "./types";

/**
 * The map of Nepal: MapLibre terrain with DOM pins and labels (see docs/MAP.md).
 * Client only: it is lazy-loaded after hydration by the map layout. The React side is thin; it
 * hands the URL state to MapController, which owns the map, the markers, the camera and the
 * stepping engine, and hands the engine back through `onReady`.
 */
export function NepalMap({
  trips,
  landmarks,
  activeTripSlug,
  activeWaypointId,
  activePlaceId,
  previewTripSlug = null,
  onSelectTrip,
  onSelectWaypoint,
  onSelectPlace,
  onStepChange,
  onReady,
  appearance = "solid",
  className = "",
}: NepalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<MapController | null>(null);
  const apiRef = useRef<MapApi | null>(null);
  const [adjusted, setAdjusted] = useState(false);

  // Latest callbacks, read at call time, so the map never needs re-creating.
  const handlersRef = useRef<MapHandlers>(null!);
  handlersRef.current = {
    onSelectTrip,
    onSelectWaypoint,
    onSelectPlace,
    onStepChange: (state) => onStepChange?.(state),
    onViewAdjusted: setAdjusted,
  };
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  const view: MapView = {
    tripSlug: activeTripSlug,
    waypointId: activeWaypointId,
    placeId: activePlaceId,
    previewSlug: previewTripSlug,
  };
  const viewRef = useRef(view);
  viewRef.current = view;

  // Create once. Trips and landmarks are static content, so they are read only here.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const mac = /Mac|iPhone|iPad/.test(navigator.userAgent);
    const content: MapContent = {
      trips,
      landmarks,
      birds: (trip) => {
        const count = speciesCountForTrip(trip, "bird");
        return { count, label: t("home.birds", { count }) };
      },
      stopLabel: (trip, index) => {
        const waypoint = trip.waypoints[index];
        return `${t("trip.day", { day: waypoint.day })}, ${waypoint.name}`;
      },
      dayLabel: (day) => t("trip.day", { day }),
      hints: { touch: t("map.hintTouch"), desktop: mac ? t("map.hintMac") : t("map.hintWindows") },
      // Trips: their reel (or cover). Stops: their own media, then photos from memories there.
      revealTrip: (trip) => ({ items: trip.reel.length > 0 ? trip.reel : [trip.cover], title: trip.title }),
      revealStop: (trip, waypoint) => {
        const items = [...waypoint.media, ...getMemoriesForWaypoint(trip.slug, waypoint.id).flatMap((m) => m.media)];
        if (items.length === 0) return null; // stops without media (key or not) reveal nothing
        return { items, title: waypoint.name, day: t("trip.day", { day: waypoint.day }) };
      },
    };
    let controller: MapController;
    try {
      controller = new MapController(container, content, () => handlersRef.current, viewRef.current);
    } catch {
      // No WebGL 2 (or it failed): the page is complete without the map.
      container.classList.add("is-unavailable");
      return;
    }
    controllerRef.current = controller;
    apiRef.current = controller.api();
    readyRef.current?.(apiRef.current);
    return () => {
      readyRef.current?.(null);
      controller.destroy();
      controllerRef.current = null;
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setView(viewRef.current);
  }, [activeTripSlug, activeWaypointId, activePlaceId, previewTripSlug]);

  const orbit = useOrbitPress(apiRef);

  // Keys: Q / E orbit (and Shift + ← / →). A tap turns one step, holding keeps turning.
  useEffect(() => {
    const direction = (event: KeyboardEvent): 1 | -1 | 0 => {
      const key = event.key.toLowerCase();
      if (key === "q" || (event.shiftKey && key === "arrowleft")) return 1;
      if (key === "e" || (event.shiftKey && key === "arrowright")) return -1;
      return 0;
    };
    const ignored = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return true;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return true;
      return Boolean(document.querySelector("[aria-modal='true']"));
    };
    const down = (event: KeyboardEvent) => {
      const dir = direction(event);
      if (!dir || ignored(event) || !apiRef.current) return;
      event.preventDefault();
      if (!event.repeat) orbit.start(dir);
    };
    const up = (event: KeyboardEvent) => {
      if (direction(event) || event.key === "Shift") orbit.end();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", orbit.end);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", orbit.end);
    };
  }, [orbit]);

  const control = "nbt-map__control";
  return (
    <div className={`nbt-map ${appearance === "overlay" ? "nbt-map--overlay" : ""} ${className}`}>
      <div ref={containerRef} className="nbt-map__canvas" role="region" aria-label={t("map.label")} />
      {/* Paper grain, cloud/fog vignettes: cheap static DOM over the canvas. */}
      <div className="nbt-map__grain" aria-hidden="true" />
      <div className="nbt-map__clouds" aria-hidden="true" />
      <div className="nbt-map__vignette" aria-hidden="true" />

      {/*
        Map controls, right edge. Primary: orbit (look around a ridge, keeping pitch and zoom); tap
        turns one step, press and hold keeps turning. "Reset view" after the user has turned or
        tilted the map. Zoom +/- only on desktop pointers, small and last (wheel / pinch zoom too).
      */}
      <div className="nbt-map__controls" data-map-control="">
        <div className="nbt-orbit" role="group" aria-label={t("map.orbit")}>
          <button
            type="button"
            className={`${control} nbt-orbit__btn`}
            aria-label={t("map.orbitLeft")}
            title={`${t("map.orbitLeft")} (Q)`}
            aria-keyshortcuts="Q Shift+ArrowLeft"
            {...orbit.bind(1)}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M15.5 11.5a6 6 0 1 1-2.2-6.6" /><path d="M14.6 2.2l-1.2 2.9 3 .8" /></svg>
          </button>
          <button
            type="button"
            className={`${control} nbt-orbit__btn`}
            aria-label={t("map.orbitRight")}
            title={`${t("map.orbitRight")} (E)`}
            aria-keyshortcuts="E Shift+ArrowRight"
            {...orbit.bind(-1)}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4.5 11.5a6 6 0 1 0 2.2-6.6" /><path d="M5.4 2.2l1.2 2.9-3 .8" /></svg>
          </button>
        </div>
        {adjusted && (
          <button type="button" className={`${control} nbt-map__reset`} aria-label={t("map.resetView")} title={t("map.resetView")} onClick={() => apiRef.current?.resetView()}>
            {/* A north arrow over a level horizon. */}
            <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M8 2l3 7H5z" /><path d="M2.5 13.5h11" /></svg>
          </button>
        )}
        <div className="nbt-map__zooms">
          <button type="button" className={`${control} nbt-map__zoom`} aria-label={t("map.zoomIn")} onClick={() => apiRef.current?.zoomIn()}>
            <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" /></svg>
          </button>
          <button type="button" className={`${control} nbt-map__zoom`} aria-label={t("map.zoomOut")} onClick={() => apiRef.current?.zoomOut()}>
            <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M3 8h10" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Press handling for an orbit control (buttons and keys): a short press turns one step
 * (CAMERA.orbitStepDeg), holding longer than CAMERA.orbitHoldMs keeps turning until release.
 * Keyboard activation of the buttons (Enter / Space, `click` with detail 0) turns one step.
 */
function useOrbitPress(apiRef: { current: MapApi | null }) {
  const ref = useRef<{ start: (dir: 1 | -1) => void; end: () => void; bind: (dir: 1 | -1) => object } | null>(null);
  if (!ref.current) {
    let timer = 0;
    let pressed: 1 | -1 | 0 = 0;
    let holding = false;
    const start = (dir: 1 | -1) => {
      end();
      pressed = dir;
      holding = false;
      timer = window.setTimeout(() => {
        holding = true;
        apiRef.current?.orbitHold(dir);
      }, CAMERA.orbitHoldMs);
    };
    const end = () => {
      window.clearTimeout(timer);
      if (!pressed) return;
      const dir = pressed;
      pressed = 0;
      if (holding) apiRef.current?.orbitRelease();
      else apiRef.current?.orbit(dir);
      holding = false;
    };
    const bind = (dir: 1 | -1) => ({
      onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        start(dir);
      },
      onPointerUp: end,
      onPointerCancel: end,
      onLostPointerCapture: end,
      onContextMenu: (e: Event | ReactKeyboardEvent) => e.preventDefault(),
      onClick: (e: { detail: number }) => {
        if (e.detail === 0) apiRef.current?.orbit(dir); // keyboard
      },
    });
    ref.current = { start, end, bind };
  }
  return ref.current;
}
