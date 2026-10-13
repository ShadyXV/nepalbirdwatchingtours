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
  const surface = appearance === "overlay" ? "bg-bg/70" : "bg-bg";
  const item =
    "eyebrow min-h-tap rounded-button border border-border px-4 py-2 transition-colors duration-(--duration-micro) hover:border-route aria-pressed:border-route aria-pressed:bg-route aria-pressed:text-accent-fg";

  return (
    <div
      role="region"
      aria-label={t("map.label")}
      className={`flex h-full w-full flex-col items-center justify-center gap-6 p-6 text-center ${surface} ${className}`}
    >
      <p className="font-display text-h2 uppercase text-fg-muted">{t("map.comingSoon")}</p>

      <div>
        <p className="eyebrow mb-2 text-fg-muted">{t("map.trips")}</p>
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
          <p className="eyebrow mb-2 text-fg-muted">{t("map.stops")}</p>
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
