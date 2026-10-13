/**
 * Which stops of a trip are "key" (featured in the story, visited by the auto-tour, stepped through
 * by the stop stepper), and stepping between them. Pure functions, used by the map and the screens.
 */
import type { Trip, Waypoint } from "~/content/types";

/**
 * Key stops in trip order. Falls back to the overnight stops when a trip flags none, and to every
 * stop when it has no overnights either (a day trip).
 */
export function keyStops(trip: Trip): Waypoint[] {
  const flagged = trip.waypoints.filter((w) => w.key);
  if (flagged.length > 0) return flagged;
  const overnight = trip.waypoints.filter((w) => w.nights > 0);
  return overnight.length > 0 ? overnight : trip.waypoints;
}

export function isKeyStop(trip: Trip, waypoint: Waypoint): boolean {
  return keyStops(trip).some((w) => w.id === waypoint.id);
}

/**
 * The key stop before / after `currentId` (which may be any stop, or null for the whole route).
 * Stepping back from the first key stop returns null: the whole route.
 */
export function stepKeyStop(trip: Trip, currentId: string | null, direction: 1 | -1): string | null {
  const keys = keyStops(trip);
  if (keys.length === 0) return null;
  const order = (id: string) => trip.waypoints.findIndex((w) => w.id === id);
  if (!currentId) return direction === 1 ? keys[0].id : null;
  const at = order(currentId);
  if (direction === 1) return (keys.find((k) => order(k.id) > at) ?? null)?.id ?? currentId;
  const before = [...keys].reverse().find((k) => order(k.id) < at);
  return before ? before.id : null;
}

/** Position of a stop among the key stops (1-based), or null when it isn't one. */
export function keyStopNumber(trip: Trip, id: string | null): number | null {
  if (!id) return null;
  const index = keyStops(trip).findIndex((w) => w.id === id);
  return index >= 0 ? index + 1 : null;
}
