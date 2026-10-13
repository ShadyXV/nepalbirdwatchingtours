import type { Landmark, Trip } from "~/content/types";

export type MapAppearance = "solid" | "overlay"; // overlay = translucent paper so a media layer beneath shows through

export type NepalMapProps = {
  trips: Trip[];
  landmarks: Landmark[];
  activeTripSlug: string | null;
  activeWaypointId: string | null;
  onSelectTrip: (slug: string | null) => void;
  onSelectWaypoint: (id: string | null) => void;
  appearance?: MapAppearance;
  className?: string;
};
