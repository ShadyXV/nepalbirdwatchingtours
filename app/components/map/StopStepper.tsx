import "./navigator.css";

import { useEffect } from "react";
import { dayHref, useJourneyUrl } from "~/components/journey/useJourneyUrl";
import type { Trip } from "~/content/types";
import { t } from "~/i18n";
import { keyStops, stepKeyStop } from "~/lib/tripStops";
import type { StepState } from "./types";

type StopStepperProps = {
  trip: Trip;
  /** The stop chosen in the URL (?stop=). */
  activeWaypointId: string | null;
  step: StepState | null;
  /** Deliberate choice: writes ?stop= (the camera follows through the stepping engine). */
  onSelect: (id: string | null) => void;
};

/**
 * The trip overview's on-map navigator (navigator.css), in two places on the map:
 *
 *   top      a compact stepper pill: ‹ DAY 4 · TADAPANI › through the key stops (← / → keys, Esc
 *            closes the stop); it writes ?stop=
 *   bottom   "Start the journey" (opens the day view, ?day=1), the prominent CTA, above the peek
 *            (the round "show trip details" button on the seam is TripScreen's, in the sheet)
 *
 * Hidden while the day view is open (its own controls take over).
 */
export function StopStepper({ trip, activeWaypointId, step, onSelect }: StopStepperProps) {
  const journey = useJourneyUrl(trip);
  const current = activeWaypointId ?? (step?.tripSlug === trip.slug ? step.waypointId : null);
  const waypoint = trip.waypoints.find((w) => w.id === current) ?? null;
  const prevId = stepKeyStop(trip, current, -1);
  const nextId = stepKeyStop(trip, current, 1);
  const canPrev = current !== null;
  const canNext = nextId !== null && nextId !== current;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (document.documentElement.dataset.journey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable], [aria-modal='true']")) return;
      if (document.querySelector("[aria-modal='true']")) return;
      if (event.key === "ArrowRight" && canNext) onSelect(nextId);
      else if (event.key === "ArrowLeft" && canPrev) onSelect(prevId);
      else if (event.key === "Escape" && activeWaypointId) onSelect(null);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canNext, canPrev, nextId, prevId, activeWaypointId, onSelect]);

  // The day number is set exactly like the word "Day" (label caps), never in the accent face.
  const dayText = waypoint ? t("trip.day", { day: waypoint.day }) : "";

  return (
    <>
      <div className="nbt-navigator__top">
        <div className="nbt-stepper" role="group" aria-label={t("map.stepper")} data-map-control="">
          <button type="button" className="nbt-stepper__arrow" aria-label={t("map.prevStop")} aria-keyshortcuts="ArrowLeft" disabled={!canPrev} onClick={() => onSelect(prevId)}>
            <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M10 3L5 8l5 5" /></svg>
          </button>

          <p className="nbt-stepper__now" aria-live="polite">
            {waypoint ? (
              <>
                <span className="nbt-stepper__day">{dayText}</span>
                <span className="nbt-stepper__name">
                  {waypoint.name} · {waypoint.altitudeM.toLocaleString("en")} m
                </span>
              </>
            ) : (
              <>
                <span className="nbt-stepper__day">{t("map.wholeRoute")}</span>
                <span className="nbt-stepper__name">{t("map.keyStops", { count: keyStops(trip).length })}</span>
              </>
            )}
          </p>

          <button type="button" className="nbt-stepper__arrow" aria-label={t("map.nextStop")} aria-keyshortcuts="ArrowRight" disabled={!canNext} onClick={() => onSelect(nextId)}>
            <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M6 3l5 5-5 5" /></svg>
          </button>
        </div>
      </div>

      <div className="nbt-navigator__bottom" data-map-control="">
        <a
          href={dayHref(trip, 1)}
          className="nbt-navigator__journey"
          onClick={(event) => {
            event.preventDefault();
            journey.open(1);
          }}
        >
          {t("journey.start")}
        </a>
      </div>
    </>
  );
}
