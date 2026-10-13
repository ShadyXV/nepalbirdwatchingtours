import type { Landmark, Review, Species, SpeciesGroup, Trip } from "./types";
import { availability } from "./data/availability";
import { guide } from "./data/guide";
import { landmarks } from "./data/landmarks";
import { reviews } from "./data/reviews";
import { species } from "./data/species";
import { trips } from "./data/trips";

export { availability, guide };

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

export function getReviews(): Review[] {
  return reviews;
}

export function getReviewsForTrip(slug: string): Review[] {
  const trip = getTrip(slug);
  if (!trip) return [];
  return reviews.filter((r) => trip.reviewIds.includes(r.id));
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
