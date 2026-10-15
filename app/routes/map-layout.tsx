import "~/components/map/layout.css";

import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Outlet, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { Journey } from "~/components/journey/Journey";
import type { MapLayoutContext } from "~/components/map/layoutContext";
import { StopStepper } from "~/components/map/StopStepper";
import type { MapApi, StepState } from "~/components/map/types";
import { TerrainBackdrop } from "~/components/ui";
import { getLandmarks, getPublishedTrips, getRegions, getTrip } from "~/content";
import { readDurationMs } from "~/design/tokens";
import { t } from "~/i18n";
import { mapLayoutCssVars, type MapLayoutMode } from "~/lib/mapLayout";
import { useHydrated } from "~/lib/useHydrated";
import { useScrollDim } from "~/lib/useScrollDim";

// Client-only: the real map touches `window`, so it is never part of prerendering.
const NepalMap = lazy(() => import("~/components/map").then((m) => ({ default: m.NepalMap })));

const trips = getPublishedTrips();
const regions = getRegions();
const landmarks = getLandmarks();

/** History state marking the entry pushed when a stop is opened (so closing it can go back). */
type StopEntryState = { stopEntry?: boolean } | null;

/**
 * The map layout (/, /regions/:regionSlug, /trips/:slug, /places/:placeId). Native page scroll,
 * never hijacked:
 *
 *   stage   the map, sticky behind everything (one MapLibre map, mounted once), plus on trip
 *           pages a small stop stepper
 *   spacer  transparent, lets taps through to the map; its height is how much map shows
 *   sheet   the page content in normal document flow, rising over the map as a dark sheet
 *
 * Opening a stop pushes one history entry; stepping between stops replaces it; closing it (Esc,
 * tapping the stop again, browser Back) pops it, and the camera returns to where it was.
 */
export default function MapLayout() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug, placeId, regionSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [previewTripSlug, setPreviewTripSlug] = useState<string | null>(null);
  const [mapApi, setMapApi] = useState<MapApi | null>(null);
  const [step, setStep] = useState<StepState | null>(null);

  const activeTripSlug = slug ?? null;
  const activePlaceId = placeId ?? null;
  const activeRegionSlug = regionSlug ?? null;
  const activeWaypointId = activeTripSlug ? searchParams.get("stop") : null;
  const mode: MapLayoutMode = activeTripSlug ? "trip" : activePlaceId ? "place" : activeRegionSlug ? "region" : "home";
  // A highlighted trip belongs to the page it was chosen on.
  useEffect(() => setPreviewTripSlug(null), [location.pathname]);
  const trip = activeTripSlug ? getTrip(activeTripSlug) : undefined;

  // Entrance animations only after a client-side navigation to a new page: a direct landing
  // (prerendered HTML) shows its content immediately, and ?stop= changes never replay them.
  const entrance = useRef({ path: location.pathname, animate: false });
  if (entrance.current.path !== location.pathname) entrance.current = { path: location.pathname, animate: true };
  const animateEntrance = hydrated && entrance.current.animate;

  const rootRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  useScrollDim(rootRef, spacerRef, mode);

  const locationState = location.state as StopEntryState;
  const setActiveWaypoint = useCallback(
    (id: string | null) => {
      const current = searchParams.get("stop");
      if (id === current) return;
      if (!id && locationState?.stopEntry) {
        navigate(-1); // pop the entry pushed when the stop was opened
        return;
      }
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set("stop", id);
          else next.delete("stop");
          return next;
        },
        id && !current
          ? { preventScrollReset: true, state: { stopEntry: true } } // opening: one entry to go back to
          : { replace: true, preventScrollReset: true, state: locationState },
      );
    },
    [searchParams, setSearchParams, navigate, locationState],
  );

  const context: MapLayoutContext = {
    activeWaypointId,
    setActiveWaypoint,
    previewTrip: setPreviewTripSlug,
    previewedTrip: previewTripSlug,
    map: mapApi,
    step,
  };

  // The sheet rises about halfway through the camera flight (EXPERIENCE.md, Motion).
  const sheetDelay = animateEntrance
    ? Math.round(mode === "home" ? readDurationMs("--duration-map-return") * 0.35 : readDurationMs("--duration-map-flight") * 0.5)
    : 0;

  const fallback = (
    <div className="relative h-full w-full bg-bg" role="status">
      <TerrainBackdrop />
      <span className="sr-only">{t("map.loading")}</span>
    </div>
  );

  return (
    <div ref={rootRef} className="nbt-layout" data-mode={mode} style={mapLayoutCssVars() as CSSProperties}>
      <div className="nbt-stage">
        {hydrated ? (
          <Suspense fallback={fallback}>
            <NepalMap
              trips={trips}
              landmarks={landmarks}
              activeTripSlug={activeTripSlug}
              activeWaypointId={activeWaypointId}
              activePlaceId={activePlaceId}
              activeRegionSlug={activeRegionSlug}
              regions={regions}
              previewTripSlug={mode === "home" || mode === "region" ? previewTripSlug : null}
              onSelectTrip={(next) => navigate(next ? `/trips/${next}` : "/")}
              onSelectRegion={(next) => navigate(`/regions/${next}`)}
              onPreviewTrip={setPreviewTripSlug}
              onSelectWaypoint={setActiveWaypoint}
              onSelectPlace={(next) => navigate(next ? `/places/${next}` : "/")}
              onStepChange={setStep}
              onReady={setMapApi}
            />
          </Suspense>
        ) : (
          fallback
        )}
        <div className="nbt-stage__dim" aria-hidden="true" />
        {hydrated && trip && (
          <div className="nbt-stage__stepper">
            <StopStepper trip={trip} activeWaypointId={activeWaypointId} step={step} onSelect={setActiveWaypoint} />
          </div>
        )}
      </div>

      <div ref={spacerRef} className="nbt-spacer" aria-hidden="true" />

      <div
        key={location.pathname}
        id="story"
        className="nbt-sheet"
        data-enter={animateEntrance ? "" : undefined}
        style={{ "--sheet-delay": `${sheetDelay}ms` } as CSSProperties}
      >
        <Outlet context={context} />
      </div>

      {/* The trip's day view (?day=n): a full-screen mode over the map, see components/journey. */}
      {hydrated && trip && <Journey key={trip.slug} trip={trip} map={mapApi} mapReady={step?.tripSlug === trip.slug} />}
    </div>
  );
}
