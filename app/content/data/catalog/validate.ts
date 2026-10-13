import type { MediaAsset, Observation, Review, Sighting, Trip } from "~/content/types";
import { trip as annapurna } from "../trips/annapurna-birding-trek";
import { trip as chitwan } from "../trips/chitwan-wildlife-safari";
import { trip as phulchowki } from "../trips/phulchowki-birding-day";
import { landmarks } from "./landmarks";
import { memories } from "./memories";
import { reviews } from "./reviews";
import { species } from "./species";

export type SeedReport = { errors: string[]; warnings: string[] };

/** Nepal's rough bounding box: [west, south, east, north]. */
const NEPAL_BBOX = [80.0, 26.3, 88.3, 30.5] as const;

const inNepal = ([lng, lat]: readonly [number, number]) =>
  lng >= NEPAL_BBOX[0] && lng <= NEPAL_BBOX[2] && lat >= NEPAL_BBOX[1] && lat <= NEPAL_BBOX[3];

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])(-\d{2})?$/;

/**
 * Dev-only consistency check of the seed content. No side effects on import: call it from a
 * script or a dev console. Returns every problem found rather than throwing at the first one.
 */
export function validateSeed(): SeedReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trips: Trip[] = [annapurna, chitwan, phulchowki];

  const speciesIds = new Set<string>();
  for (const s of species) {
    if (speciesIds.has(s.id)) errors.push(`species: duplicate id "${s.id}"`);
    speciesIds.add(s.id);
  }
  const landmarkIds = new Set(landmarks.map((l) => l.id as string));
  if (landmarkIds.size !== landmarks.length) errors.push("landmarks: duplicate id");
  const reviewIds = new Set(reviews.map((r) => r.id as string));
  if (reviewIds.size !== reviews.length) errors.push("reviews: duplicate id");
  const tripSlugs = new Set(trips.map((t) => t.slug));
  const usedSpecies = new Set<string>();

  const checkSighting = (where: string, s: Sighting) => {
    usedSpecies.add(s.speciesId);
    if (!speciesIds.has(s.speciesId)) errors.push(`${where}: unknown speciesId "${s.speciesId}"`);
  };

  const checkObservation = (where: string, o: Observation | undefined) => {
    if (!o) return errors.push(`${where}: media has no observation`);
    for (const id of o.speciesIds ?? []) {
      usedSpecies.add(id);
      if (!speciesIds.has(id)) errors.push(`${where}: observation speciesId "${id}" unknown`);
    }
    if (o.landmarkId && !landmarkIds.has(o.landmarkId)) errors.push(`${where}: observation landmarkId "${o.landmarkId}" unknown`);
    if (o.date && !DATE_RE.test(o.date)) errors.push(`${where}: observation date "${o.date}" malformed`);
    if ("coords" in o) errors.push(`${where}: observation must not carry coords`);
  };

  const checkMedia = (where: string, media: MediaAsset[], min: number, max: number) => {
    if (media.length < min || media.length > max) warnings.push(`${where}: ${media.length} media (expected ${min}-${max})`);
    media.forEach((m, i) => {
      checkObservation(`${where}.media[${i}]`, m.observation);
      if (m.kind === "video" && !m.alt) errors.push(`${where}.media[${i}]: video without alt`);
      if (!m.alt) errors.push(`${where}.media[${i}]: missing alt`);
    });
  };

  for (const trip of trips) {
    const t = trip.slug;
    if (trip.status !== "published") warnings.push(`${t}: not published`);
    if (trip.pricing?.show !== false) errors.push(`${t}: pricing.show must be false for seed data`);
    checkMedia(`${t}.cover`, [trip.cover], 1, 1);
    checkMedia(`${t}.reel`, trip.reel, 4, 6);
    for (const id of trip.landmarkIds) if (!landmarkIds.has(id)) errors.push(`${t}: unknown landmarkId "${id}"`);
    for (const id of trip.reviewIds) {
      if (!reviewIds.has(id)) errors.push(`${t}: unknown reviewId "${id}"`);
      else if (reviews.find((r) => r.id === id)?.tripSlug !== t) errors.push(`${t}: review "${id}" belongs to another trip`);
    }
    const ids = new Set<string>();
    let prevDay = 0;
    let nights = 0;
    for (const w of trip.waypoints) {
      const where = `${t}/${w.id}`;
      if (ids.has(w.id)) errors.push(`${where}: duplicate waypoint id`);
      ids.add(w.id);
      if (w.day < prevDay) errors.push(`${where}: day ${w.day} goes backwards (previous ${prevDay})`);
      prevDay = w.day;
      nights += w.nights;
      if (w.day > trip.durationDays) errors.push(`${where}: day ${w.day} beyond durationDays ${trip.durationDays}`);
      if (!inNepal(w.coords)) errors.push(`${where}: coords outside Nepal`);
      if (w.altitudeM > trip.maxAltitudeM) errors.push(`${where}: altitude ${w.altitudeM} above trip max ${trip.maxAltitudeM}`);
      const seenHere = new Set<string>();
      for (const s of w.sightings) {
        checkSighting(where, s);
        if (seenHere.has(s.speciesId)) errors.push(`${where}: duplicate sighting "${s.speciesId}"`);
        seenHere.add(s.speciesId);
      }
      if (w.sightings.length < 6) warnings.push(`${where}: only ${w.sightings.length} sightings`);
      checkMedia(where, w.media, 1, 3);
    }
    if (nights > trip.durationDays) errors.push(`${t}: ${nights} nights exceed durationDays ${trip.durationDays}`);
    const top = Math.max(...trip.waypoints.map((w) => w.altitudeM));
    if (top !== trip.maxAltitudeM) warnings.push(`${t}: maxAltitudeM ${trip.maxAltitudeM} differs from highest waypoint ${top}`);
    (trip.route ?? []).forEach((p, i) => {
      if (!inNepal(p)) errors.push(`${t}.route[${i}]: outside Nepal`);
    });
  }

  for (const l of landmarks) {
    const where = `landmark/${l.id}`;
    if (!inNepal(l.coords)) errors.push(`${where}: coords outside Nepal`);
    checkMedia(where, l.media, 2, 4);
    for (const s of l.sightings ?? []) checkSighting(where, s);
    for (const slug of l.nearbyTripSlugs ?? []) if (!tripSlugs.has(slug)) errors.push(`${where}: unknown nearbyTripSlug "${slug}"`);
    if (l.kind === "peak" && !l.elevationM) errors.push(`${where}: peak without elevation`);
    if (l.range && !landmarks.some((r) => r.kind === "range" && r.name.startsWith(l.range!)) && l.range !== "Mahabharat Range") {
      warnings.push(`${where}: range "${l.range}" has no range landmark`);
    }
  }

  const memoryIds = new Set<string>();
  for (const m of memories) {
    const where = `memory/${m.id}`;
    if (memoryIds.has(m.id)) errors.push(`${where}: duplicate id`);
    memoryIds.add(m.id);
    const trip = trips.find((t) => t.slug === m.tripSlug);
    if (!trip) {
      errors.push(`${where}: unknown tripSlug "${m.tripSlug}"`);
      continue;
    }
    const wp = m.waypointId ? trip.waypoints.find((w) => w.id === m.waypointId) : undefined;
    if (m.waypointId && !wp) errors.push(`${where}: unknown waypointId "${m.waypointId}" in ${m.tripSlug}`);
    if (!DATE_RE.test(m.date)) errors.push(`${where}: date "${m.date}" malformed`);
    if (m.seen.length < 2 || m.seen.length > 8) warnings.push(`${where}: ${m.seen.length} seen species (expected 2-8)`);
    const month = Number(m.date.slice(5, 7));
    for (const id of m.seen) {
      usedSpecies.add(id);
      if (!speciesIds.has(id)) errors.push(`${where}: unknown seen speciesId "${id}"`);
      if (wp) {
        const s = wp.sightings.find((x) => x.speciesId === id);
        if (!s) warnings.push(`${where}: "${id}" is not on the ${wp.id} checklist`);
        else if (s.months && !s.months.includes(month as never)) warnings.push(`${where}: "${id}" not expected in month ${month} at ${wp.id}`);
      }
    }
    if (m.reviewId) {
      const r = reviews.find((x) => x.id === m.reviewId);
      if (!r) errors.push(`${where}: unknown reviewId "${m.reviewId}"`);
      else if (r.tripSlug !== m.tripSlug) errors.push(`${where}: review belongs to another trip`);
    }
    if (m.story.length < 2 || m.story.length > 3) warnings.push(`${where}: ${m.story.length} story paragraphs (expected 2-3)`);
    checkMedia(where, m.media, 2, 4);
  }
  for (const trip of trips) {
    const n = memories.filter((m) => m.tripSlug === trip.slug).length;
    if (n < 2) warnings.push(`${trip.slug}: only ${n} memories`);
  }

  for (const r of reviews) {
    const source: Review["source"] = r.source;
    if (source.url) errors.push(`review/${r.id}: placeholder review must not have a source URL`);
    if (source.name !== "Direct") errors.push(`review/${r.id}: placeholder review source must be "Direct"`);
    if (!r.author.startsWith("Placeholder")) errors.push(`review/${r.id}: author must be a placeholder`);
    if (r.tripSlug && !tripSlugs.has(r.tripSlug)) errors.push(`review/${r.id}: unknown tripSlug`);
    checkMedia(`review/${r.id}`, r.media, 1, 2);
  }

  for (const s of species) {
    if (!usedSpecies.has(s.id)) warnings.push(`species "${s.id}" is never referenced`);
    if ("iucn" in s) errors.push(`species "${s.id}": iucn is not part of the content model`);
  }

  return { errors, warnings };
}
