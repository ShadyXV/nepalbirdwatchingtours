import { useOutletContext } from "react-router";
import type { MapApi, StepState } from "./types";

/** Shared by the map layout route with its child routes via <Outlet context>. */
export type MapLayoutContext = {
  /** The stop chosen in the URL (?stop=), or null. */
  activeWaypointId: string | null;
  /** Deliberately choose a stop (writes ?stop=; closing returns the camera to where it was). */
  setActiveWaypoint: (id: string | null) => void;
  /**
   * Single out one trip on the map (null = none). Region page (its trip list: hover / focus a trip):
   * that trip's route stays bright and its pin is raised, the region's other routes dim. Home:
   * raises the trip's region pin. Cleared on every navigation.
   */
  previewTrip: (slug: string | null) => void;
  /**
   * The trip singled out right now, from the page (`previewTrip`) or from the map itself (hovering
   * a route or trip pin in the region view). Lets the region page's list mark the same trip.
   */
  previewedTrip: string | null;
  /**
   * The map's engines and view tools: stop stepping, the day view (`openJourney`, `goToDay`, …,
   * docs/JOURNEY.md), orbit, reset / zoom. Null until the map exists (and without JS).
   */
  map: MapApi | null;
  /** The engine's state: focused stop (URL or engine), key stops. */
  step: StepState | null;
};

export function useMapLayoutContext(): MapLayoutContext {
  return useOutletContext<MapLayoutContext>();
}
