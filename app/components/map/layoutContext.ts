import { useOutletContext } from "react-router";

/** Shared by the map layout route with its child routes via <Outlet context>. */
export type MapLayoutContext = {
  activeWaypointId: string | null;
  setActiveWaypoint: (id: string | null) => void;
};

export function useMapLayoutContext(): MapLayoutContext {
  return useOutletContext<MapLayoutContext>();
}
