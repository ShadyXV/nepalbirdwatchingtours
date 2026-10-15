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


const WINTER: Month[] = [11, 12, 1, 2];
const COOL_SEASON: Month[] = [10, 11, 12, 1, 2, 3];
const SPRING: Month[] = [3, 4, 5];

/** Approximate line: Nepalgunj up the highway to Thakurdwara, then the day loops into the park and
    back to the lodge. Kathmandu is joined by the flights. */
const route: LngLat[] = [
  [81.66690, 28.10360],
  [81.60000, 28.18000],
  [81.52000, 28.27000],
  [81.45000, 28.33000],
  [81.39000, 28.37000],
  [81.33600, 28.39800],
  [81.36000, 28.41500],
  [81.38500, 28.43000],
  [81.36000, 28.41500],
  [81.33600, 28.39800],
  [81.31000, 28.42500],
  [81.29000, 28.45000],
  [81.31000, 28.42500],
  [81.33600, 28.39800],
  [81.38000, 28.44000],
  [81.43000, 28.46000],
  [81.38000, 28.44000],
  [81.33600, 28.39800],
  [81.31500, 28.41500],
  [81.33600, 28.39800],
  [81.33000, 28.38500],
  [81.33600, 28.39800],
  [81.39000, 28.37000],
  [81.45000, 28.33000],
  [81.52000, 28.27000],
  [81.60000, 28.18000],
  [81.66690, 28.10360],
];

const kathmanduSightings: Sighting[] = [
  ...seen("common", ["black-kite", "large-billed-crow", "common-myna", "oriental-magpie-robin", "red-vented-bulbul", "spotted-dove"]),
  ...seen("likely", ["himalayan-bulbul", "eurasian-kestrel", "grey-wagtail"]),
  one("egyptian-vulture", "possible"),
];

const nepalgunjSightings: Sighting[] = [
  ...seen("common", ["black-kite", "cattle-egret", "asian-pied-starling", "common-myna", "indian-pond-heron", "black-drongo", "red-wattled-lapwing"]),
  ...seen("likely", ["indian-roller", "spotted-owlet", "green-bee-eater", "long-tailed-shrike"]),
];

export const trip = {
  slug: "bardiya-wildlife-safari",
  title: "Bardiya Wildlife Safari and Birdwatching",
  tagline: "Four full days in Bardiya's tiger country, timed around the best light at dawn and dusk.",
  kind: "wildlife-safari",
  guideRole: "lead-guide",
  region: "Bardiya National Park",
  durationDays: 9,
  difficulty: "easy",
  maxAltitudeM: 1400,
  bestMonths: [2, 3, 4, 5, 10, 11],
  summary:
    "Bardiya National Park, the largest national park in Nepal's lowlands and the least crowded, has one of the highest tiger densities in South Asia. This 9-day photography-focused tour is built around maximizing your chances of photographing wild Bengal tigers, alongside rhinos, elephants, and outstanding birdlife.",
  highlights: [
    "Extended multi-day jeep safaris in Bardiya's core tiger habitat",
    "Guided by naturalists experienced in wildlife photography logistics (positioning, light, patience protocols)",
    "River activities for gharial crocodiles and riverine birds",
    "Far fewer tourists than Chitwan, meaning quieter, more natural sightings",
  ],
  cover: img(
    PH.forest,
    "Wide shot: Bengal Tiger walking along a sandy river bank in Bardiya at first light, tall grass and sal forest behind",
    { speciesIds: ["bengal-tiger"], place: "Karnali River, Bardiya", altitudeM: 155, date: "2026-04", note: "crossing the bank, 06:40" },
    [0.5, 0.5],
  ),
  reel: [
    clip(
      PH.forest,
      "Clip, 16 s: Bengal Tiger stepping out of tall grass onto a track and pausing to look back, dust in the low sun",
      { speciesIds: ["bengal-tiger"], place: "Bardiya National Park", altitudeM: 180, date: "2026-04", note: "evening drive, 17:30" },
      16,
    ),
    img(
      PH.plain,
      "Wide shot: raft drifting down the Karnali (Geruwa) at dawn, mist on the water and a forested bank",
      { landmarkId: "karnali-river-bardia", place: "Karnali River, Bardiya", altitudeM: 155, date: "2026-02", note: "river float, 07:00" },
      [0.5, 0.5],
    ),
    img(
      PH.plain,
      "Landscape: Gharial basking on a Karnali sandbar, long snout toward the water, river terns nearby",
      { speciesIds: ["gharial", "river-tern"], place: "Karnali River, Bardiya", altitudeM: 155, date: "2026-02", note: "adult on sandbar, 09:30" },
      [0.5, 0.5],
    ),
    img(
      PH.forest,
      "Landscape: wild Asian Elephant bull crossing a grassland clearing in Bardiya, sal forest behind",
      { speciesIds: ["asian-elephant"], landmarkId: "bardia-national-park", place: "Bardiya National Park", altitudeM: 180, date: "2026-03", note: "bull in the open, 16:50" },
      [0.5, 0.5],
    ),
    img(
      PH.forest,
      "Close, landscape crop: Great Slaty Woodpecker on a sal trunk, grey plumage and long bill",
      { speciesIds: ["great-slaty-woodpecker", "sal"], place: "Bardiya National Park", altitudeM: 200, date: "2026-03", note: "family group, 08:15" },
      [0.5, 0.45],
    ),
  ],
  waypoints: [
    {
      id: "kathmandu",
      name: "Kathmandu",
      kind: "town",
      coords: [85.3123, 27.7154],
      altitudeM: 1400,
      day: 1,
      nights: 1,
      stay: { kind: "hotel", note: "Hotel in Kathmandu" },
      habitat: ["city gardens", "temple trees"],
      summary:
        "Airport pickup, hotel check-in, and a photography-focused briefing (gear checklist, safari etiquette, target species).",
      sightings: kathmanduSightings,
      media: [
        img(PH.plain, "Landscape: camera bodies, long lenses and a safari checklist on a hotel table in Kathmandu, evening light", { landmarkId: "kathmandu", place: "Kathmandu", altitudeM: 1400, date: "2026-02", note: "gear check, evening" }),
      ],
    },
    {
      id: "nepalgunj",
      name: "Nepalgunj",
      kind: "town",
      coords: [81.6669, 28.1036],
      altitudeM: 165,
      day: 2,
      nights: 0,
      stay: { kind: "none", note: "Morning flight in from Kathmandu" },
      habitat: ["farmland", "village trees"],
      summary: "A morning flight to Nepalgunj, then the drive to Bardiya National Park.",
      sightings: nepalgunjSightings,
      media: [
        img(PH.plain, "Wide shot: flat Terai farmland from the highway north of Nepalgunj, mustard fields and a line of trees", { place: "Nepalgunj", altitudeM: 165, date: "2026-02", note: "drive to the park, 10:00" }),
      ],
    },
    {
      id: "thakurdwara",
      key: true,
      name: "Thakurdwara",
      kind: "village",
      coords: [81.336, 28.398],
      altitudeM: 170,
      day: 2,
      nights: 6,
      stay: { kind: "lodge", note: "Jungle lodge at the park edge; six nights in the same room" },
      habitat: ["lodge gardens", "buffer-zone forest", "river edge"],
      summary:
        "Our base for six nights at the park's edge. An afternoon walk near the lodge to scout light conditions and river access points.",
      sightings: [
        ...seen("common", ["oriental-magpie-robin", "red-vented-bulbul", "black-drongo", "common-myna", "asian-pied-starling", "coppersmith-barbet", "rufous-treepie", "rose-ringed-parakeet"]),
        ...seen("likely", ["indian-roller", "lineated-barbet", "spotted-owlet", "greater-coucal", "indian-grey-hornbill", "common-hoopoe", "green-bee-eater", "rhesus-macaque"]),
        one("asian-koel", "likely", SPRING),
        one("silk-cotton-tree", "common", [2, 3], "Red flowers full of birds"),
      ],
      media: [
        img(PH.plain, "Landscape: the lodge garden at Thakurdwara in the afternoon, a guest checking settings on a long lens", { place: "Thakurdwara, Bardiya", altitudeM: 170, date: "2026-02", note: "scouting walk, 15:30" }),
        img(PH.forest, "Close: Indian Grey Hornbill on a silk-cotton branch by the lodge, big curved bill against the sky", { speciesIds: ["indian-grey-hornbill", "silk-cotton-tree"], place: "Thakurdwara, Bardiya", altitudeM: 170, date: "2026-03", note: "pair feeding, 07:20" }),
      ],
    },
    {
      id: "phanta-grasslands",
      key: true,
      name: "Bardiya Grasslands",
      kind: "park-gate",
      coords: [81.385, 28.43],
      altitudeM: 180,
      day: 3,
      nights: 0,
      habitat: ["tall grassland (phanta)", "sal forest edge", "waterholes"],
      summary:
        "Four full days of jeep and walking safaris across different zones of the park, timed around dawn and dusk light for photography. We start in the open grasslands, where deer herds graze at first light and tigers hunt the edges.",
      sightings: [
        ...seen("common", ["chital", "wild-boar", "indian-peafowl", "red-junglefowl", "plain-prinia", "black-francolin"]),
        ...seen("likely", ["hog-deer", "swamp-deer", "nilgai", "striated-grassbird", "chestnut-capped-babbler", "crested-serpent-eagle", "northern-plains-gray-langur"]),
        ...seen("possible", ["greater-one-horned-rhinoceros", "asian-elephant"]),
        one("bengal-tiger", "possible", undefined, "Hunting the grassland edges at dawn and dusk"),
        one("bengal-florican", "rare", SPRING, "Display flights over the grass"),
        one("sarus-crane", "rare"),
        one("pied-harrier", "possible", WINTER),
        one("leopard", "rare"),
        one("kans-grass", "common", [10, 11], "Silver plumes in the autumn light"),
      ],
      media: [
        img(PH.forest, "Wide shot: open-top jeep at the edge of a golden grassland at sunrise, a herd of Spotted Deer in the distance", { speciesIds: ["chital"], place: "Bardiya National Park", altitudeM: 180, date: "2026-03", note: "dawn drive, 06:30" }),
        img(PH.forest, "Landscape: Swamp Deer stag with many-pointed antlers in tall wet grass, morning mist", { speciesIds: ["swamp-deer"], place: "Bardiya National Park", altitudeM: 180, date: "2026-02", note: "stag in mist, 07:10" }),
      ],
    },
    {
      id: "karnali-river",
      key: true,
      name: "Karnali River (Geruwa)",
      kind: "river",
      coords: [81.29, 28.45],
      altitudeM: 155,
      day: 4,
      nights: 0,
      habitat: ["river", "sandbars", "riverine forest"],
      summary:
        "A river float on the Geruwa, the eastern channel of the Karnali, for gharial and riverine birds. From the banks we watch the open sand for tigers and elephants crossing in the evening light.",
      sightings: [
        ...seen("common", ["river-lapwing", "river-tern", "great-thick-knee", "pied-kingfisher", "white-throated-kingfisher", "little-cormorant", "great-egret"]),
        ...seen("likely", ["gharial", "mugger-crocodile", "woolly-necked-stork", "oriental-darter", "crested-kingfisher", "asian-openbill"]),
        ...seen("possible", ["ganges-river-dolphin", "smooth-coated-otter", "grey-headed-fish-eagle", "black-necked-stork", "brown-fish-owl", "asian-elephant"]),
        one("bengal-tiger", "possible", undefined, "Crossing the sand in the evening"),
        one("ruddy-shelduck", "likely", WINTER),
        one("common-sandpiper", "likely", COOL_SEASON),
        one("ibisbill", "rare", [12, 1, 2], "Winter visitor to the shingle bars"),
      ],
      media: [
        img(PH.plain, "Wide shot: the Geruwa channel of the Karnali at dawn, sandbars and a sal-forested bank under thin mist", { landmarkId: "karnali-river-bardia", place: "Karnali River, Bardiya", altitudeM: 155, date: "2026-02", note: "float at dawn, 06:50" }),
        img(PH.plain, "Landscape: Ganges River Dolphin rolling at the surface of the Karnali, ripples in soft light", { speciesIds: ["ganges-river-dolphin"], place: "Karnali River, Bardiya", altitudeM: 155, date: "2026-02", note: "surfacing, 08:40" }),
      ],
    },
    {
      id: "sal-forest",
      key: true,
      name: "Sal Forest Interior",
      kind: "forest",
      coords: [81.43, 28.46],
      altitudeM: 200,
      day: 5,
      nights: 0,
      habitat: ["sal forest", "forest streams", "clearings"],
      summary:
        "A full day by jeep deep into the sal forest, with long quiet waits at waterholes and clearings. Woodpeckers, hornbills and raptors keep the camera busy between tiger searches.",
      sightings: [
        ...seen("common", ["greater-racket-tailed-drongo", "jungle-babbler", "common-iora", "black-hooded-oriole", "chital", "sal"]),
        ...seen("likely", ["great-slaty-woodpecker", "greater-flameback", "lesser-yellownape", "oriental-pied-hornbill", "small-minivet", "changeable-hawk-eagle", "sambar", "barking-deer", "northern-plains-gray-langur"]),
        ...seen("possible", ["great-hornbill", "red-headed-vulture", "white-rumped-vulture", "white-rumped-shama", "asian-elephant"]),
        one("bengal-tiger", "possible"),
        one("indian-pitta", "possible", [4, 5]),
        one("asian-paradise-flycatcher", "possible", SPRING),
        one("sloth-bear", "rare"),
        one("leopard", "rare"),
      ],
      media: [
        img(PH.forest, "Wide shot: tall sal trunks in slanting morning light along a forest track in Bardiya, the jeep small in the frame", { speciesIds: ["sal"], place: "Bardiya National Park", altitudeM: 200, date: "2026-03", note: "forest drive, 08:00" }),
        img(PH.forest, "Landscape: Red-headed Vulture perched on a dead sal at a forest clearing", { speciesIds: ["red-headed-vulture"], place: "Bardiya National Park", altitudeM: 200, date: "2026-03", note: "on a snag, 10:30" }),
      ],
    },
    {
      id: "riverine-forest",
      name: "Riverine Forest, Karnali Floodplain",
      kind: "forest",
      coords: [81.315, 28.415],
      altitudeM: 160,
      day: 6,
      nights: 0,
      habitat: ["riverine forest", "floodplain grassland", "river banks"],
      summary:
        "A walking safari through the riverine forest and floodplain, quiet and close to the ground, with rhinos in the wet grass and kingfishers along the channels.",
      sightings: [
        ...seen("common", ["red-junglefowl", "jungle-babbler", "white-throated-kingfisher", "rhesus-macaque", "chital"]),
        ...seen("likely", ["lesser-flameback", "fulvous-breasted-woodpecker", "tickells-blue-flycatcher", "lineated-barbet", "stork-billed-kingfisher", "greater-one-horned-rhinoceros", "bengal-monitor"]),
        ...seen("possible", ["asian-elephant", "indian-rock-python", "brown-fish-owl"]),
        one("bengal-tiger", "possible", undefined, "Fresh pugmarks on the sand"),
        one("orange-headed-thrush", "possible", WINTER),
        one("common-mormon", "likely", [10, 11, 3, 4]),
      ],
      media: [
        img(PH.forest, "Landscape: Greater One-horned Rhinoceros in floodplain grass near the Karnali, egrets around its legs", { speciesIds: ["greater-one-horned-rhinoceros"], place: "Karnali floodplain, Bardiya", altitudeM: 160, date: "2026-03", note: "grazing, 07:40" }),
      ],
    },
    {
      id: "tharu-village",
      name: "Tharu Village, Thakurdwara",
      kind: "village",
      coords: [81.33, 28.385],
      altitudeM: 165,
      day: 7,
      nights: 0,
      habitat: ["farmland", "village", "hedgerows", "ponds"],
      summary:
        "A lighter day combining a village visit with a dedicated birding walk, useful for wide-angle habitat shots and smaller subjects between tiger searches.",
      sightings: [
        ...seen("common", ["baya-weaver", "black-drongo", "common-myna", "cattle-egret", "indian-pond-heron", "red-wattled-lapwing", "scaly-breasted-munia"]),
        ...seen("likely", ["indian-roller", "long-tailed-shrike", "spotted-owlet", "common-hoopoe", "green-bee-eater", "shikra", "white-throated-kingfisher"]),
        one("citrine-wagtail", "likely", WINTER),
        one("plain-tiger", "likely", COOL_SEASON),
      ],
      media: [
        img(PH.plain, "Wide shot: a Tharu house with painted mud walls and a thatched roof, mustard fields and a weaver colony in the tree", { speciesIds: ["baya-weaver"], place: "Tharu village, Thakurdwara", altitudeM: 165, date: "2026-02", note: "village walk, 16:00" }),
      ],
    },
    {
      id: "nepalgunj-return",
      name: "Nepalgunj",
      kind: "town",
      coords: [81.6669, 28.1036],
      altitudeM: 165,
      day: 8,
      nights: 0,
      stay: { kind: "none", note: "Flight back to Kathmandu" },
      habitat: ["farmland"],
      summary: "A morning departure from Bardiya and the transfer to Nepalgunj for the flight back to Kathmandu.",
      sightings: nepalgunjSightings,
      media: [
        img(PH.plain, "Landscape: Black Drongo on a wire over the fields outside Nepalgunj in the morning haze", { speciesIds: ["black-drongo"], place: "Nepalgunj", altitudeM: 165, date: "2026-02", note: "on a wire, 09:30" }),
      ],
    },
    {
      id: "kathmandu-return",
      name: "Kathmandu",
      kind: "town",
      coords: [85.3123, 27.7154],
      altitudeM: 1400,
      day: 8,
      nights: 1,
      stay: { kind: "hotel", note: "Hotel in Kathmandu" },
      habitat: ["city gardens"],
      summary: "An evening at leisure in Kathmandu to review images.",
      sightings: kathmanduSightings,
      media: [
        img(PH.plain, "Landscape: a laptop open on a hotel table in Kathmandu with a tiger image on screen, evening lamp light", { landmarkId: "kathmandu", place: "Kathmandu", altitudeM: 1400, date: "2026-04", note: "reviewing images, evening" }),
      ],
    },
    {
      id: "kathmandu-departure",
      name: "Kathmandu",
      kind: "town",
      coords: [85.3123, 27.7154],
      altitudeM: 1400,
      day: 9,
      nights: 0,
      stay: { kind: "none", note: "Departure transfer to the airport" },
      habitat: ["city gardens"],
      summary: "Final breakfast and the departure transfer.",
      sightings: kathmanduSightings,
      media: [
        img(PH.plain, "Landscape: Oriental Magpie-Robin singing from a hotel garden wall in Kathmandu in the early morning", { speciesIds: ["oriental-magpie-robin"], place: "Kathmandu", altitudeM: 1400, date: "2026-04", note: "morning song, 07:00" }),
      ],
    },
  ],
  route,
  landmarkIds: ["bardia-national-park", "karnali-river-bardia"],
  reviewIds: [],
  includes: [
    "Domestic flights (Kathmandu–Nepalgunj return)",
    "All lodge accommodation",
    "All meals during the safari",
    "Park permits, jeep safaris, and guide fees",
    "Expert wildlife photography guide",
  ],
  excludes: ["International flights and visa", "Camera gear and memory cards", "Personal expenses and tips"],
  status: "published",
} satisfies Trip;
