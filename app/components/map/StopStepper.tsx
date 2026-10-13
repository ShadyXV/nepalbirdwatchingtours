import { useEffect } from "react";
import type { Trip } from "~/content/types";
import { t } from "~/i18n";
import { keyStops, stepKeyStop } from "~/lib/tripStops";
import type { MapApi, StepState } from "./types";

type StopStepperProps = {
  trip: Trip;
  /** The stop chosen in the URL (?stop=). */
  activeWaypointId: string | null;
  step: StepState | null;
  map: MapApi | null;
  /** Deliberate choice: writes ?stop= (the camera follows through the stepping engine). */
  onSelect: (id: string | null) => void;
};

/**
 * A small on-map control for trip pages: ‹ DAY 4 · TADAPANI › plus play / pause for the autoplay.
 * Steps through the key stops; ← / → on the keyboard, Esc closes the stop. Minimal on purpose:
 * the trip page will become a scroll-driven journey that drives the same stepping engine.
 */
export function StopStepper({ trip, activeWaypointId, step, map, onSelect }: StopStepperProps) {
  const current = activeWaypointId ?? (step?.tripSlug === trip.slug ? step.waypointId : null);
  const waypoint = trip.waypoints.find((w) => w.id === current) ?? null;
  const prevId = stepKeyStop(trip, current, -1);
  const nextId = stepKeyStop(trip, current, 1);
  const canPrev = current !== null;
  const canNext = nextId !== null && nextId !== current;
  const playing = step?.autoplay === "playing";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
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

  const day = waypoint ? String(waypoint.day) : null;
  const dayText = waypoint ? t("trip.day", { day: waypoint.day }) : "";
  const at = day ? dayText.lastIndexOf(day) : -1;

  return (
    <div className="nbt-stepper" role="group" aria-label={t("map.stepper")} data-map-control="">
      <button type="button" className="nbt-stepper__arrow" aria-label={t("map.prevStop")} aria-keyshortcuts="ArrowLeft" disabled={!canPrev} onClick={() => onSelect(prevId)}>
        <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M10 3L5 8l5 5" /></svg>
      </button>

      <p className="nbt-stepper__now" aria-live="polite">
        {waypoint ? (
          <>
            <span className="nbt-stepper__day">
              {at >= 0 ? (
                <>
                  {dayText.slice(0, at)}
                  <span className="nbt-stepper__num">{day}</span>
                  {dayText.slice(at + (day?.length ?? 0))}
                </>
              ) : (
                dayText
              )}
            </span>
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

      {map && !activeWaypointId && (
        <button
          type="button"
          className="nbt-stepper__play"
          aria-label={playing ? t("map.pauseRoute") : t("map.playRoute")}
          onClick={() => (playing ? map.pause() : map.play())}
        >
          {playing ? (
            <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M5 3v10M11 3v10" /></svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M5 3l8 5-8 5z" /></svg>
          )}
          <span className="nbt-stepper__play-text">{playing ? t("map.pauseRoute") : t("map.playRoute")}</span>
        </button>
      )}
    </div>
  );
}
