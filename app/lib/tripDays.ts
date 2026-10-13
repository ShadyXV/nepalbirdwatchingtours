/**
 * A trip, day by day: the model behind the trip's day view ("the journey", docs/JOURNEY.md) and the
 * day-by-day itinerary in the prerendered trip page. Pure functions over the content; no DOM.
 *
 *   day        1..D (D = durationDays, or the last waypoint day if later). Rest days with no stops
 *              of their own still get a day.
 *   anchor     the day's overnight stop (nights > 0), else its last stop; a rest day keeps the
 *              previous day's anchor ("rest day at Ghorepani")
 *   midpoints  the day's other stops, in order
 *   segment    the route from the previous anchor (or the trip's start) to this anchor
 *   media      up to two assets, [A, B]: A prefers the place (landscape), B the subject (a bird)
 *   stats      the birding diary: birds possible today, new on this trip today, and so far
 *   peaks      "seen from here": curated (`waypoint.views`) or the candidates by distance; the client
 *              refines the candidates with a line-of-sight check (MapApi.visiblePeaks)
 */
import { getMemoriesForWaypoint, getPlace, getPlaces, getSpecies, sightingStatsByStop, speciesSeenAtWaypoint } from "~/content";
import type { Landmark, Likelihood, LngLat, MediaAsset, Sighting, Species, SpeciesGroup, Trip, Waypoint } from "~/content/types";
import { distanceKm } from "./geo";

/** "Seen from here" candidates: big peaks from further away, small ones only nearby. */
export const SEEN_FROM = {
  /** Peaks at least this high count from up to `bigKm` away … */
  bigPeakM: 6000,
  bigKm: 60,
  /** … lower peaks only within `smallKm`. */
  smallKm: 20,
  /** Closer than this you are standing on it, not looking at it. */
  minKm: 1.5,
  /** At most this many mountains per day. */
  max: 4,
} as const;

export type DayStats = {
  /** Birds possible on this day's stops (unique species ids, ordered for display). */
  todayIds: string[];
  /** Of those, first possible on this trip today (seen-with-guests first, then by likelihood). */
  newIds: string[];
  /** Unique birds from the start of the trip up to and including today. */
  soFar: number;
};

export type TripDay = {
  /** 1-based day number. */
  n: number;
  /** The day's own stops, in trip order (empty on a rest day). */
  waypoints: Waypoint[];
  anchor: Waypoint;
  /** True when the day has no stops of its own. */
  rest: boolean;
  /** The day's stops other than the anchor. */
  midpoints: Waypoint[];
  /** Route from the previous anchor (or the trip's start) to this anchor. */
  segment: LngLat[];
  /** [A, B]; may hold one asset or none. */
  media: MediaAsset[];
  stats: DayStats;
  /** "Seen from here" (curated or candidates by distance). */
  peaks: Landmark[];
  /** True when `peaks` came from `waypoint.views` (no line-of-sight refinement). */
  curatedPeaks: boolean;
  /** The wider candidate list the line-of-sight check picks the first SEEN_FROM.max visible from. */
  peakPool: Landmark[];
};

/* -------------------------------------------------------------- geometry */

/** The trip's travelled line: its route, or the stops in order. */
export function tripLine(trip: Trip): LngLat[] {
  return trip.route && trip.route.length > 1 ? trip.route : trip.waypoints.map((w) => w.coords);
}

/**
 * For each stop (in trip order), the index of the line vertex nearest to it, searching forward
 * only, so an out-and-back route (the same valley walked twice) assigns the return stops to the
 * return leg. Among vertices within `toleranceKm` of the best, the earliest wins.
 */
export function alongLine(line: LngLat[], stops: LngLat[], toleranceKm = 0.25): number[] {
  const out: number[] = [];
  let from = 0;
  for (const stop of stops) {
    let best = Infinity;
    for (let i = from; i < line.length; i++) best = Math.min(best, distanceKm(line[i], stop));
    let index = from;
    for (let i = from; i < line.length; i++) {
      if (distanceKm(line[i], stop) <= best + toleranceKm) {
        index = i;
        break;
      }
    }
    out.push(index);
    from = index;
  }
  return out;
}

/** Slice `line` between two vertex indexes (inclusive), with the stops' own points as ends. */
function sliceLine(line: LngLat[], i0: number, i1: number, start: LngLat, end: LngLat): LngLat[] {
  const inner = line.slice(Math.min(i0, i1), Math.max(i0, i1) + 1);
  if (i1 < i0) inner.reverse();
  return [start, ...inner, end];
}

/* ------------------------------------------------------------------ days */

const LIKELIHOOD_ORDER: Record<Likelihood, number> = { common: 0, likely: 1, possible: 2, rare: 3 };

const cache = new Map<string, TripDay[]>();

/** The trip's days (memoised per trip). */
export function tripDays(trip: Trip): TripDay[] {
  const hit = cache.get(trip.slug);
  if (hit) return hit;
  const days = buildDays(trip);
  cache.set(trip.slug, days);
  return days;
}

/** Number of days in the trip's day view. */
export function dayCount(trip: Trip): number {
  return Math.max(1, trip.durationDays, ...trip.waypoints.map((w) => w.day));
}

/** Clamp a requested day (e.g. from `?day=`) into 1..D; NaN → 1. */
export function clampDay(trip: Trip, n: number): number {
  const d = dayCount(trip);
  return Number.isFinite(n) ? Math.min(d, Math.max(1, Math.round(n))) : 1;
}

function buildDays(trip: Trip): TripDay[] {
  const count = dayCount(trip);
  const line = tripLine(trip);
  const vertex = alongLine(line, trip.waypoints.map((w) => w.coords));
  const vertexOf = new Map(trip.waypoints.map((w, i) => [w.id, vertex[i]]));
  const birdStats = sightingStatsByStop(trip, "bird");

  const days: TripDay[] = [];
  let prevAnchor: Waypoint | null = null;
  let soFar = 0;

  for (let n = 1; n <= count; n++) {
    const waypoints = trip.waypoints.filter((w) => w.day === n);
    const rest = waypoints.length === 0;
    const anchor: Waypoint = rest
      ? (prevAnchor ?? trip.waypoints[0])
      : ([...waypoints].reverse().find((w) => w.nights > 0) ?? waypoints[waypoints.length - 1]);

    // Segment: previous anchor (or the line's start) → this anchor, along the line.
    const startPoint: LngLat = prevAnchor ? prevAnchor.coords : line[0];
    const i0 = prevAnchor ? (vertexOf.get(prevAnchor.id) ?? 0) : 0;
    const i1 = vertexOf.get(anchor.id) ?? i0;
    const segment = rest ? [anchor.coords] : sliceLine(line, i0, i1, startPoint, anchor.coords);

    // Diary: birds over the day's stops.
    const todaySightings: Sighting[] = (rest ? [anchor] : waypoints).flatMap((w) => w.sightings);
    const todayIds = uniqueBirds(todaySightings);
    const newSet = new Set(rest ? [] : waypoints.flatMap((w) => birdStats.get(w.id)?.newIds ?? []));
    if (!rest) soFar = birdStats.get(waypoints[waypoints.length - 1].id)?.soFar ?? soFar;
    const seenWithGuests = new Set((rest ? [anchor] : waypoints).flatMap((w) => [...speciesSeenAtWaypoint(trip.slug, w.id)]));
    const likelihood = new Map<string, number>(todaySightings.map((s) => [s.speciesId, LIKELIHOOD_ORDER[s.likelihood]]));
    const newIds = todayIds
      .filter((id) => newSet.has(id))
      .sort((a, b) => Number(seenWithGuests.has(b)) - Number(seenWithGuests.has(a)) || (likelihood.get(a) ?? 9) - (likelihood.get(b) ?? 9));

    const { peaks, pool, curated } = peaksFrom(anchor);

    days.push({
      n,
      waypoints,
      anchor,
      rest,
      midpoints: waypoints.filter((w) => w.id !== anchor.id),
      segment,
      media: [],
      stats: { todayIds, newIds, soFar },
      peaks,
      curatedPeaks: curated,
      peakPool: pool,
    });
    if (!rest) prevAnchor = anchor;
  }

  pickDayMedia(trip, days);
  return days;
}

function uniqueBirds(sightings: Sighting[]): string[] {
  const ids: string[] = [];
  for (const s of sightings) if (!ids.includes(s.speciesId) && getSpecies(s.speciesId)?.group === "bird") ids.push(s.speciesId);
  return ids;
}

/* ----------------------------------------------------------------- media */

/** One image for a still (image src, or a video's poster): two assets showing the same still are one. */
const stillOf = (a: MediaAsset) => (a.kind === "image" ? a.src : a.poster);
/** A photo of a place rather than a creature: no species in frame, or a landmark named. */
const isLandscape = (a: MediaAsset) => !a.observation?.speciesIds?.length || Boolean(a.observation?.landmarkId);
/** A video shown as its poster still (only one clip may play per day). */
const posterOf = (a: MediaAsset): MediaAsset =>
  a.kind === "video" ? { kind: "image", src: a.poster, alt: a.alt, observation: a.observation, credit: a.credit } : a;

/**
 * Two media per day (research §5.6), in this order of preference, without repeats:
 *   1. the day's key stops (anchor first)   2. memories at the day's stops, newest first
 *   3. the day's other stops                4. a mountain seen from the anchor
 *   5. unused trip reel items, round-robin, never the same as the day before.
 * Slot A (top-left, larger) takes the place, slot B the subject. At most one video per day.
 */
export function pickDayMedia(trip: Trip, days: TripDay[]): void {
  const usedStills = new Set<string>();
  const own: MediaAsset[][] = days.map((day) => {
    const stops = day.rest ? [] : day.waypoints;
    const keyStops = stops.filter((w) => w.key).sort((a, b) => Number(b.id === day.anchor.id) - Number(a.id === day.anchor.id));
    const others = stops.filter((w) => !w.key);
    const candidates = [
      ...keyStops.flatMap((w) => w.media),
      ...stops.flatMap((w) => getMemoriesForWaypoint(trip.slug, w.id)).flatMap((m) => m.media),
      ...others.flatMap((w) => w.media),
      ...day.peaks.flatMap((p) => p.media.slice(0, 1)),
    ];
    const picked: MediaAsset[] = [];
    for (const asset of candidates) {
      if (picked.length === 2) break;
      if (picked.some((p) => stillOf(p) === stillOf(asset))) continue;
      picked.push(asset);
    }
    picked.forEach((a) => usedStills.add(stillOf(a)));
    return picked;
  });

  // Fill from the reel: items no day uses yet first, round-robin.
  const reel = trip.reel.length > 0 ? trip.reel : [trip.cover];
  const fresh = reel.filter((a) => !usedStills.has(stillOf(a)));
  const pool = fresh.length > 0 ? fresh : reel;
  let cursor = 0;
  days.forEach((day, i) => {
    const picked = own[i];
    const prev = i > 0 ? own[i - 1] : [];
    for (let tries = 0; picked.length < 2 && tries < pool.length; tries++) {
      const asset = pool[cursor % pool.length];
      cursor++;
      const clash = [...picked, ...prev].some((p) => stillOf(p) === stillOf(asset));
      if (!clash) picked.push(asset);
    }
    // Slots: the place on A, the subject on B.
    if (picked.length === 2 && !isLandscape(picked[0]) && isLandscape(picked[1])) picked.reverse();
    if (picked.length === 2 && picked[0].kind === "video" && picked[1].kind === "video") picked[1] = posterOf(picked[1]);
    day.media = picked;
  });
}

/* ------------------------------------------------------- seen from here */

function peaksFrom(anchor: Waypoint): { peaks: Landmark[]; pool: Landmark[]; curated: boolean } {
  if (anchor.views?.length) {
    const curated = anchor.views.flatMap((id) => getPlace(id) ?? []).slice(0, SEEN_FROM.max);
    return { peaks: curated, pool: curated, curated: true };
  }
  const pool = peakCandidates(anchor.coords, anchor.altitudeM);
  return { peaks: pool.slice(0, SEEN_FROM.max), pool, curated: false };
}

/**
 * Peaks that could be seen from a point, by distance only (the client checks line of sight),
 * the ones that loom largest first (highest angle above the horizon from `fromAltitudeM`).
 */
export function peakCandidates(from: LngLat, fromAltitudeM = 0): Landmark[] {
  return getPlaces()
    .filter((p) => p.kind === "peak" && p.elevationM !== undefined)
    .map((p) => ({ p, km: distanceKm(from, p.coords) }))
    .filter(({ p, km }) => km >= SEEN_FROM.minKm && km <= ((p.elevationM ?? 0) >= SEEN_FROM.bigPeakM ? SEEN_FROM.bigKm : SEEN_FROM.smallKm))
    .map(({ p, km }) => ({ p, angle: Math.atan2((p.elevationM ?? 0) - fromAltitudeM, km * 1000) }))
    .sort((a, b) => b.angle - a.angle)
    .map(({ p }) => p)
    .slice(0, SEEN_FROM.max * 2);
}

/* ------------------------------------------------------------ checklists */

export type ChecklistGroup = {
  group: SpeciesGroup;
  items: { species: Species; sighting: Sighting; seenWithGuests: boolean }[];
};

/** The day's full checklist (every group), grouped, ★ = seen with guests at one of the day's stops. */
export function dayChecklist(trip: Trip, day: TripDay): ChecklistGroup[] {
  const stops = day.rest ? [day.anchor] : day.waypoints;
  const seen = new Set(stops.flatMap((w) => [...speciesSeenAtWaypoint(trip.slug, w.id)]));
  const groups = new Map<SpeciesGroup, ChecklistGroup>();
  const done = new Set<string>();
  for (const sighting of stops.flatMap((w) => w.sightings)) {
    if (done.has(sighting.speciesId)) continue;
    const species = getSpecies(sighting.speciesId);
    if (!species) continue;
    done.add(sighting.speciesId);
    const entry = groups.get(species.group) ?? { group: species.group, items: [] };
    entry.items.push({ species, sighting, seenWithGuests: seen.has(species.id) });
    groups.set(species.group, entry);
  }
  return [...groups.values()];
}

/** Total birds over the whole trip (the "whole way" card). */
export function tripBirdTotal(trip: Trip): number {
  const days = tripDays(trip);
  return days.length ? days[days.length - 1].stats.soFar : 0;
}
