import { MediaFrame } from "~/components/media";
import { FieldLabel, formatAltitude } from "~/components/ui";
import { speciesSeenAtWaypoint } from "~/content";
import type { Trip, Waypoint } from "~/content/types";
import { t } from "~/i18n";
import { dayChecklist, tripDays, type TripDay } from "~/lib/tripDays";
import { isKeyStop } from "~/lib/tripStops";
import { dayHref } from "./useJourneyUrl";

/**
 * The trip, day by day, as plain reading content: the prerendered (no-JS, crawler, AI agent)
 * version of the day view, and the overview's itinerary. A semantic <ol> of days in reading order,
 * each `<li id="day-n">` with its heading, stops and notes, the day's two media (alt text and field
 * labels), how many birds are possible and the checklist. Nothing is hidden by default.
 *
 * "Day n →" links are `?day=n#day-n`: with JS they open the day view on that day; without, they
 * jump to the day here. Stop names toggle the stop on the map (?stop=), as before.
 */
type DayListProps = {
  trip: Trip;
  activeWaypointId: string | null;
  focusedId: string | null;
  onToggleStop: (id: string) => void;
  /** Open the day view on a day (null before hydration: the links just navigate). */
  onOpenDay: ((day: number) => void) | null;
};

export function DayList({ trip, activeWaypointId, focusedId, onToggleStop, onOpenDay }: DayListProps) {
  const days = tripDays(trip);
  return (
    <ol className="mt-4 space-y-10">
      {days.map((day) => (
        <DayItem key={day.n} trip={trip} day={day} activeWaypointId={activeWaypointId} focusedId={focusedId} onToggleStop={onToggleStop} onOpenDay={onOpenDay} />
      ))}
    </ol>
  );
}

function DayItem({ trip, day, activeWaypointId, focusedId, onToggleStop, onOpenDay }: Omit<DayListProps, "trip"> & { trip: Trip; day: TripDay }) {
  const stops = day.rest ? [] : day.waypoints;
  const { todayIds } = day.stats;
  const checklist = dayChecklist(trip, day);
  const place = day.rest ? t("journey.restDay", { place: day.anchor.name }) : day.anchor.name;

  return (
    <li id={`day-${day.n}`} className="scroll-mt-24 border-t border-border pt-5">
      <article aria-labelledby={`day-${day.n}-title`}>
        <header className="flex items-start justify-between gap-4">
          <h3 id={`day-${day.n}-title`} className="flex flex-wrap items-baseline gap-x-3">
            {/* The day number is set like the word "Day": label caps, never the accent face. */}
            <span className="eyebrow text-fg">{t("trip.day", { day: day.n })}</span>
            <span className="font-display text-h3 uppercase">{place}</span>
          </h3>
          <a
            href={dayHref(trip, day.n)}
            className="eyebrow inline-flex min-h-tap shrink-0 items-center gap-1 text-accent hover:text-fg"
            onClick={(event) => {
              if (!onOpenDay) return;
              event.preventDefault();
              onOpenDay(day.n);
            }}
          >
            {t("journey.dayLink", { day: day.n })}
            <span aria-hidden="true">&rarr;</span>
          </a>
        </header>
        <p className="eyebrow mt-1 text-fg-muted">
          {[formatAltitude(day.anchor.altitudeM), day.anchor.nights > 0 ? t("trip.nights", { count: day.anchor.nights }) : null, day.anchor.stay && day.anchor.stay.kind !== "none" ? (day.anchor.stay.name ?? day.anchor.stay.kind) : null]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {stops.length > 0 && (
          <ol className="mt-4 space-y-4">
            {stops.map((w) => (
              <StopItem
                key={w.id}
                waypoint={w}
                keyStop={isKeyStop(trip, w)}
                active={w.id === activeWaypointId}
                focused={w.id === focusedId}
                seen={speciesSeenAtWaypoint(trip.slug, w.id).size > 0}
                onToggle={() => onToggleStop(w.id)}
              />
            ))}
          </ol>
        )}

        {day.media.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {day.media.map((asset, i) => (
              <figure key={i} className="min-w-0">
                <MediaFrame asset={asset} />
                {asset.observation && <FieldLabel as="figcaption" observation={asset.observation} variant="compact" className="mt-2" />}
              </figure>
            ))}
          </div>
        )}

        <p className="mt-4 font-mono not-italic">
          <span className="accent text-[1.375rem] text-fg">{todayIds.length}</span>{" "}
          <span className="eyebrow">{todayIds.length === 1 ? t("journey.birdPossible") : t("journey.birdsPossible")}</span>
        </p>

        {checklist.length > 0 && (
          <section className="mt-3" aria-label={t("journey.checklist")}>
            {checklist.map((group) => (
              <p key={group.group} className="mt-1.5 text-small not-italic">
                <span className="eyebrow text-fg-muted">{t(`group.${group.group}`)}: </span>
                {group.items.map(({ species, seenWithGuests }, i) => (
                  <span key={species.id}>
                    {i > 0 && ", "}
                    {seenWithGuests && <span aria-label={t("journey.seenWithGuests")}>★ </span>}
                    {species.commonName}
                  </span>
                ))}
              </p>
            ))}
          </section>
        )}

        {day.peaks.length > 0 && (
          <p className="mt-2 text-small not-italic">
            <span className="eyebrow text-fg-muted">{t("journey.seenFromHere")}: </span>
            {day.peaks.map((p) => `${p.name} (${formatAltitude(p.elevationM ?? 0)})`).join(", ")}
          </p>
        )}
      </article>
    </li>
  );
}

type StopItemProps = { waypoint: Waypoint; keyStop: boolean; active: boolean; focused: boolean; seen: boolean; onToggle: () => void };

function StopItem({ waypoint, keyStop, active, focused, onToggle }: StopItemProps) {
  const details = [formatAltitude(waypoint.altitudeM), waypoint.nights > 0 ? t("trip.nights", { count: waypoint.nights }) : null].filter(Boolean);
  return (
    <li>
      <button type="button" className="flex min-h-tap items-center gap-3 text-left" aria-pressed={active} onClick={onToggle}>
        <span
          aria-hidden="true"
          className={`shrink-0 border-2 ${keyStop ? "size-3.5 border-fg" : "size-2.5 border-fg-muted"} ${active || focused ? "bg-marker" : "bg-transparent"}`}
        />
        <span className="min-w-0">
          <span className={`block font-medium ${active ? "text-route" : ""}`}>{waypoint.name}</span>
          <span className="eyebrow mt-0.5 block text-fg-muted">{details.join(" · ")}</span>
        </span>
      </button>
      {waypoint.stay && waypoint.stay.kind !== "none" && (
        <p className="mt-1 text-small not-italic text-fg-muted">
          <span className="eyebrow">{t("trip.stay")}: </span>
          {waypoint.stay.name ?? waypoint.stay.kind}
          {waypoint.stay.note ? `. ${waypoint.stay.note}` : ""}
        </p>
      )}
      {waypoint.summary && <p className="mt-1.5 text-small">{waypoint.summary}</p>}
    </li>
  );
}
