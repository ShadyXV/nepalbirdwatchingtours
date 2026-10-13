import { lazy, Suspense } from "react";
import { Outlet, useNavigate, useParams, useSearchParams } from "react-router";
import type { MapLayoutContext } from "~/components/map/layoutContext";
import { getLandmarks, getPublishedTrips } from "~/content";
import { t } from "~/i18n";
import { useHydrated } from "~/lib/useHydrated";

// Client-only: the real map touches `window`, so it is never part of prerendering.
const NepalMap = lazy(() => import("~/components/map").then((m) => ({ default: m.NepalMap })));

const trips = getPublishedTrips();
const landmarks = getLandmarks();

export default function MapLayout() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTripSlug = slug ?? null;
  const activeWaypointId = searchParams.get("stop");

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

  const context: MapLayoutContext = { activeWaypointId, setActiveWaypoint };
  const isTrip = activeTripSlug !== null;

  const fallback = (
    <div className="flex h-full w-full items-center justify-center bg-bg text-fg-muted" role="status">
      {t("map.loading")}
    </div>
  );

  return (
    <>
      <div className="relative h-[calc(100svh-var(--spacing-header))] bg-bg">
        {hydrated ? (
          <Suspense fallback={fallback}>
            <NepalMap
              trips={trips}
              landmarks={landmarks}
              activeTripSlug={activeTripSlug}
              activeWaypointId={activeWaypointId}
              onSelectTrip={(next) => navigate(next ? `/trips/${next}` : "/", { preventScrollReset: true })}
              onSelectWaypoint={setActiveWaypoint}
            />
          </Suspense>
        ) : (
          fallback
        )}

        {isTrip && (
          <div className="sheet absolute inset-x-0 bottom-0 max-h-[64%] overflow-y-auto overscroll-contain rounded-t-sheet border-t border-border bg-bg-raised shadow-sheet md:inset-y-0 md:right-auto md:max-h-none md:w-[26rem] md:rounded-none md:border-r md:border-t-0">
            {/* Drag handle: visual affordance only (sheet gestures come later). */}
            <div aria-hidden="true" className="sticky top-0 z-10 flex justify-center bg-bg-raised pb-1 pt-2.5 md:hidden">
              <span className="h-1 w-10 rounded-full bg-fg-muted/60" />
            </div>
            <Outlet context={context} />
          </div>
        )}
      </div>

      {!isTrip && <Outlet context={context} />}
    </>
  );
}
