import type { RefObject } from "react";
import { formatAltitude } from "~/components/ui";
import { getSpecies } from "~/content";
import type { Waypoint } from "~/content/types";
import { t } from "~/i18n";
import type { TripDay } from "~/lib/tripDays";
import { Count } from "./motion";

/**
 * One day's text on the day-view map. Deliberately little (owner): everything else is in the
 * This-day sheet, and the day's other stops are on the map.
 *
 *   headline  DAY 4 / TADAPANI / 2,630 m · 1 night · teahouse (one short line)
 *   birds     "78 birds possible", three names at a time drifting upward, "+75 more birds →"
 *
 * Day numbers are set exactly like the word "Day" (label caps); the altitude and the bird count use
 * the accent numerals. No scientific names on this screen.
 */

/** First sentence of a text. */
export function firstSentence(text: string): string {
  const match = /^.*?[.!?](\s|$)/.exec(text.trim());
  return (match ? match[0] : text).trim();
}

function stayLine(day: TripDay): string[] {
  const a = day.anchor;
  const parts: string[] = [];
  if (a.nights > 0) parts.push(t("trip.nights", { count: a.nights }));
  if (a.stay && a.stay.kind !== "none") parts.push(a.stay.name ?? a.stay.kind);
  return parts;
}

type StoryProps = {
  day: TripDay;
  stopId: string | null;
  onStop: (id: string | null) => void;
  headingRef?: RefObject<HTMLHeadingElement | null>;
};

export function DayStory({ day, stopId, onStop, headingRef }: StoryProps) {
  const place = day.rest ? t("journey.restDay", { place: day.anchor.name }) : day.anchor.name;
  const stop = stopId ? day.waypoints.find((w) => w.id === stopId) : undefined;
  return (
    <div className="jr-story__inner">
      <h2 ref={headingRef} tabIndex={-1} className="jr-head">
        <span className="jr-head__day">{t("trip.day", { day: day.n })}</span>
        <span className="jr-head__place">{place}</span>
      </h2>
      <p className="jr-meta">
        <span className="jr-alt">
          <span className="jr-alt__num">{day.anchor.altitudeM.toLocaleString("en")}</span>
          <span className="jr-alt__unit">m</span>
        </span>
        {stayLine(day).map((part) => (
          <span key={part} className="jr-meta__part">
            {part}
          </span>
        ))}
      </p>
      {stop && <StopPanel stop={stop} onClose={() => onStop(null)} />}
    </div>
  );
}

/** A tapped stop of the day: name, altitude, one line (not a pop-up); the camera has gone there. */
function StopPanel({ stop, onClose }: { stop: Waypoint; onClose: () => void }) {
  return (
    <section className="jr-stop" aria-label={stop.name}>
      <p className="jr-stop__name">
        {stop.name} <span className="jr-stop__alt">{formatAltitude(stop.altitudeM)}</span>
      </p>
      {stop.summary && <p className="jr-stop__line">{firstSentence(stop.summary)}</p>}
      <button type="button" className="jr-link" onClick={onClose}>
        <span aria-hidden="true">← </span>
        {t("journey.backToDay")}
      </button>
    </section>
  );
}

type DiaryProps = {
  day: TripDay;
  /** Only the count (no room for the names line). */
  compact?: boolean;
  onMore: () => void;
};

/** Bird names visible at a time in the drifting window. */
const NAMES_SHOWN = 3;
/** Seconds each name takes to drift through (one name's height). */
const NAME_SEC = 2.5;

/**
 * The day's birds: one count ("78 birds possible"), then a window of three names (label caps, one
 * line each) drifting slowly upward in a seamless loop (CSS transform; paused on hover / focus and
 * while the sheet is open; the first three, still, under reduced motion), then "+75 more birds →",
 * which opens the This-day sheet with the full list. `compact`: the count alone (no room).
 */
export function Diary({ day, compact = false, onMore }: DiaryProps) {
  const ids = day.stats.todayIds;
  const names = ids.map((id) => getSpecies(id)?.commonName).filter((n): n is string => Boolean(n));
  const moving = names.length > NAMES_SHOWN;
  const more = Math.max(0, names.length - NAMES_SHOWN);
  return (
    <div className="jr-diary__inner">
      <p className="jr-tally">
        <Count value={ids.length} className="jr-tally__num" />
        <span className="jr-tally__word">{ids.length === 1 ? t("journey.birdPossible") : t("journey.birdsPossible")}</span>
      </p>
      {!compact && names.length > 0 && (
        <>
          <div className="jr-names" data-moving={moving ? "" : undefined} tabIndex={moving ? 0 : undefined} aria-label={moving ? t("journey.birdNames") : undefined}>
            <div className="jr-names__track" style={{ "--jr-names-sec": `${names.length * NAME_SEC}s` } as React.CSSProperties}>
              <ul className="jr-names__list">
                {names.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
              {moving && (
                <ul className="jr-names__list" aria-hidden="true">
                  {names.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {more > 0 && (
            <button type="button" className="jr-link jr-names__more" onClick={onMore}>
              {t("journey.moreBirds", { count: more })}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** The final card after the last day: the whole route, every bird, and the way to book it. */
export function WholeWay({ birds, days, onPlan, onOverview }: { birds: number; days: number; onPlan: () => void; onOverview: () => void }) {
  return (
    <div className="jr-whole">
      <h2 className="jr-head">
        <span className="jr-head__place">{t("journey.wholeWay")}</span>
      </h2>
      <p className="jr-tally jr-whole__stats">
        <span className="jr-tally__item">
          <Count value={birds} from={0} className="jr-tally__num" />
          <span className="jr-tally__word">{t("journey.wholeWayBirds")}</span>
        </span>
        <span className="jr-tally__item">
          <span className="jr-tally__word">{t("trip.days", { count: days })}</span>
        </span>
      </p>
      <div className="jr-whole__actions">
        <button type="button" className="jr-btn jr-btn--primary" onClick={onPlan}>
          {t("journey.plan")}
        </button>
        <button type="button" className="jr-btn" onClick={onOverview}>
          {t("journey.overview")}
        </button>
      </div>
    </div>
  );
}
