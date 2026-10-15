import type { ImageAsset, Region } from "../types";

/**
 * Birding regions. Order = display order on the trips listing. Trips join a region through
 * `Trip.regionSlug`; a region with no published trips stays hidden (no map pin, no page).
 * Copy is placeholder until Krishna writes his own.
 */

const cover = (src: string, alt: string): ImageAsset => ({ kind: "image", src, alt });

export const regions: Region[] = [
  {
    slug: "kathmandu",
    name: "Kathmandu Valley",
    tagline: "TODO",
    coords: [85.32, 27.7],
    body: ["TODO"],
    cover: cover("/media/placeholder-forest.svg", "TODO"),
    landmarkIds: ["kathmandu", "phulchowki", "shivapuri-nagarjun-national-park"],
  },
  {
    slug: "pokhara",
    name: "Pokhara",
    tagline: "TODO",
    coords: [83.98, 28.21],
    body: ["TODO"],
    cover: cover("/media/placeholder-ridge.svg", "TODO"),
    landmarkIds: ["pokhara", "phewa-lake", "begnas-lake", "sarangkot"],
  },
  {
    slug: "annapurna",
    name: "Annapurna",
    tagline: "TODO",
    coords: [83.85, 28.45],
    body: ["TODO"],
    cover: cover("/media/placeholder-snow.svg", "TODO"),
    landmarkIds: ["annapurna-conservation-area", "annapurna-himal", "annapurna-south", "machhapuchhre"],
  },
  {
    slug: "langtang",
    name: "Langtang",
    tagline: "TODO",
    coords: [85.45, 28.15],
    body: ["TODO"],
    cover: cover("/media/placeholder-snow.svg", "TODO"),
    landmarkIds: ["langtang-national-park", "langtang-himal", "langtang-lirung", "gosaikunda"],
  },
  {
    slug: "chitwan",
    name: "Chitwan National Park",
    tagline: "TODO",
    coords: [84.35, 27.55],
    body: ["TODO"],
    cover: cover("/media/placeholder-forest.svg", "TODO"),
    landmarkIds: ["chitwan-national-park"],
  },
  {
    slug: "bardia",
    name: "Bardia National Park",
    tagline: "TODO",
    coords: [81.35, 28.42],
    body: ["TODO"],
    cover: cover("/media/placeholder-forest.svg", "TODO"),
    landmarkIds: ["bardia-national-park", "karnali-river-bardia"],
  },
  {
    // Owner's voice note said "Situ National Park"; Sagarmatha is a guess to confirm.
    slug: "sagarmatha",
    name: "Sagarmatha (Everest)",
    tagline: "TODO",
    coords: [86.75, 27.9],
    body: ["TODO"],
    cover: cover("/media/placeholder-snow.svg", "TODO"),
    landmarkIds: ["everest", "mahalangur-himal"],
  },
  {
    slug: "far-west",
    name: "Far West",
    tagline: "TODO",
    coords: [81.0, 29.3],
    body: ["TODO"],
    cover: cover("/media/placeholder-ridge.svg", "TODO"),
    landmarkIds: ["rara-lake"],
  },
  {
    slug: "far-east",
    name: "Far East",
    tagline: "TODO",
    coords: [87.95, 27.0],
    body: ["TODO"],
    cover: cover("/media/placeholder-forest.svg", "TODO"),
    landmarkIds: ["ilam-red-panda-forest", "koshi-tappu-wildlife-reserve", "kanchenjunga-himal"],
  },
];
