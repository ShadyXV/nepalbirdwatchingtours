import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";

import { useEffect, useRef } from "react";
import { speciesCountForTrip } from "~/content";
import { t } from "~/i18n";
import { MapController, type MapContent, type MapHandlers, type MapView } from "./controller";
import type { NepalMapProps } from "./types";

/**
 * The map of Nepal: MapLibre terrain with DOM pins and labels (see docs/MAP.md).
 * Client only: it is lazy-loaded after hydration by the map layout. The React side is thin; it
 * hands the URL state to MapController, which owns the map, the markers and the camera.
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
  appearance = "solid",
  className = "",
}: NepalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<MapController | null>(null);

  // Latest callbacks, read at click time, so the map never needs re-creating.
  const handlersRef = useRef<MapHandlers>({ onSelectTrip, onSelectWaypoint, onSelectPlace });
  handlersRef.current = { onSelectTrip, onSelectWaypoint, onSelectPlace };

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
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setView(viewRef.current);
  }, [activeTripSlug, activeWaypointId, activePlaceId, previewTripSlug]);

  return (
    <div className={`nbt-map ${appearance === "overlay" ? "nbt-map--overlay" : ""} ${className}`}>
      <div ref={containerRef} className="nbt-map__canvas" role="region" aria-label={t("map.label")} />
      {/* Paper grain, cloud/fog vignettes: cheap static DOM over the canvas. */}
      <div className="nbt-map__grain" aria-hidden="true" />
      <div className="nbt-map__clouds" aria-hidden="true" />
      <div className="nbt-map__vignette" aria-hidden="true" />
    </div>
  );
}
