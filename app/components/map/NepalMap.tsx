import { t } from "~/i18n";
import type { NepalMapProps } from "./types";

/** Placeholder until the MapLibre implementation lands; honours the NepalMapProps contract. */
export function NepalMap({
  trips,
  activeTripSlug,
  activeWaypointId,
  onSelectTrip,
  onSelectWaypoint,
  appearance = "solid",
  className = "",
}: NepalMapProps) {
  const activeTrip = trips.find((trip) => trip.slug === activeTripSlug);
  const surface = appearance === "overlay" ? "bg-paper/70" : "bg-paper";
  const item = "rounded-full border border-ink/30 px-3 py-1 text-sm hover:bg-paper-deep aria-pressed:bg-forest aria-pressed:text-snow";

  return (
    <div
      role="region"
      aria-label={t("map.label")}
      className={`flex h-full w-full flex-col items-center justify-center gap-6 p-6 text-center ${surface} ${className}`}
    >
      <p className="font-display text-2xl text-ink-soft">{t("map.comingSoon")}</p>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("map.trips")}</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {trips.map((trip) => (
            <li key={trip.slug}>
              <button
                type="button"
                className={item}
                aria-pressed={trip.slug === activeTripSlug}
                onClick={() => onSelectTrip(trip.slug === activeTripSlug ? null : trip.slug)}
              >
                {trip.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {activeTrip && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t("map.stops")}</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {activeTrip.waypoints.map((waypoint) => (
              <li key={waypoint.id}>
                <button
                  type="button"
                  className={item}
                  aria-pressed={waypoint.id === activeWaypointId}
                  onClick={() => onSelectWaypoint(waypoint.id === activeWaypointId ? null : waypoint.id)}
                >
                  {waypoint.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
