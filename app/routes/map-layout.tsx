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
    <div className="flex h-full w-full items-center justify-center bg-paper text-ink-soft" role="status">
      {t("map.loading")}
    </div>
  );

  return (
    <>
      <div className="relative h-[calc(100svh-var(--spacing-header))] bg-paper">
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
          <div className="absolute inset-x-0 bottom-0 max-h-[60%] overflow-y-auto border-t border-ink/10 bg-paper/95 shadow-lg md:inset-y-0 md:right-auto md:max-h-none md:w-[26rem] md:border-r md:border-t-0">
            <Outlet context={context} />
          </div>
        )}
      </div>

      {!isTrip && <Outlet context={context} />}
    </>
  );
}
