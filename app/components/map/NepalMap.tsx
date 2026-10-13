import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";

import { useEffect, useRef, useState } from "react";
import { speciesCountForTrip } from "~/content";
import { t } from "~/i18n";
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

  const control = "nbt-map__control";
  return (
    <div className={`nbt-map ${appearance === "overlay" ? "nbt-map--overlay" : ""} ${className}`}>
      <div ref={containerRef} className="nbt-map__canvas" role="region" aria-label={t("map.label")} />
      {/* Paper grain, cloud/fog vignettes: cheap static DOM over the canvas. */}
      <div className="nbt-map__grain" aria-hidden="true" />
      <div className="nbt-map__clouds" aria-hidden="true" />
      <div className="nbt-map__vignette" aria-hidden="true" />

      {/* Zoom (desktop) and "reset view" (after the user has turned or tilted the map). */}
      <div className="nbt-map__controls" data-map-control="">
        <button type="button" className={`${control} nbt-map__zoom`} aria-label={t("map.zoomIn")} onClick={() => apiRef.current?.zoomIn()}>
          <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" /></svg>
        </button>
        <button type="button" className={`${control} nbt-map__zoom`} aria-label={t("map.zoomOut")} onClick={() => apiRef.current?.zoomOut()}>
          <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M3 8h10" /></svg>
        </button>
        {adjusted && (
          <button type="button" className={`${control} nbt-map__reset`} aria-label={t("map.resetView")} title={t("map.resetView")} onClick={() => apiRef.current?.resetView()}>
            {/* A north arrow over a level horizon. */}
            <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M8 2l3 7H5z" /><path d="M2.5 13.5h11" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
