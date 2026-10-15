import type { Landmark, Memory, Offering, Review, Species, SpeciesGroup, Trip, TripReport } from "./types";
import { availability } from "./data/availability";
import { birdingGuide } from "./data/birdingGuide";
import { guide } from "./data/guide";
import { contactBanner, homeWays } from "./data/home";
import { landmarks } from "./data/landmarks";
import { memories } from "./data/memories";
import { offerings } from "./data/offerings";
import { reviews } from "./data/reviews";
import { species } from "./data/species";
import { tripReports } from "./data/tripReports";
import { trips } from "./data/trips";

export { availability, birdingGuide, contactBanner, guide, homeWays };

export function getPublishedTrips(): Trip[] {
  return trips.filter((trip) => trip.status === "published");
}

export function getTrip(slug: string): Trip | undefined {
  return getPublishedTrips().find((trip) => trip.slug === slug);
}

export function getSpecies(id: string): Species | undefined {
  return species.find((s) => s.id === id);
}

export function getLandmarks(): Landmark[] {
  return landmarks;
}

/** Places are landmarks: peaks, ranges, cities, parks and points of interest (pages at /places/<id>). */
export function getPlaces(): Landmark[] {
  return landmarks;
}

export function getPlace(id: string): Landmark | undefined {
  return landmarks.find((place) => place.id === id);
}

/** Published trips a place lists in `nearbyTripSlugs`, in that order. */
export function getTripsNearPlace(place: Landmark): Trip[] {
  return (place.nearbyTripSlugs ?? []).flatMap((slug) => getTrip(slug) ?? []);
}

export function getOfferings(): Offering[] {
  return offerings;
}

export function getOffering(id: string): Offering | undefined {
  return offerings.find((offering) => offering.id === id);
}

/** Reviews an offering lists in `reviewIds`, plus any review that names the offering in `offeringIds`. */
export function getReviewsForOffering(id: string): Review[] {
  const listed = getOffering(id)?.reviewIds ?? [];
  return reviews.filter((r) => listed.includes(r.id) || r.offeringIds?.includes(id));
}

/** Memories from past trips with guests, newest first. */
export function getMemoriesForTrip(slug: string): Memory[] {
  return memories.filter((m) => m.tripSlug === slug).sort((a, b) => b.date.localeCompare(a.date));
}

export function getMemoriesForWaypoint(slug: string, waypointId: string): Memory[] {
  return getMemoriesForTrip(slug).filter((m) => m.waypointId === waypointId);
}

/** Species seen with guests at a stop, from its memories (the ★ on checklists). */
export function speciesSeenAtWaypoint(slug: string, waypointId: string): Set<string> {
  return new Set(getMemoriesForWaypoint(slug, waypointId).flatMap((m) => m.seen));
}

export function getReviews(): Review[] {
  return reviews;
}

export function getReview(id: string): Review | undefined {
  return reviews.find((r) => r.id === id);
}

/** Every review, newest first. */
export function getReviewsNewestFirst(): Review[] {
  return [...reviews].sort((a, b) => b.date.localeCompare(a.date));
}

/** Trip reports whose trip is published, newest first. */
export function getTripReports(): TripReport[] {
  return tripReports.filter((report) => getTrip(report.tripSlug)).sort((a, b) => b.date.localeCompare(a.date));
}

export function getTripReport(slug: string): TripReport | undefined {
  return getTripReports().find((report) => report.slug === slug);
}

export function getReviewsForTrip(slug: string): Review[] {
  const trip = getTrip(slug);
  if (!trip) return [];
  return reviews.filter((r) => trip.reviewIds.includes(r.id));
}

export type StopSightingStats = {
  /** Species possible at this stop. */
  total: number;
  /** Of those, species not possible at any earlier stop on the trip. */
  newIds: string[];
  /** Unique species possible from the start of the trip up to and including this stop. */
  soFar: number;
};

/**
 * Per-stop running tally along the route: how many species each stop offers, how many are new on the
 * trip, and the running total. Powers "38 birds today · 12 new · 96 so far" in the journey.
 */
export function sightingStatsByStop(trip: Trip, group?: SpeciesGroup): Map<string, StopSightingStats> {
  const seen = new Set<string>();
  const stats = new Map<string, StopSightingStats>();
  for (const waypoint of trip.waypoints) {
    const ids = waypoint.sightings
      .map((s) => s.speciesId)
      .filter((id) => !group || getSpecies(id)?.group === group);
    const unique = [...new Set(ids)];
    const newIds = unique.filter((id) => !seen.has(id));
    newIds.forEach((id) => seen.add(id));
    stats.set(waypoint.id, { total: unique.length, newIds, soFar: seen.size });
  }
  return stats;
}

/** Unique species across a trip's waypoints, optionally limited to one group. */
export function speciesCountForTrip(trip: Trip, group?: SpeciesGroup): number {
  const ids = new Set<string>();
  for (const waypoint of trip.waypoints) {
    for (const sighting of waypoint.sightings) {
      if (!group || getSpecies(sighting.speciesId)?.group === group) ids.add(sighting.speciesId);
    }
  }
  return ids.size;
}
