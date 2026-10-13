import "~/components/map/layout.css";

import { lazy, Suspense, useRef, useState, type CSSProperties } from "react";
import { Outlet, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import type { MapLayoutContext } from "~/components/map/layoutContext";
import { getLandmarks, getPublishedTrips } from "~/content";
import { readDurationMs } from "~/design/tokens";
import { t } from "~/i18n";
import { mapLayoutCssVars, type MapLayoutMode } from "~/lib/mapLayout";
import { useHydrated } from "~/lib/useHydrated";
import { useScrollDim } from "~/lib/useScrollDim";

// Client-only: the real map touches `window`, so it is never part of prerendering.
const NepalMap = lazy(() => import("~/components/map").then((m) => ({ default: m.NepalMap })));

const trips = getPublishedTrips();
const landmarks = getLandmarks();

/**
 * The map layout (/, /trips/:slug, /places/:placeId). Native page scroll, never hijacked:
 *
 *   stage   the map, sticky behind everything (one MapLibre map, mounted once)
 *   spacer  transparent, lets taps through to the map; its height is how much map shows
 *   sheet   the page content in normal document flow, rising over the map as you scroll
 *
 * Home: the map is a backdrop (gestures off, pins tappable); the content rises as a dark sheet and
 * the map dims. Trip / place: the map is explorable above a sheet that peeks (phones), or the sheet
 * is a left column (>= 1024 px). See docs/MAP.md.
 */
export default function MapLayout() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug, placeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [previewTripSlug, setPreviewTripSlug] = useState<string | null>(null);

  const activeTripSlug = slug ?? null;
  const activePlaceId = placeId ?? null;
  const activeWaypointId = activeTripSlug ? searchParams.get("stop") : null;
  const mode: MapLayoutMode = activeTripSlug || activePlaceId ? "sheet" : "home";

  // Entrance animations only after a client-side navigation to a new page: a direct landing
  // (prerendered HTML) shows its content immediately, and ?stop= changes never replay them.
  const entrance = useRef({ path: location.pathname, animate: false });
  if (entrance.current.path !== location.pathname) entrance.current = { path: location.pathname, animate: true };
  const animateEntrance = hydrated && entrance.current.animate;

  const rootRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  useScrollDim(rootRef, spacerRef, mode);

  function setActiveWaypoint(id: string | null) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set("stop", id);
        else next.delete("stop");
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  const context: MapLayoutContext = { activeWaypointId, setActiveWaypoint, previewTrip: setPreviewTripSlug };

  // The sheet rises about halfway through the camera flight (EXPERIENCE.md, Motion).
  const sheetDelay = animateEntrance
    ? Math.round(mode === "sheet" ? readDurationMs("--duration-map-flight") * 0.5 : readDurationMs("--duration-map-return") * 0.35)
    : 0;

  const fallback = (
    <div className="h-full w-full bg-bg" role="status">
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
              previewTripSlug={mode === "home" ? previewTripSlug : null}
              onSelectTrip={(next) => navigate(next ? `/trips/${next}` : "/")}
              onSelectWaypoint={setActiveWaypoint}
              onSelectPlace={(next) => navigate(next ? `/places/${next}` : "/")}
            />
          </Suspense>
        ) : (
          fallback
        )}
        <div className="nbt-stage__dim" aria-hidden="true" />
      </div>

      <div ref={spacerRef} className="nbt-spacer" aria-hidden="true" />

      <div
        key={location.pathname}
        className="nbt-sheet"
        data-enter={animateEntrance ? "" : undefined}
        style={{ "--sheet-delay": `${sheetDelay}ms` } as CSSProperties}
      >
        {mode === "sheet" && (
          <div aria-hidden="true" className="nbt-sheet__handle">
            <span />
          </div>
        )}
        <Outlet context={context} />
      </div>
    </div>
  );
}
