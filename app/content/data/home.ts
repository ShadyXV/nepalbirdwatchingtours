import type { HomeWay, MediaAsset } from "../types";

/*
 * Home page media. Mock-up photos for now (public/media/mock); swap in Krishna's own when ready.
 * Titles and text for these live in app/i18n/en.ts (home.services, home.contact).
 */

/** The three main ways to go birding with Krishna, in order. */
export const homeWays: HomeWay[] = [
  {
    id: "lead",
    href: "/trips",
    image: {
      kind: "image",
      src: "/media/mock/people_birdwatching-group_landscape_046.jpg",
      alt: "A small group of birders on a red dirt trail, binoculars raised towards the trees",
      width: 4608,
      height: 3456,
      focal: [0.5, 0.55],
    },
  },
  {
    id: "day",
    href: "/trips?kind=day-tour",
    image: {
      kind: "image",
      src: "/media/mock/bird_sunbird_landscape_010.jpg",
      alt: "A red sunbird feeding among pink and yellow blossoms",
      width: 4520,
      height: 3389,
      focal: [0.5, 0.45],
    },
  },
  {
    id: "trek",
    href: "/anywhere#trekking-group-naturalist",
    image: {
      kind: "image",
      src: "/media/mock/mountain_annapurna-viewpoint_landscape_030.jpg",
      alt: "Trekkers on a rocky ledge below snow-capped Himalayan peaks under a blue sky",
      width: 4928,
      height: 3264,
      focal: [0.5, 0.6],
    },
  },
];

/**
 * The full-width band behind "Ask Krishna anything". Any MediaAsset: an image now; a VideoAsset
 * (with its poster) can replace it later without touching the page.
 */
export const contactBanner: MediaAsset = {
  kind: "image",
  src: "/media/mock/people_trekkers-silhouette-sunrise_landscape_022.jpg",
  alt: "Trekkers silhouetted on a grassy ridge at golden sunrise",
  width: 5773,
  height: 4330,
  focal: [0.5, 0.55],
};
