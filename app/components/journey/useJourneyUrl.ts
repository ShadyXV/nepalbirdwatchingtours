import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import type { Trip } from "~/content/types";
import { clampDay, dayCount } from "~/lib/tripDays";

/**
 * The day view lives in the URL: `?day=n` (1..D), `?day=end` for "the whole way" card.
 *
 *   open   pushes one history entry (marked `dayEntry`), from the overview
 *   step   replaces it, so Back always returns to the overview however many days were stepped
 *   exit   pops that entry (Back), or, when the page was landed on with ?day, replaces the URL
 *
 * Unknown or out-of-range values clamp into 1..D.
 */
export const DAY_PARAM = "day";
const END = "end";

type DayEntryState = { dayEntry?: boolean } | null;

/** The day in a `?day=` value: 1..D, D + 1 for "end", null when absent. */
export function parseDayParam(trip: Trip, raw: string | null): number | null {
  if (raw === null) return null;
  if (raw === END) return dayCount(trip) + 1;
  return clampDay(trip, Number.parseInt(raw, 10));
}

export function dayParamValue(trip: Trip, day: number): string {
  return day > dayCount(trip) ? END : String(day);
}

/** `?day=n#day-n`: the link that opens day n (without JS it jumps to that day in the itinerary). */
export function dayHref(trip: Trip, day: number): string {
  return `?${DAY_PARAM}=${dayParamValue(trip, day)}#day-${Math.min(day, dayCount(trip))}`;
}

export function useJourneyUrl(trip: Trip) {
  const [, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as DayEntryState;

  const write = useCallback(
    (day: number | null, push: boolean) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (day === null) next.delete(DAY_PARAM);
          else next.set(DAY_PARAM, dayParamValue(trip, day));
          return next;
        },
        push
          ? { preventScrollReset: true, state: { ...(state ?? {}), dayEntry: true } }
          : { replace: true, preventScrollReset: true, state },
      ),
    [setSearchParams, trip, state],
  );

  /** From the overview: one history entry to go back to. */
  const open = useCallback((day: number) => write(day, true), [write]);
  /** Day to day: replace. */
  const step = useCallback((day: number) => write(day, false), [write]);
  /** Back to the overview, exactly as it was. */
  const exit = useCallback(() => {
    if (state?.dayEntry) navigate(-1);
    else write(null, false);
  }, [state, navigate, write]);

  return { open, step, exit };
}
