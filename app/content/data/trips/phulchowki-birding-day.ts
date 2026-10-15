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

/* Itinerary, highlights and inclusions are Krishna's own copy. Geography and species are real;
   photos and clips are stand-ins for his own. */

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

const seen = (likelihood: Likelihood, ids: string[], months?: Month[]): Sighting[] =>
  ids.map((speciesId) => ({ speciesId, likelihood, ...(months ? { months } : {}) }));

const one = (speciesId: string, likelihood: Likelihood, months?: Month[], note?: string): Sighting => ({
  speciesId,
  likelihood,
  ...(months ? { months } : {}),
  ...(note ? { note } : {}),
});

const WINTER: Month[] = [11, 12, 1, 2, 3];

/** Approximate line: up the Phulchowki road from Godawari to the summit, back down past the
    Phulchowki Mai temple, and across to the National Botanical Garden. */
const up: LngLat[] = [
  [85.38600, 27.59250],
  [85.38900, 27.59000],
  [85.39250, 27.58600],
  [85.39650, 27.58100],
  [85.39850, 27.57900],
  [85.39950, 27.57700],
  [85.40050, 27.57400],
];
const route: LngLat[] = [...up, ...[...up].reverse().slice(1), [85.38300, 27.59500]];

export const trip = {
  slug: "phulchowki-birding-day",
  title: "Kathmandu Birding Day: Phulchowki & Godawari",
  tagline: "Kathmandu's best birding mountain in a single day: forested slopes at dawn, Godawari garden at midday.",
  kind: "day-tour",
  guideRole: "lead-guide",
  region: "Kathmandu Valley, Phulchowki and Godawari",
  regionSlug: "kathmandu",
  durationDays: 1,
  difficulty: "easy",
  maxAltitudeM: 2782,
  bestMonths: [2, 3, 4, 10, 11],
  summary:
    "Short on time but still want to experience world-class birdwatching in Kathmandu? Our one-day Kathmandu birding tour takes you straight from the city into the forested hills of Phulchowki and Godawari, one of the richest single-day birding sites in Nepal, with over 300 species recorded in the area.",
  highlights: [
    "Spot 80–120 bird species in a single day, including forest specialists and valley wetland birds",
    "Explore Phulchowki Hill, the highest point on the Kathmandu Valley rim",
    "Guided by an expert local birder skilled at identifying calls",
    "Perfect add-on for travelers with a short Kathmandu layover before or after a trek",
  ],
  cover: img(
    PH.forest,
    "Wide shot: dawn light through oak and rhododendron forest on Phulchowki, mist in the valley below, red blooms in the foreground",
    { speciesIds: ["rhododendron-arboreum"], place: "Phulchowki", altitudeM: 2500, date: "2026-03", note: "early light, mist below" },
    [0.5, 0.5],
  ),
  reel: [
    clip(
      PH.forest,
      "Clip, 16 s: mist drifting through the mossy oak forest of Phulchowki at dawn, birdsong in the soundtrack, a Rufous Sibia in the foreground",
      { speciesIds: ["rufous-sibia"], place: "Phulchowki", altitudeM: 2100, date: "2026-03", note: "forest at dawn, sibia on a branch" },
      16,
    ),
    img(
      PH.forest,
      "Close, landscape crop: male Mrs. Gould's Sunbird feeding at a rhododendron flower, red back catching the light",
      { speciesIds: ["mrs-goulds-sunbird", "rhododendron-arboreum"], place: "Phulchowki", altitudeM: 2300, date: "2026-03", note: "male at flower, 07:50" },
      [0.5, 0.5],
    ),
    img(
      PH.ridge,
      "Wide shot: view from the Phulchowki summit over layered Kathmandu Valley hills to the Langtang Himal on a clear morning",
      { landmarkId: "langtang-himal", place: "Phulchowki summit", altitudeM: 2782, date: "2025-11", note: "clear, 09:30" },
      [0.5, 0.35],
    ),
    clip(
      PH.forest,
      "Clip, 15 s: Spotted Forktail bobbing along a rocky mountain stream below the Phulchowki Mai temple",
      { speciesIds: ["spotted-forktail"], place: "Phulchowki Mai Temple stream", altitudeM: 2100, date: "2026-03", note: "foraging at stream edge" },
      15,
    ),
    img(
      PH.plain,
      "Landscape: Krishna with guests on the Phulchowki road at dawn, binoculars up, mixed flock in the oaks above",
      { place: "Phulchowki road", altitudeM: 1900, date: "2026-03", note: "group watching a flock" },
      [0.5, 0.5],
    ),
  ],
  waypoints: [
    {
      id: "lower-forest",
      key: true,
      name: "Lower Phulchowki Forest",
      kind: "forest",
      coords: [85.389, 27.59],
      altitudeM: 1750,
      day: 1,
      nights: 0,
      habitat: ["oak and laurel forest", "roadside scrub"],
      summary:
        "We depart Kathmandu before sunrise (around 5:30–6:00 AM) to reach the birding sites while activity is highest, with a packed breakfast and hot tea or coffee provided en route. Then we drive up the forested slopes of Phulchowki, stopping at productive spots along the road. Look for laughingthrushes, minivets, yuhinas, niltavas and, with luck, the elusive Spiny Babbler, Nepal's only endemic bird.",
      sightings: [
        ...seen("common", ["rufous-sibia", "whiskered-yuhina", "blue-winged-minla", "white-throated-laughingthrush", "great-barbet", "black-bulbul"]),
        ...seen("likely", ["chestnut-crowned-laughingthrush", "striated-laughingthrush", "rufous-chinned-laughingthrush", "rufous-winged-fulvetta", "nepal-fulvetta", "yellow-billed-blue-magpie", "green-tailed-sunbird", "black-throated-sunbird", "mountain-bulbul", "greater-yellownape", "large-niltava", "slaty-blue-flycatcher", "long-tailed-minivet"]),
        ...seen("possible", ["himalayan-cutia", "mrs-goulds-sunbird", "golden-throated-barbet", "speckled-wood-pigeon", "ashy-wood-pigeon", "mountain-hawk-eagle", "grey-winged-blackbird", "assamese-macaque"]),
        one("spiny-babbler", "possible", undefined, "Singing from the scrub on the lower slopes"),
        one("rhododendron-arboreum", "common", [2, 3, 4], "Blooming trees along the road"),
        one("northern-jungle-queen", "possible", [4, 5, 10], "Gliding low over the shaded road"),
      ],
      media: [
        img(PH.forest, "Landscape: a mixed flock of Whiskered Yuhina and Rufous Sibia in an oak, moss on every branch", { speciesIds: ["whiskered-yuhina", "rufous-sibia"], place: "Phulchowki", altitudeM: 1750, date: "2026-03", note: "flock in oak, 07:20" }),
        img(PH.plain, "Landscape: Spiny Babbler singing from the top of a scrubby bush on the lower slopes of Phulchowki, streaky brown plumage", { speciesIds: ["spiny-babbler"], place: "Phulchowki", altitudeM: 1700, date: "2026-03", note: "song post, 07:00" }),
      ],
    },
    {
      id: "upper-forest",
      name: "Upper Oak–Rhododendron Forest",
      kind: "forest",
      coords: [85.3995, 27.577],
      altitudeM: 2500,
      day: 1,
      nights: 0,
      habitat: ["oak–rhododendron forest", "bamboo patches"],
      summary:
        "Higher up the road, the forest turns cool and tall, with rhododendrons, orchids on the oak limbs and the chance of a Spotted Laughingthrush or Great Parrotbill in the bamboo. Flowers draw sunbirds in the spring.",
      sightings: [
        ...seen("common", ["rufous-vented-tit", "grey-crested-tit", "spot-winged-tit", "stripe-throated-yuhina", "bar-tailed-treecreeper"]),
        ...seen("likely", ["spotted-laughingthrush", "hoary-throated-barwing", "chestnut-tailed-minla", "rufous-gorgeted-flycatcher", "yellow-browed-tit", "spotted-nutcracker", "fire-tailed-sunbird", "mrs-goulds-sunbird", "scarlet-minivet"]),
        ...seen("possible", ["great-parrotbill", "koklass-pheasant", "himalayan-cutia", "golden-breasted-fulvetta", "barking-deer", "yellow-throated-marten"]),
        one("blue-fronted-redstart", "possible", WINTER),
        one("collared-grosbeak", "possible", WINTER),
        one("rhododendron-arboreum", "common", [2, 3, 4]),
        one("rhododendron-barbatum", "likely", [3, 4]),
        one("necklace-orchid", "possible", [3, 4]),
      ],
      media: [
        img(PH.forest, "Wide shot: tall rhododendron in full red bloom over a mossy trail on upper Phulchowki, mist in the trees", { speciesIds: ["rhododendron-arboreum"], place: "Phulchowki", altitudeM: 2500, date: "2026-03", note: "peak bloom, 08:40" }),
      ],
    },
    {
      id: "phulchowki-summit",
      key: true,
      name: "Phulchowki Summit",
      kind: "viewpoint",
      coords: [85.4005, 27.574],
      altitudeM: 2782,
      day: 1,
      nights: 0,
      habitat: ["ridge-top forest", "open viewpoint"],
      summary:
        "By mid-morning we reach the summit at 2,782 m, with a wide view across the Kathmandu Valley and, on a clear day, the white wall of the Langtang and Jugal Himal. Raptors start to circle in the thermals as the day warms.",
      sightings: [
        ...seen("likely", ["spotted-nutcracker", "white-throated-laughingthrush", "himalayan-bluetail", "black-eagle", "himalayan-griffon"]),
        ...seen("possible", ["egyptian-vulture", "mountain-hawk-eagle", "rufous-vented-tit", "blue-fronted-redstart", "oriental-honey-buzzard"]),
        one("rhododendron-barbatum", "common", [3, 4]),
      ],
      media: [
        img(PH.ridge, "Wide shot: layered valley hills fading into haze from the Phulchowki summit, the Langtang Himal white on the horizon", { landmarkId: "langtang-himal", place: "Phulchowki summit", altitudeM: 2782, date: "2025-11", note: "clear morning, 10:00" }, [0.5, 0.35]),
        img(PH.forest, "Landscape: Himalayan Griffon gliding past the Phulchowki summit, layered hills behind", { speciesIds: ["himalayan-griffon"], place: "Phulchowki summit", altitudeM: 2782, date: "2025-11", note: "thermalling, 10:30" }),
      ],
    },
    {
      id: "phulchowki-mai",
      key: true,
      name: "Phulchowki Mai Temple",
      kind: "forest",
      coords: [85.3965, 27.581],
      altitudeM: 2100,
      day: 1,
      nights: 0,
      habitat: ["stream", "oak–laurel forest", "shrine clearing"],
      summary:
        "On the way down we stop for a packed lunch at the little temple, where a rushing stream cuts through the forest. Forktails and redstarts bob on the wet rocks, while niltavas and thrushes feed in the shady clearing.",
      sightings: [
        ...seen("common", ["spotted-forktail", "white-capped-redstart", "plumbeous-water-redstart", "rufous-bellied-niltava", "yellow-bellied-fantail", "grey-hooded-warbler"]),
        ...seen("likely", ["little-forktail", "large-niltava", "chestnut-bellied-rock-thrush", "grey-winged-blackbird", "long-tailed-minivet", "whiskered-yuhina", "green-tailed-sunbird", "blue-whistling-thrush"]),
        ...seen("possible", ["collared-owlet", "red-headed-trogon", "himalayan-cutia", "rufous-gorgeted-flycatcher", "yellow-throated-marten"]),
        one("golden-bush-robin", "possible", WINTER),
        one("himalayan-bluetail", "possible", WINTER),
      ],
      media: [
        img(PH.forest, "Landscape: Spotted Forktail on a wet boulder in the stream below the Phulchowki Mai temple", { speciesIds: ["spotted-forktail"], place: "Phulchowki Mai Temple", altitudeM: 2100, date: "2026-03", note: "on wet rock, 11:30" }),
        img(PH.forest, "Wide shot: the small temple and prayer flags among moss-draped trees beside the stream", { place: "Phulchowki Mai Temple", altitudeM: 2100, date: "2026-03", note: "lunch stop, 11:45" }),
      ],
    },
    {
      id: "botanical-garden",
      key: true,
      name: "National Botanical Garden, Godawari",
      kind: "forest",
      coords: [85.383, 27.595],
      altitudeM: 1500,
      day: 1,
      nights: 0,
      stay: { kind: "none", note: "Drop-off at your Kathmandu hotel by early evening" },
      habitat: ["botanical garden", "stream", "mixed broadleaf forest", "open lawns"],
      summary:
        "After lunch we continue to Godawari Botanical Garden, where mixed forest and open lawns attract flycatchers, barbets, woodpeckers and sunbirds. We wrap up the checklist over tea before dropping you back at your hotel by early evening (around 5:00–6:00 PM).",
      sightings: [
        ...seen("common", ["himalayan-bulbul", "black-bulbul", "red-vented-bulbul", "great-barbet", "oriental-white-eye", "black-throated-tit", "grey-hooded-warbler", "green-backed-tit"]),
        ...seen("likely", ["red-billed-blue-magpie", "scarlet-minivet", "verditer-flycatcher", "rufous-bellied-niltava", "little-pied-flycatcher", "blue-whistling-thrush", "streaked-laughingthrush", "eurasian-jay", "oriental-magpie-robin", "fulvous-breasted-woodpecker", "grey-capped-pygmy-woodpecker", "blue-throated-barbet"]),
        ...seen("possible", ["kalij-pheasant", "spotted-forktail", "grey-chinned-minivet", "common-kingfisher", "spiny-babbler"]),
        one("ultramarine-flycatcher", "possible", WINTER),
        one("himalayan-bluetail", "possible", WINTER),
        one("hodgsons-redstart", "possible", WINTER),
        one("himalayan-daphne", "possible", [12, 1, 2, 3], "Fragrant pink flowers by the paths"),
        one("krishna-peacock", "possible", [4, 5, 10]),
        one("common-mormon", "likely", [3, 4, 5, 10, 11]),
      ],
      media: [
        img(PH.forest, "Wide shot: midday light on the lawns and big trees of the National Botanical Garden at Godawari", { place: "National Botanical Garden, Godawari", altitudeM: 1500, date: "2026-03", note: "13:15, sun on the lawn" }),
        img(PH.forest, "Close: Red-billed Blue Magpie in a garden tree, long blue tail and red bill in full view", { speciesIds: ["red-billed-blue-magpie"], place: "National Botanical Garden, Godawari", altitudeM: 1500, date: "2026-03", note: "pair on a low branch, 13:40" }),
      ],
    },
  ],
  route,
  landmarkIds: ["kathmandu", "phulchowki", "shivapuri-nagarjun-national-park", "langtang-himal"],
  reviewIds: ["ph-phulchowki-a", "ph-phulchowki-b"],
  includes: [
    "Private transportation",
    "Expert birding guide",
    "Breakfast, packed lunch, and refreshments",
    "Entrance fees to Phulchowki/Godawari",
  ],
  excludes: ["Personal expenses and tips", "Binoculars (available for rent)"],
  status: "published",
} satisfies Trip;
