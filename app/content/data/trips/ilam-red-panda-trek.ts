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


const SPRING: Month[] = [3, 4, 5];
const WINTER: Month[] = [11, 12, 1, 2, 3];
const BLOOM: Month[] = [3, 4, 5];

/** Approximate line: Bhadrapur up the Mechi Highway to Ilam, on to Dobate, up through the bamboo
    forest to the Sandakpur ridge, and the same way back. Kathmandu is joined by the flights. */
const route: LngLat[] = [
  [88.07960, 26.57080],
  [88.02000, 26.62000],
  [87.99000, 26.66000],
  [88.00000, 26.75000],
  [88.04000, 26.84000],
  [88.00000, 26.89000],
  [87.92820, 26.90940],
  [87.93000, 26.96000],
  [87.92800, 27.00600],
  [87.96000, 27.04000],
  [87.99520, 27.06930],
  [88.00400, 27.08200],
  [87.99500, 27.09400],
  [88.00200, 27.10100],
  [87.99500, 27.09400],
  [88.00400, 27.08200],
  [87.99520, 27.06930],
  [87.96000, 27.04000],
  [87.92800, 27.00600],
  [87.93000, 26.96000],
  [87.92820, 26.90940],
  [88.00000, 26.89000],
  [88.04000, 26.84000],
  [88.00000, 26.75000],
  [87.99000, 26.66000],
  [88.02000, 26.62000],
  [88.07960, 26.57080],
];

const kathmanduSightings: Sighting[] = [
  ...seen("common", ["black-kite", "large-billed-crow", "common-myna", "oriental-magpie-robin", "red-vented-bulbul", "spotted-dove"]),
  ...seen("likely", ["himalayan-bulbul", "eurasian-kestrel", "grey-wagtail"]),
  one("egyptian-vulture", "possible"),
];

const bhadrapurSightings: Sighting[] = [
  ...seen("common", ["black-kite", "cattle-egret", "asian-pied-starling", "common-myna", "indian-pond-heron", "black-drongo", "red-wattled-lapwing"]),
  ...seen("likely", ["indian-roller", "spotted-owlet", "white-throated-kingfisher", "green-bee-eater"]),
];

export const trip = {
  slug: "ilam-red-panda-trek",
  title: "Red Panda Trek",
  tagline: "Ten days in the bamboo cloud forest of eastern Nepal, searching for the red panda at dawn and dusk.",
  kind: "birding-trek",
  guideRole: "lead-guide",
  region: "Ilam, eastern Nepal",
  durationDays: 10,
  difficulty: "moderate",
  maxAltitudeM: 3300,
  bestMonths: [3, 4, 5, 10, 11, 12],
  summary:
    "Eastern Nepal's Ilam region holds some of the country's best remaining red panda habitat, alongside outstanding birding in remote rhododendron and bamboo forest. This 10-day trek is designed for wildlife photographers seeking one of the Himalayas' most elusive mammals.",
  highlights: [
    "Search for wild red pandas in prime bamboo-rhododendron habitat",
    "Remote eastern Nepal trekking route, far from crowded trails",
    "Rich birdlife including Himalayan pheasants and high-altitude specialists",
    "Guided by naturalists experienced in red panda tracking",
  ],
  cover: img(
    PH.forest,
    "Close, landscape crop: Red Panda resting on a mossy rhododendron branch in soft morning light, bamboo blurred behind",
    { speciesIds: ["red-panda"], place: "Sandakpur ridge, Ilam", altitudeM: 3100, date: "2025-11", note: "resting after feeding, 07:40" },
    [0.5, 0.45],
  ),
  reel: [
    clip(
      PH.forest,
      "Clip, 16 s: Red Panda climbing slowly along a branch through bamboo and moss, tail hanging below",
      { speciesIds: ["red-panda", "maling-bamboo"], place: "Sandakpur ridge, Ilam", altitudeM: 3100, date: "2025-11", note: "moving through the canopy, 16:20" },
      16,
    ),
    img(
      PH.plain,
      "Wide shot: rows of tea bushes on the Ilam hills in morning mist, a tea picker on the path",
      { place: "Ilam tea gardens", altitudeM: 1200, date: "2026-04", note: "morning mist, 07:00" },
      [0.5, 0.5],
    ),
    img(
      PH.forest,
      "Landscape: male Satyr Tragopan on a mossy log in the rhododendron forest, crimson breast with white spots",
      { speciesIds: ["satyr-tragopan"], place: "Sandakpur ridge, Ilam", altitudeM: 3000, date: "2026-04", note: "male crossing the trail, 06:30" },
      [0.5, 0.5],
    ),
    img(
      PH.snow,
      "Wide shot: Kanchenjunga floating above a sea of cloud from the ridge above the red panda forest",
      { landmarkId: "kanchenjunga", place: "Sandakpur ridge, Ilam", altitudeM: 3300, date: "2025-11", note: "clear dawn, 05:50" },
      [0.5, 0.35],
    ),
    img(
      PH.plain,
      "Landscape: Krishna and a local tracker kneeling over red panda droppings on a bamboo-lined trail, guests with cameras behind",
      { speciesIds: ["red-panda"], place: "Sandakpur ridge, Ilam", altitudeM: 3100, date: "2025-11", note: "reading fresh signs, 07:10" },
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
      summary: "Airport pickup, hotel check-in, and a photography and trekking briefing.",
      sightings: kathmanduSightings,
      media: [
        img(PH.plain, "Landscape: camera gear and a field notebook laid out on a hotel table in Kathmandu before the briefing", { landmarkId: "kathmandu", place: "Kathmandu", altitudeM: 1400, date: "2025-11", note: "briefing, evening" }),
      ],
    },
    {
      id: "bhadrapur",
      transit: true,
      name: "Bhadrapur",
      kind: "town",
      coords: [88.0796, 26.5708],
      altitudeM: 90,
      day: 2,
      nights: 0,
      stay: { kind: "none", note: "Morning flight in from Kathmandu" },
      habitat: ["farmland", "village trees"],
      summary: "A morning flight to Bhadrapur, in the far eastern lowlands of Nepal.",
      sightings: bhadrapurSightings,
      media: [
        img(PH.plain, "Wide shot: the small airstrip at Bhadrapur with flat green rice fields around it, hills faint to the north", { place: "Bhadrapur", altitudeM: 90, date: "2025-11", note: "arrival, 09:00" }),
      ],
    },
    {
      id: "ilam",
      key: true,
      name: "Ilam",
      kind: "town",
      coords: [87.9282, 26.9094],
      altitudeM: 1200,
      day: 2,
      nights: 1,
      stay: { kind: "homestay", note: "Homestay or small hotel among the tea gardens" },
      habitat: ["tea gardens", "broadleaf forest patches", "village gardens"],
      summary:
        "Then the drive into the tea-growing hills of Ilam. The tea gardens and forest patches around town are a good first look at the birds of the eastern hills.",
      sightings: [
        ...seen("common", ["himalayan-bulbul", "red-vented-bulbul", "great-barbet", "grey-treepie", "oriental-white-eye", "long-tailed-shrike"]),
        ...seen("likely", ["golden-throated-barbet", "blue-throated-barbet", "verditer-flycatcher", "black-bulbul", "common-tailorbird", "long-tailed-minivet", "grey-hooded-warbler"]),
        ...seen("possible", ["mountain-hawk-eagle", "assamese-macaque"]),
      ],
      media: [
        img(PH.plain, "Wide shot: green rows of tea on the rolling Ilam hills under a high sky, shade trees dotted across", { place: "Ilam tea gardens", altitudeM: 1200, date: "2026-04", note: "afternoon light" }),
        img(PH.forest, "Landscape: Golden-throated Barbet calling from the top of a shade tree in the Ilam tea gardens", { speciesIds: ["golden-throated-barbet"], place: "Ilam", altitudeM: 1200, date: "2026-04", note: "calling at the treetop, 07:30" }),
      ],
    },
    {
      id: "dobate",
      key: true,
      name: "Dobate",
      kind: "village",
      coords: [87.9952, 27.0693],
      altitudeM: 2660,
      day: 3,
      nights: 1,
      stay: { kind: "homestay", note: "Community homestay in the village" },
      habitat: ["temperate broadleaf forest", "bamboo", "village clearings"],
      summary:
        "We drive to the trailhead and begin trekking into forested hill terrain, up to the small village of Dobate on the edge of the red panda forest.",
      sightings: [
        ...seen("common", ["rufous-sibia", "whiskered-yuhina", "blue-winged-minla", "green-backed-tit", "chestnut-crowned-laughingthrush"]),
        ...seen("likely", ["kalij-pheasant", "darjeeling-woodpecker", "rufous-bellied-niltava", "large-niltava", "golden-breasted-fulvetta", "yellow-billed-blue-magpie", "black-throated-parrotbill", "barking-deer"]),
        ...seen("possible", ["hill-partridge", "satyr-tragopan", "scarlet-finch", "red-panda", "yellow-throated-marten"]),
        one("maling-bamboo", "common"),
        one("rhododendron-arboreum", "common", BLOOM),
      ],
      media: [
        img(PH.forest, "Wide shot: the wooden houses of Dobate in a forest clearing at dusk, cloud drifting through the trees", { place: "Dobate, Ilam", altitudeM: 2660, date: "2025-11", note: "evening, 17:00" }),
      ],
    },
    {
      id: "bamboo-forest-camp",
      name: "Bamboo Forest Camp",
      kind: "camp",
      coords: [88.004, 27.082],
      altitudeM: 2950,
      day: 4,
      nights: 1,
      stay: { kind: "camp", note: "Tented camp or a simple shelter, as conditions allow" },
      habitat: ["bamboo–rhododendron forest", "mossy oak forest"],
      summary:
        "The first of two days of trekking through dense bamboo-rhododendron forest, the preferred habitat of red pandas.",
      sightings: [
        ...seen("common", ["white-browed-fulvetta", "rufous-vented-tit", "stripe-throated-yuhina", "chestnut-tailed-minla", "black-faced-laughingthrush"]),
        ...seen("likely", ["black-throated-parrotbill", "hoary-throated-barwing", "spotted-laughingthrush", "rufous-vented-yuhina", "darjeeling-woodpecker", "red-headed-bullfinch", "himalayan-langur"]),
        ...seen("possible", ["satyr-tragopan", "great-parrotbill", "fire-tailed-myzornis", "red-panda", "himalayan-black-bear"]),
        one("gold-naped-finch", "possible", WINTER),
        one("maling-bamboo", "common"),
        one("rhododendron-barbatum", "likely", [3, 4]),
      ],
      media: [
        img(PH.forest, "Landscape: tents in a small clearing ringed by bamboo and rhododendron, mist in the trees at first light", { place: "Bamboo forest camp, Ilam", altitudeM: 2950, date: "2025-11", note: "camp at dawn, 06:00" }),
        img(PH.forest, "Close: Black-throated Parrotbill clinging to a bamboo stem, orange head and black throat", { speciesIds: ["black-throated-parrotbill"], place: "Bamboo forest camp, Ilam", altitudeM: 2950, date: "2025-11", note: "party moving through bamboo, 08:20" }),
      ],
    },
    {
      id: "red-panda-habitat",
      key: true,
      name: "Red Panda Habitat, Sandakpur Ridge",
      kind: "camp",
      coords: [87.995, 27.094],
      altitudeM: 3100,
      day: 5,
      nights: 4,
      stay: { kind: "camp", note: "Base for four nights in the core habitat; tented camp or simple shelter" },
      habitat: ["bamboo–rhododendron forest", "fir and oak forest", "mossy ridge"],
      summary:
        "We reach the core habitat, with naturalist guides tracking signs (droppings, feeding marks) to locate active areas. This is our base for the search days.",
      sightings: [
        ...seen("common", ["white-browed-fulvetta", "grey-crested-tit", "rufous-vented-tit", "black-faced-laughingthrush", "large-billed-crow"]),
        ...seen("likely", ["golden-breasted-fulvetta", "black-throated-parrotbill", "red-headed-bullfinch", "dark-breasted-rosefinch", "collared-grosbeak", "spotted-laughingthrush", "darjeeling-woodpecker", "fire-tailed-sunbird"]),
        ...seen("possible", ["satyr-tragopan", "blood-pheasant", "himalayan-monal", "fire-tailed-myzornis", "scarlet-finch", "yellow-throated-marten", "himalayan-serow"]),
        one("red-panda", "possible", undefined, "Found by tracking fresh signs at dawn and dusk"),
        one("himalayan-black-bear", "rare"),
        one("maling-bamboo", "common"),
        one("rhododendron-campanulatum", "likely", [4, 5]),
      ],
      media: [
        img(PH.forest, "Landscape: Red Panda feeding on bamboo leaves in the understorey, russet coat against green", { speciesIds: ["red-panda", "maling-bamboo"], place: "Sandakpur ridge, Ilam", altitudeM: 3100, date: "2025-11", note: "feeding, 16:40" }),
        img(PH.forest, "Wide shot: mossy rhododendron and bamboo forest on the Sandakpur ridge in cloud, a faint trail through it", { place: "Sandakpur ridge, Ilam", altitudeM: 3100, date: "2025-11", note: "cloud forest, midday" }),
      ],
    },
    {
      id: "red-panda-search",
      key: true,
      name: "Sandakpur Ridge Search Area",
      kind: "forest",
      coords: [88.002, 27.101],
      altitudeM: 3300,
      day: 6,
      nights: 0,
      habitat: ["bamboo–rhododendron forest", "ridge-top forest", "forest edge"],
      summary:
        "Three dedicated days based in the core habitat zone, conducting early morning and late afternoon searches, the peak activity windows for red pandas, alongside forest birding for pheasants, laughingthrushes and raptors.",
      sightings: [
        ...seen("likely", ["black-faced-laughingthrush", "spotted-laughingthrush", "hoary-throated-barwing", "himalayan-griffon", "mountain-hawk-eagle", "large-billed-crow"]),
        ...seen("possible", ["satyr-tragopan", "blood-pheasant", "himalayan-monal", "hill-partridge", "black-eagle", "lammergeier", "himalayan-serow"]),
        one("red-panda", "possible", undefined, "Peak activity in the first and last hours of light"),
        one("grandala", "possible", WINTER),
        one("fire-tailed-myzornis", "possible", SPRING, "At the rhododendron flowers"),
        one("rhododendron-arboreum", "common", BLOOM),
      ],
      media: [
        img(PH.forest, "Landscape: guests waiting quietly with long lenses at the forest edge in the last light, bamboo all around", { place: "Sandakpur ridge, Ilam", altitudeM: 3300, date: "2025-11", note: "evening search, 16:30" }),
        img(PH.forest, "Close, landscape crop: Red Panda looking down from high in a fir, white face mask lit by low sun", { speciesIds: ["red-panda"], place: "Sandakpur ridge, Ilam", altitudeM: 3300, date: "2025-11", note: "in a fir, 07:05" }),
      ],
      views: ["kanchenjunga", "kanchenjunga-himal"],
    },
    {
      id: "bhadrapur-return",
      transit: true,
      name: "Bhadrapur",
      kind: "town",
      coords: [88.0796, 26.5708],
      altitudeM: 90,
      day: 9,
      nights: 0,
      stay: { kind: "none", note: "Afternoon flight to Kathmandu" },
      habitat: ["farmland", "village trees"],
      summary: "Down from the forest and back by road through Ilam to Bhadrapur, for the flight to Kathmandu.",
      sightings: bhadrapurSightings,
      media: [
        img(PH.plain, "Landscape: Indian Roller on a wire above the rice fields near Bhadrapur, blue wings half open", { speciesIds: ["indian-roller"], place: "Bhadrapur", altitudeM: 90, date: "2025-11", note: "hunting from a wire, 14:00" }),
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
      summary: "The return journey ends with a night back in Kathmandu.",
      sightings: kathmanduSightings,
      media: [
        img(PH.ridge, "Wide shot: the Kathmandu Valley from the air in the evening, hills and terraces in soft light", { landmarkId: "kathmandu", place: "Kathmandu Valley", altitudeM: 1400, date: "2025-11", note: "flight in, 17:00" }),
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
        img(PH.plain, "Landscape: Oriental Magpie-Robin singing from a hotel garden wall in Kathmandu in the early morning", { speciesIds: ["oriental-magpie-robin"], place: "Kathmandu", altitudeM: 1400, date: "2025-11", note: "morning song, 07:00" }),
      ],
    },
  ],
  route,
  landmarkIds: ["ilam-red-panda-forest", "kanchenjunga-himal", "kanchenjunga"],
  reviewIds: [],
  includes: [
    "Domestic flights (Kathmandu–Bhadrapur return)",
    "All ground transportation",
    "Teahouse/camping accommodation as required",
    "All meals during the trek",
    "Local permits and conservation fees",
    "Expert wildlife photography and trekking guide, porter support",
  ],
  excludes: ["International flights and visa", "Camera gear", "Tips and personal expenses"],
  status: "published",
} satisfies Trip;
