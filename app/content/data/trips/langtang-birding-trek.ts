import type {
  ImageAsset,
  Likelihood,
  LngLat,
  Month,
  Observation,
  Sighting,
  Trip,
  VideoAsset,
} from "~/content/types";

/* Itinerary, highlights and inclusions are Krishna's own copy. Geography, altitudes and species are
   real; photos, clips and stay details are stand-ins for his own. */

const PH = {
  plain: "/media/placeholder.svg",
  forest: "/media/placeholder-forest.svg",
  ridge: "/media/placeholder-ridge.svg",
  snow: "/media/placeholder-snow.svg",
} as const;

const img = (src: string, alt: string, observation: Observation, focal?: [number, number]): ImageAsset => ({
  kind: "image",
  src,
  alt,
  observation,
  ...(focal ? { focal } : {}),
});

const clip = (poster: string, alt: string, observation: Observation, durationSec: number): VideoAsset => ({
  kind: "video",
  sources: [{ host: "uploadthing", src: "https://example.invalid/placeholder.mp4" }],
  poster,
  alt,
  observation,
  durationSec,
  ambient: true,
});

/** Same likelihood for a list of species ids. */
const seen = (likelihood: Likelihood, ids: string[], months?: Month[]): Sighting[] =>
  ids.map((speciesId) => ({ speciesId, likelihood, ...(months ? { months } : {}) }));

const one = (speciesId: string, likelihood: Likelihood, months?: Month[], note?: string): Sighting => ({
  speciesId,
  likelihood,
  ...(months ? { months } : {}),
  ...(note ? { note } : {}),
});


const WINTER: Month[] = [11, 12, 1, 2, 3];
const SUMMER_HIGH: Month[] = [4, 5, 6, 7, 8, 9, 10];

/** Approximate line: Kathmandu to Syabrubesi by road, up the Langtang Khola to Kyanjin Gompa and
    Kyanjin Ri, and the same way back. */
const road: LngLat[] = [
  [85.31230, 27.71540],
  [85.28000, 27.76000],
  [85.25000, 27.80000],
  [85.17000, 27.88000],
  [85.16000, 27.93000],
  [85.19000, 27.98000],
  [85.22000, 28.03000],
  [85.26000, 28.08000],
  [85.29920, 28.11140],
  [85.32000, 28.14000],
  [85.34360, 28.16170],
];
const trail: LngLat[] = [
  [85.36500, 28.16300],
  [85.39050, 28.16040],
  [85.41000, 28.16200],
  [85.43050, 28.16250],
  [85.45000, 28.17500],
  [85.46700, 28.19000],
  [85.48500, 28.20500],
  [85.50500, 28.21300],
  [85.53000, 28.21300],
  [85.56160, 28.21120],
  [85.55850, 28.22650],
];
const route: LngLat[] = [...road, ...trail, ...trail.slice(0, -1).reverse(), ...[...road].reverse()];

const kathmanduSightings: Sighting[] = [
  ...seen("common", ["black-kite", "large-billed-crow", "common-myna", "oriental-magpie-robin", "red-vented-bulbul", "spotted-dove"]),
  ...seen("likely", ["himalayan-bulbul", "eurasian-kestrel", "grey-wagtail"]),
  one("egyptian-vulture", "possible"),
];

const syabrubesiSightings: Sighting[] = [
  ...seen("common", ["plumbeous-water-redstart", "grey-treepie", "himalayan-bulbul", "blue-whistling-thrush", "oriental-white-eye", "great-barbet"]),
  ...seen("likely", ["brown-dipper", "spotted-forktail", "slaty-headed-parakeet", "verditer-flycatcher", "black-bulbul"]),
  ...seen("possible", ["crested-kingfisher", "himalayan-goral"]),
  one("white-capped-redstart", "likely", WINTER),
  one("wallcreeper", "possible", WINTER, "On the cliffs by the river in winter"),
];

const lamaHotelSightings: Sighting[] = [
  ...seen("common", ["rufous-sibia", "whiskered-yuhina", "green-backed-tit", "blue-winged-minla", "chestnut-crowned-laughingthrush"]),
  ...seen("likely", ["rufous-bellied-niltava", "large-niltava", "darjeeling-woodpecker", "rufous-bellied-woodpecker", "long-tailed-minivet", "scarlet-minivet", "kalij-pheasant", "golden-breasted-fulvetta", "yellow-billed-blue-magpie", "himalayan-langur"]),
  ...seen("possible", ["koklass-pheasant", "himalayan-goral", "yellow-throated-marten"]),
  one("red-panda", "possible", undefined, "In the bamboo and fir above the river"),
  one("satyr-tragopan", "rare"),
  one("himalayan-black-bear", "rare"),
  one("rhododendron-arboreum", "common", [3, 4]),
];

export const trip = {
  slug: "langtang-birding-trek",
  title: "Langtang Birdwatching Trek",
  tagline: "From a deep forest gorge to the yak pastures below Langtang Lirung, a short drive from Kathmandu.",
  kind: "birding-trek",
  guideRole: "lead-guide",
  region: "Langtang National Park",
  regionSlug: "langtang",
  durationDays: 10,
  difficulty: "moderate",
  maxAltitudeM: 4773,
  bestMonths: [3, 4, 5, 10, 11],
  summary:
    "Langtang National Park, the closest Himalayan national park to Kathmandu, offers superb birding through dense forest, glacial valleys, and high alpine pasture, all within a manageable 10-day itinerary.",
  highlights: [
    "Only a short drive from Kathmandu to the trailhead",
    "Forest zones rich in pheasants, laughingthrushes, and Himalayan specialties",
    "Dramatic glacial valley scenery beneath Langtang Lirung",
    "Combines trekking and dedicated birding activities",
  ],
  cover: img(
    PH.snow,
    "Wide shot: Langtang Lirung above the yak pastures and stone walls of Kyanjin Gompa in clear morning light",
    { landmarkId: "langtang-lirung", place: "Kyanjin Gompa, Langtang", altitudeM: 3870, date: "2025-10", note: "clear morning, 07:30" },
    [0.5, 0.35],
  ),
  reel: [
    clip(
      PH.snow,
      "Clip, 16 s: slow pan across the upper Langtang valley from Kyanjin Ri, glaciers and Langtang Lirung, choughs drifting below",
      { landmarkId: "langtang-lirung", place: "Kyanjin Ri, Langtang", altitudeM: 4773, date: "2025-10", note: "midmorning, clear" },
      16,
    ),
    img(
      PH.forest,
      "Landscape: Rufous-bellied Niltava on a mossy branch in the forest near Lama Hotel, deep blue and orange",
      { speciesIds: ["rufous-bellied-niltava"], place: "Lama Hotel, Langtang", altitudeM: 2470, date: "2026-04", note: "male in the understorey, 07:15" },
      [0.5, 0.5],
    ),
    img(
      PH.forest,
      "Close, landscape crop: Ibisbill on the shingle of the Langtang Khola near Kyanjin, curved red bill and grey body",
      { speciesIds: ["ibisbill"], place: "Kyanjin Gompa, Langtang", altitudeM: 3850, date: "2025-11", note: "feeding among stones, 09:00" },
      [0.5, 0.5],
    ),
    img(
      PH.ridge,
      "Wide shot: the rebuilt Langtang village under the glacial valley walls, prayer flags and stone houses",
      { landmarkId: "langtang-national-park", place: "Langtang village", altitudeM: 3430, date: "2025-10", note: "afternoon light" },
      [0.5, 0.45],
    ),
    img(
      PH.plain,
      "Landscape: Krishna and guests with binoculars on the trail above Ghoda Tabela, a Himalayan Griffon overhead",
      { speciesIds: ["himalayan-griffon"], place: "Ghoda Tabela, Langtang", altitudeM: 3030, date: "2025-10", note: "group watching a griffon, 11:00" },
      [0.5, 0.5],
    ),
  ],
  waypoints: [
    {
      id: "kathmandu",
      transit: true,
      name: "Kathmandu",
      kind: "town",
      coords: [85.3123, 27.7154],
      altitudeM: 1400,
      day: 1,
      nights: 1,
      stay: { kind: "hotel", note: "Hotel in Kathmandu" },
      habitat: ["city gardens", "temple trees"],
      summary: "Airport pickup, hotel check-in and the trip briefing.",
      sightings: kathmanduSightings,
      media: [
        img(PH.plain, "Landscape: Black Kites circling over Kathmandu rooftops and temple spires in the late afternoon", { speciesIds: ["black-kite"], landmarkId: "kathmandu", place: "Kathmandu", altitudeM: 1400, date: "2025-10", note: "kites over the old town, 16:30" }),
      ],
    },
    {
      id: "syabrubesi",
      name: "Syabrubesi",
      kind: "village",
      coords: [85.3436, 28.1617],
      altitudeM: 1460,
      day: 2,
      nights: 1,
      stay: { kind: "lodge", note: "Lodge in the trailhead village by the river" },
      habitat: ["river", "cliffs", "village gardens"],
      summary: "A scenic drive (7–8 hours) to the trailhead village of Syabrubesi.",
      sightings: syabrubesiSightings,
      media: [
        img(PH.forest, "Landscape: Plumbeous Water Redstart fanning its rusty tail on a boulder in the Bhote Koshi at Syabrubesi", { speciesIds: ["plumbeous-water-redstart"], place: "Syabrubesi, Langtang", altitudeM: 1460, date: "2025-10", note: "on a river rock, 16:00" }),
      ],
    },
    {
      id: "bamboo",
      name: "Bamboo",
      kind: "forest",
      coords: [85.3905, 28.1604],
      altitudeM: 1970,
      day: 3,
      nights: 0,
      habitat: ["subtropical forest", "river gorge", "bamboo"],
      summary: "Through the warm lower gorge of the Langtang Khola, where forktails work the stream and mixed flocks move through the trees.",
      sightings: [
        ...seen("common", ["black-bulbul", "grey-hooded-warbler", "whiskered-yuhina", "rufous-sibia"]),
        ...seen("likely", ["scarlet-minivet", "long-tailed-minivet", "rufous-bellied-niltava", "large-niltava", "greater-yellownape", "spotted-forktail", "little-forktail", "assamese-macaque", "himalayan-langur"]),
        ...seen("possible", ["red-headed-trogon", "yellow-throated-marten"]),
      ],
      media: [
        img(PH.forest, "Wide shot: the trail through bamboo and broadleaf forest above the rushing Langtang Khola at Bamboo", { place: "Bamboo, Langtang", altitudeM: 1970, date: "2025-10", note: "morning in the gorge" }),
      ],
    },
    {
      id: "lama-hotel",
      key: true,
      name: "Lama Hotel",
      kind: "village",
      coords: [85.4305, 28.1625],
      altitudeM: 2470,
      day: 3,
      nights: 1,
      stay: { kind: "teahouse", note: "Teahouse in a forest clearing by the river" },
      habitat: ["temperate forest", "oak–rhododendron forest", "river"],
      summary:
        "A trek through dense subtropical and temperate forest, one of the best birding stretches of the trek, watching for minivets, niltavas and woodpeckers.",
      sightings: lamaHotelSightings,
      media: [
        img(PH.forest, "Landscape: oak–rhododendron forest above Lama Hotel in mist, moss on every branch", { landmarkId: "langtang-national-park", place: "Lama Hotel, Langtang", altitudeM: 2470, date: "2025-10", note: "mossy forest, 07:00" }),
        img(PH.forest, "Close: Darjeeling Woodpecker on a mossy oak trunk near Lama Hotel, yellow neck patch", { speciesIds: ["darjeeling-woodpecker"], place: "Lama Hotel, Langtang", altitudeM: 2470, date: "2026-04", note: "foraging, 08:10" }),
      ],
    },
    {
      id: "ghoda-tabela",
      name: "Ghoda Tabela",
      kind: "forest",
      coords: [85.467, 28.19],
      altitudeM: 3030,
      day: 4,
      nights: 0,
      habitat: ["open fir forest", "meadow", "cliffs"],
      summary: "The forest opens out at Ghoda Tabela, and the first views of Langtang Lirung appear up the valley.",
      sightings: [
        ...seen("common", ["rufous-vented-tit", "grey-crested-tit", "white-browed-fulvetta", "spotted-nutcracker"]),
        ...seen("likely", ["himalayan-monal", "white-collared-blackbird", "himalayan-griffon", "lammergeier", "himalayan-goral"]),
        ...seen("possible", ["blood-pheasant", "himalayan-tahr"]),
        one("red-panda", "rare"),
      ],
      media: [
        img(PH.ridge, "Wide shot: Langtang Lirung appearing above the fir forest at Ghoda Tabela, meadow in the foreground", { landmarkId: "langtang-lirung", place: "Ghoda Tabela, Langtang", altitudeM: 3030, date: "2025-10", note: "first view, 11:30" }),
      ],
    },
    {
      id: "langtang-village",
      key: true,
      name: "Langtang Village",
      kind: "village",
      coords: [85.505, 28.213],
      altitudeM: 3430,
      day: 4,
      nights: 1,
      stay: { kind: "teahouse", note: "Family teahouse in the rebuilt village" },
      habitat: ["alpine shrubland", "yak pastures", "stone-walled fields"],
      summary:
        "We continue upward through forest transitioning to alpine shrubland, with views of Langtang Lirung opening up, to Langtang village.",
      sightings: [
        ...seen("common", ["rufous-breasted-accentor", "large-billed-crow", "yellow-billed-chough", "red-billed-chough"]),
        ...seen("likely", ["himalayan-white-browed-rosefinch", "dark-breasted-rosefinch", "lammergeier", "himalayan-griffon", "himalayan-tahr"]),
        one("grey-backed-shrike", "likely", SUMMER_HIGH),
        one("white-capped-redstart", "likely", SUMMER_HIGH),
        one("common-rosefinch", "likely", [5, 6, 7, 8, 9]),
        one("hodgsons-redstart", "possible", WINTER),
        one("snow-pigeon", "possible"),
      ],
      media: [
        img(PH.plain, "Landscape: Grey-backed Shrike on a stone wall at Langtang village, yak pasture and valley walls behind", { speciesIds: ["grey-backed-shrike"], place: "Langtang village", altitudeM: 3430, date: "2025-10", note: "on the wall, 15:30" }),
      ],
    },
    {
      id: "kyanjin-gompa",
      key: true,
      name: "Kyanjin Gompa",
      kind: "village",
      coords: [85.5616, 28.2112],
      altitudeM: 3870,
      day: 5,
      nights: 2,
      stay: { kind: "teahouse", note: "Teahouse by the monastery and cheese factory; two nights" },
      habitat: ["alpine pasture", "glacial river flats", "moraine"],
      summary:
        "A shorter trekking day reaching Kyanjin Gompa, with time to explore high-altitude habitat for snow pigeons and alpine species.",
      sightings: [
        ...seen("common", ["yellow-billed-chough", "red-billed-chough", "rufous-breasted-accentor", "plain-mountain-finch"]),
        ...seen("likely", ["snow-pigeon", "robin-accentor", "white-winged-redstart", "himalayan-white-browed-rosefinch", "lammergeier", "himalayan-griffon", "brown-dipper", "himalayan-tahr"]),
        ...seen("possible", ["himalayan-snowcock", "golden-eagle", "large-eared-pika"]),
        one("ibisbill", "possible", undefined, "On the shingle of the river flats"),
        one("alpine-accentor", "likely", WINTER),
        one("grandala", "possible", WINTER),
      ],
      media: [
        img(PH.snow, "Wide shot: Kyanjin Gompa monastery and lodges under Langtang Lirung, yaks grazing on the flats", { landmarkId: "langtang-lirung", place: "Kyanjin Gompa, Langtang", altitudeM: 3870, date: "2025-10", note: "afternoon, 15:00" }),
        img(PH.ridge, "Landscape: a flock of Snow Pigeons wheeling over the river flats at Kyanjin", { speciesIds: ["snow-pigeon"], place: "Kyanjin Gompa, Langtang", altitudeM: 3870, date: "2025-11", note: "flock in flight, 08:20" }),
      ],
    },
    {
      id: "kyanjin-ri",
      key: true,
      name: "Kyanjin Ri",
      kind: "viewpoint",
      coords: [85.5585, 28.2265],
      altitudeM: 4773,
      day: 6,
      nights: 0,
      habitat: ["scree", "alpine meadow", "rock ridge"],
      summary:
        "An optional hike up Kyanjin Ri (4,773 m) for panoramic Himalayan views and high-altitude birding, or a rest day in the valley.",
      sightings: [
        ...seen("likely", ["snow-pigeon", "yellow-billed-chough", "lammergeier", "himalayan-griffon"]),
        ...seen("possible", ["himalayan-snowcock", "golden-eagle", "wallcreeper", "white-winged-redstart", "large-eared-pika", "blue-sheep"]),
        one("alpine-accentor", "likely", WINTER),
        one("grandala", "possible", WINTER),
      ],
      media: [
        img(PH.snow, "Wide shot: Langtang Lirung and its glaciers from the prayer flags on Kyanjin Ri, the valley far below", { landmarkId: "langtang-lirung", place: "Kyanjin Ri, Langtang", altitudeM: 4773, date: "2025-10", note: "summit, 09:00" }),
      ],
      views: ["langtang-lirung", "langtang-himal"],
    },
    {
      id: "lama-hotel-return",
      name: "Lama Hotel",
      kind: "village",
      coords: [85.4305, 28.1625],
      altitudeM: 2470,
      day: 7,
      nights: 1,
      stay: { kind: "teahouse", note: "Back at the Lama Hotel teahouse" },
      habitat: ["temperate forest", "oak–rhododendron forest", "river"],
      summary: "We descend back through the forest zones, birding en route in daylight for full coverage.",
      sightings: lamaHotelSightings,
      media: [
        img(PH.forest, "Landscape: Chestnut-crowned Laughingthrush in the undergrowth near Lama Hotel, late afternoon light", { speciesIds: ["chestnut-crowned-laughingthrush"], place: "Lama Hotel, Langtang", altitudeM: 2470, date: "2025-10", note: "pair at the trail edge, 16:00" }),
      ],
    },
    {
      id: "syabrubesi-return",
      name: "Syabrubesi",
      kind: "village",
      coords: [85.3436, 28.1617],
      altitudeM: 1460,
      day: 8,
      nights: 1,
      stay: { kind: "lodge", note: "Lodge in the trailhead village" },
      habitat: ["river", "cliffs", "village gardens"],
      summary: "The final descent to the trailhead village.",
      sightings: syabrubesiSightings,
      media: [
        img(PH.forest, "Landscape: Brown Dipper bobbing on a boulder in the river at Syabrubesi, spray behind", { speciesIds: ["brown-dipper"], place: "Syabrubesi, Langtang", altitudeM: 1460, date: "2025-11", note: "on a midstream rock, 15:30" }),
      ],
    },
    {
      id: "kathmandu-return",
      transit: true,
      name: "Kathmandu",
      kind: "town",
      coords: [85.3123, 27.7154],
      altitudeM: 1400,
      day: 9,
      nights: 1,
      stay: { kind: "hotel", note: "Hotel in Kathmandu" },
      habitat: ["city gardens"],
      summary: "The return drive to Kathmandu, and a free evening.",
      sightings: kathmanduSightings,
      media: [
        img(PH.plain, "Landscape: Kathmandu rooftops at dusk from a hotel terrace, kites settling to roost", { speciesIds: ["black-kite"], landmarkId: "kathmandu", place: "Kathmandu", altitudeM: 1400, date: "2025-10", note: "dusk, 17:40" }),
      ],
    },
    {
      id: "kathmandu-departure",
      transit: true,
      name: "Kathmandu",
      kind: "town",
      coords: [85.3123, 27.7154],
      altitudeM: 1400,
      day: 10,
      nights: 0,
      stay: { kind: "none", note: "Departure transfer to the airport" },
      habitat: ["city gardens"],
      summary: "Final breakfast and the departure transfer.",
      sightings: kathmanduSightings,
      media: [
        img(PH.plain, "Landscape: Oriental Magpie-Robin singing from a hotel garden wall in Kathmandu in the early morning", { speciesIds: ["oriental-magpie-robin"], place: "Kathmandu", altitudeM: 1400, date: "2025-10", note: "morning song, 07:00" }),
      ],
    },
  ],
  route,
  landmarkIds: ["langtang-national-park", "langtang-himal", "langtang-lirung", "kathmandu"],
  reviewIds: [],
  includes: [
    "Kathmandu–Syabrubesi transport",
    "Teahouse accommodation during trek",
    "All meals during the trek",
    "Langtang National Park permit and TIMS card",
    "Expert trekking and birding guide, porter support",
  ],
  excludes: ["International flights and visa", "Personal trekking gear", "Tips and personal expenses"],
  status: "published",
} satisfies Trip;
