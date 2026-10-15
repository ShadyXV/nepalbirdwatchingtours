import type { Landmark, Region, Trip } from "~/content/types";
import type { MapApi, StepState } from "./controller";

export type { DayStepOptions, JourneyApi, JourneyFootprint, JourneyListener, MapApi, OrbitApi, StepOptions, StepperApi, StepSource, StepState } from "./controller";

export type MapAppearance = "solid" | "overlay"; // overlay = translucent background so a media layer beneath shows through

export type NepalMapProps = {
  trips: Trip[];
  /** Regions with trips: one home pin each. */
  regions: Region[];
  landmarks: Landmark[];
  activeTripSlug: string | null;
  activeWaypointId: string | null;
  /** Open place (/places/:placeId), or null. */
  activePlaceId: string | null;
  /** Open region (/regions/:regionSlug), or null. */
  activeRegionSlug: string | null;
  /**
   * A trip singled out from outside the map. Region view: its route stays bright, the others dim.
   * Home: raises its region's pin (on phones the camera eases to it once the user is idle).
   */
  previewTripSlug?: string | null;
  onSelectTrip: (slug: string | null) => void;
  onSelectRegion: (slug: string) => void;
  /** Region view: a route or trip pin on the map is hovered / focused (null = left). */
  onPreviewTrip?: (slug: string | null) => void;
  onSelectWaypoint: (id: string | null) => void;
  onSelectPlace: (id: string | null) => void;
  /** The stepping engine's state (focused stop) on every change. */
  onStepChange?: (state: StepState) => void;
  /** The map's API (stepping engine, view tools) once created; null when it goes away. */
  onReady?: (api: MapApi | null) => void;
  appearance?: MapAppearance;
  className?: string;
};
