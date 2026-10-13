import { useOutletContext } from "react-router";
import type { MapApi, StepState } from "./types";

/** Shared by the map layout route with its child routes via <Outlet context>. */
export type MapLayoutContext = {
  /** The stop chosen in the URL (?stop=), or null. */
  activeWaypointId: string | null;
  /** Deliberately choose a stop (writes ?stop=; closing returns the camera to where it was). */
  setActiveWaypoint: (id: string | null) => void;
  /**
   * Home trip-card carousel → map: the trip whose card is in view (null = none).
   * Raises that trip's pin; on phones the camera eases towards it when the user is idle.
   */
  previewTrip: (slug: string | null) => void;
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
