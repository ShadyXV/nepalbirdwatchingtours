import type { Landmark, Trip } from "~/content/types";
import type { MapApi, StepState } from "./controller";

export type { MapApi, StepOptions, StepperApi, StepSource, StepState } from "./controller";
export type { AutoplayStatus } from "./tour";

export type MapAppearance = "solid" | "overlay"; // overlay = translucent background so a media layer beneath shows through

export type NepalMapProps = {
  trips: Trip[];
  landmarks: Landmark[];
  activeTripSlug: string | null;
  activeWaypointId: string | null;
  /** Open place (/places/:placeId), or null. */
  activePlaceId: string | null;
  /** Home trip-card carousel: the card in view. Raises its pin; on phones the camera follows swipes. */
  previewTripSlug?: string | null;
  onSelectTrip: (slug: string | null) => void;
  onSelectWaypoint: (id: string | null) => void;
  onSelectPlace: (id: string | null) => void;
  /** The stepping engine's state (focused stop, autoplay status) on every change. */
  onStepChange?: (state: StepState) => void;
  /** The map's API (stepping engine, view tools) once created; null when it goes away. */
  onReady?: (api: MapApi | null) => void;
  appearance?: MapAppearance;
  className?: string;
};
