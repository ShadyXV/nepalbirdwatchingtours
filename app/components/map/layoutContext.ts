import { useOutletContext } from "react-router";

/** Shared by the map layout route with its child routes via <Outlet context>. */
export type MapLayoutContext = {
  activeWaypointId: string | null;
  setActiveWaypoint: (id: string | null) => void;
  /**
   * Home trip-card carousel → map: the trip whose card is in view (null = none).
   * Raises that trip's pin; on phones the camera eases towards it as cards are swiped.
   */
  previewTrip: (slug: string | null) => void;
};

export function useMapLayoutContext(): MapLayoutContext {
  return useOutletContext<MapLayoutContext>();
}
