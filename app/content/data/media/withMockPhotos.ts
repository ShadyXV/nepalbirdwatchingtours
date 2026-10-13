/**
 * MOCK-UP LAYER: swaps placeholder images in seed content for Krishna's real photos (tagged by a cheap
 * visual pass), picked to fit what each media item shows: a bird sighting gets a bird photo, a peak
 * gets a mountain, a moment with guests gets people. Deterministic, so the same slot always gets the
 * same photo. Remove this layer in the real content pass, when media carries real sources.
 */
import type { ImageAsset, MediaAsset, SpeciesGroup } from "../../types";
import { landmarks } from "../catalog/landmarks";
import { species } from "../catalog/species";
import { mockPhotos } from "./mock";

type Pool = "bird" | "mammal" | "reptile" | "mountain" | "landscape" | "people";

const PLACEHOLDER = /^\/media\/placeholder/;

// Widen the generated literal types so pools can be filtered by any category name.
const usable: { category: string; quality: string | null; src: string; width: number; height: number }[] =
  mockPhotos.filter((p) => p.quality !== "dark");
type MockPhoto = (typeof usable)[number];

const pools: Record<Pool, MockPhoto[]> = {
  bird: usable.filter((p) => p.category === "bird"),
  mammal: usable.filter((p) => p.category === "mammal"),
  reptile: usable.filter((p) => p.category === "reptile"),
  mountain: usable.filter((p) => p.category === "mountain"),
  landscape: usable.filter((p) => p.category === "landscape" || p.category === "culture"),
  people: usable.filter((p) => p.category === "people"),
};
const FALLBACK: Record<Pool, Pool[]> = {
  bird: ["landscape"],
  mammal: ["landscape"],
  reptile: ["mammal", "landscape"],
  mountain: ["landscape"],
  landscape: ["mountain"],
  people: ["landscape"],
};

const groupOf = new Map(species.map((s) => [s.id, s.group]));
const landmarkKind = new Map(landmarks.map((l) => [l.id, l.kind]));

function poolForGroup(group: SpeciesGroup | undefined): Pool {
  if (group === "bird") return "bird";
  if (group === "mammal") return "mammal";
  if (group === "reptile" || group === "amphibian") return "reptile";
  return "landscape";
}

function poolFor(image: ImageAsset): Pool {
  const subject = image.observation?.speciesIds?.[0];
  if (subject) return poolForGroup(groupOf.get(subject));
  const kind = image.observation?.landmarkId ? landmarkKind.get(image.observation.landmarkId) : undefined;
  if (kind === "peak" || kind === "range") return "mountain";
  if (/\b(guests?|group|trekkers?|krishna|portrait)\b/i.test(image.alt)) return "people";
  return "landscape";
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function pick(pool: Pool, key: string): MockPhoto | undefined {
  for (const name of [pool, ...FALLBACK[pool]]) {
    const list = pools[name];
    if (list.length) return list[hash(key) % list.length];
  }
  return undefined;
}

function swapImage(image: ImageAsset): ImageAsset {
  if (!PLACEHOLDER.test(image.src)) return image;
  const photo = pick(poolFor(image), image.alt);
  return photo ? { ...image, src: photo.src, width: photo.width, height: photo.height } : image;
}

function swapPoster(poster: string, alt: string): string {
  if (!PLACEHOLDER.test(poster)) return poster;
  return pick("landscape", alt)?.src ?? poster;
}

function isMedia(value: unknown): value is MediaAsset {
  return typeof value === "object" && value !== null && ((value as MediaAsset).kind === "image" || (value as MediaAsset).kind === "video");
}

/** Deep-copies `value`, replacing placeholder media with mock photos. */
export function withMockPhotos<T>(value: T): T {
  if (Array.isArray(value)) return value.map(withMockPhotos) as T;
  if (isMedia(value)) {
    return (value.kind === "image" ? swapImage(value) : { ...value, poster: swapPoster(value.poster, value.alt) }) as T;
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withMockPhotos(v)])) as T;
  }
  return value;
}
