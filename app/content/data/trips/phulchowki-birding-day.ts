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

/* Placeholder itinerary: geography and species are real; photos, clips and price are stand-ins
   for Krishna's own. See docs/research/SEED_TRIPS.md. */

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

/** Approximate line of the Godavari to Phulchowki summit road and trail. */
const route: LngLat[] = [
  [85.38300, 27.59500],
  [85.38600, 27.59250],
  [85.38900, 27.59000],
  [85.39250, 27.58600],
  [85.39650, 27.58100],
  [85.39850, 27.57900],
  [85.39950, 27.57700],
  [85.40050, 27.57400]
];

export const trip = {
  slug: "phulchowki-birding-day",
  title: "Phulchowki Birding Day Hike",
  tagline: "Kathmandu's best birding mountain: one dawn-to-dusk day from valley garden to forested summit.",
  kind: "day-tour",
  guideRole: "lead-guide",
  region: "Kathmandu Valley, Phulchowki",
  durationDays: 1,
  difficulty: "moderate",
  maxAltitudeM: 2782,
  bestMonths: [2, 3, 4, 10, 11],
  summary:
    "Phulchowki is the highest hill ringing the Kathmandu Valley and the best place to meet Himalayan forest birds in a single day. Krishna collects you at first light and we bird our way up from the Godavari botanical garden through oak, laurel and rhododendron forest to the summit at 2,782 m. On a good day you will see sunbirds, laurel-forest laughingthrushes, niltavas and forktails, and in spring the whole slope is bright with rhododendron. It is gentle on the legs and generous with birds.",
  highlights: [
    "Dawn in the Godavari botanical garden, with flycatchers, minivets and Red-billed Blue Magpies",
    "Laughingthrushes, minlas and Himalayan Cutia in the mossy middle forest",
    "Streams with Spotted Forktail, Little Forktail and White-capped Redstart",
    "Rhododendron arboreum in bloom from February to April",
    "Summit views of the Langtang and Jugal Himal on clear days",
    "A comfortable day: transport up the road, short flat walks, and plenty of time for photos",
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
      { landmarkId: "langtang-himal", place: "Phulchowki summit", altitudeM: 2782, date: "2025-11", note: "clear, 08:30" },
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
      id: "botanical-garden",
      key: true,
      name: "National Botanical Garden, Godavari",
      kind: "forest",
      coords: [85.383, 27.595],
      altitudeM: 1500,
      day: 1,
      nights: 0,
      habitat: ["botanical garden", "stream", "mixed broadleaf forest"],
      summary:
        "Dawn start at the Godavari garden gate at about 06:00, when the paths are quiet and the first flocks are moving. An easy two hours of flat walking gives flycatchers, bulbuls, minivets and the day's first laughingthrushes.",
      sightings: [
        ...seen("common", ["himalayan-bulbul", "black-bulbul", "red-vented-bulbul", "great-barbet", "oriental-white-eye", "black-throated-tit", "grey-hooded-warbler", "green-backed-tit"]),
        ...seen("likely", ["red-billed-blue-magpie", "scarlet-minivet", "long-tailed-minivet", "verditer-flycatcher", "rufous-bellied-niltava", "little-pied-flycatcher", "blue-whistling-thrush", "streaked-laughingthrush", "eurasian-jay", "oriental-magpie-robin"]),
        ...seen("possible", ["kalij-pheasant", "spotted-forktail", "blue-throated-barbet", "grey-chinned-minivet", "common-kingfisher"]),
        one("ultramarine-flycatcher", "possible", WINTER),
        one("himalayan-bluetail", "possible", WINTER),
        one("hodgsons-redstart", "possible", WINTER),
        one("himalayan-daphne", "possible", [12, 1, 2, 3], "Fragrant pink flowers by the paths"),
        one("krishna-peacock", "possible", [4, 5, 10]),
        one("common-mormon", "likely", [3, 4, 5, 10, 11]),
      ],
      media: [
        img(PH.forest, "Wide shot: early light on the paths of the National Botanical Garden at Godavari, mist and large trees", { place: "National Botanical Garden, Godavari", altitudeM: 1500, date: "2026-03", note: "06:15, mist on the lawn" }),
        img(PH.forest, "Close: Red-billed Blue Magpie in a garden tree, long blue tail and red bill in full view", { speciesIds: ["red-billed-blue-magpie"], place: "National Botanical Garden, Godavari", altitudeM: 1500, date: "2026-03", note: "pair on a low branch, 06:40" }),
      ],
    },
    {
      id: "lower-forest",
      name: "Lower Phulchowki Forest",
      kind: "forest",
      coords: [85.389, 27.59],
      altitudeM: 1750,
      day: 1,
      nights: 0,
      habitat: ["oak and laurel forest", "roadside scrub"],
      summary:
        "Mid-morning, we drive up to the first bends of the Phulchowki road and walk slowly through the mossy forest. This is the best stretch of the day for mixed flocks, with yuhinas, minlas, fulvettas and sibias often all in the same tree.",
      sightings: [
        ...seen("common", ["rufous-sibia", "whiskered-yuhina", "blue-winged-minla", "white-throated-laughingthrush", "great-barbet", "black-bulbul"]),
        ...seen("likely", ["chestnut-crowned-laughingthrush", "striated-laughingthrush", "rufous-chinned-laughingthrush", "rufous-winged-fulvetta", "nepal-fulvetta", "yellow-billed-blue-magpie", "green-tailed-sunbird", "black-throated-sunbird", "mountain-bulbul", "greater-yellownape", "large-niltava", "slaty-blue-flycatcher"]),
        ...seen("possible", ["himalayan-cutia", "mrs-goulds-sunbird", "golden-throated-barbet", "speckled-wood-pigeon", "ashy-wood-pigeon", "mountain-hawk-eagle", "grey-winged-blackbird", "assamese-macaque"]),
        one("rhododendron-arboreum", "common", [2, 3, 4], "Blooming trees along the road"),
        one("northern-jungle-queen", "possible", [4, 5, 10], "Gliding low over the shaded road"),
      ],
      media: [
        img(PH.forest, "Landscape: a mixed flock of Whiskered Yuhina and Rufous Sibia in an oak, moss on every branch", { speciesIds: ["whiskered-yuhina", "rufous-sibia"], place: "Phulchowki", altitudeM: 1750, date: "2026-03", note: "flock in oak, 09:20" }),
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
        "We stop for a picnic lunch at the little temple around midday, where a rushing stream cuts through the forest. Forktails and redstarts bob on the wet rocks, while niltavas and thrushes feed in the shady clearing.",
      sightings: [
        ...seen("common", ["spotted-forktail", "white-capped-redstart", "plumbeous-water-redstart", "rufous-bellied-niltava", "yellow-bellied-fantail", "grey-hooded-warbler"]),
        ...seen("likely", ["little-forktail", "large-niltava", "chestnut-bellied-rock-thrush", "grey-winged-blackbird", "long-tailed-minivet", "whiskered-yuhina", "green-tailed-sunbird", "blue-whistling-thrush"]),
        ...seen("possible", ["collared-owlet", "red-headed-trogon", "himalayan-cutia", "rufous-gorgeted-flycatcher", "yellow-throated-marten"]),
        one("golden-bush-robin", "possible", WINTER),
        one("himalayan-bluetail", "possible", WINTER),
      ],
      media: [
        img(PH.forest, "Landscape: Spotted Forktail on a wet boulder in the stream below the Phulchowki Mai temple", { speciesIds: ["spotted-forktail"], place: "Phulchowki Mai Temple", altitudeM: 2100, date: "2026-03", note: "on wet rock, 11:30" }),
        img(PH.forest, "Wide shot: the small temple and prayer flags among moss-draped trees beside the stream", { place: "Phulchowki Mai Temple", altitudeM: 2100, date: "2026-03", note: "picnic stop, 11:45" }),
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
        "Early afternoon in the cool upper forest, with tall rhododendrons, orchids on the oak limbs and the chance of a Spotted Laughingthrush or Great Parrotbill in the bamboo. Flowers draw sunbirds in the spring.",
      sightings: [
        ...seen("common", ["rufous-vented-tit", "grey-crested-tit", "spot-winged-tit", "stripe-throated-yuhina", "bar-tailed-treecreeper"]),
        ...seen("likely", ["spotted-laughingthrush", "hoary-throated-barwing", "chestnut-tailed-minla", "rufous-gorgeted-flycatcher", "yellow-browed-tit", "spotted-nutcracker", "fire-tailed-sunbird", "mrs-goulds-sunbird"]),
        ...seen("possible", ["great-parrotbill", "koklass-pheasant", "himalayan-cutia", "golden-breasted-fulvetta", "barking-deer", "yellow-throated-marten"]),
        one("blue-fronted-redstart", "possible", WINTER),
        one("collared-grosbeak", "possible", WINTER),
        one("rhododendron-arboreum", "common", [2, 3, 4]),
        one("rhododendron-barbatum", "likely", [3, 4]),
        one("necklace-orchid", "possible", [3, 4]),
      ],
      media: [
        img(PH.forest, "Wide shot: tall rhododendron in full red bloom over a mossy trail on upper Phulchowki, mist in the trees", { speciesIds: ["rhododendron-arboreum"], place: "Phulchowki", altitudeM: 2500, date: "2026-03", note: "peak bloom, 13:20" }),
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
        "We finish at the top by mid-afternoon, with a wide view across the Kathmandu Valley and, on a clear day, the white wall of the Langtang and Jugal Himal. Raptors circle in the thermals before we drift back down, birding the forest on the way and reaching Kathmandu by early evening.",
      sightings: [
        ...seen("likely", ["spotted-nutcracker", "white-throated-laughingthrush", "himalayan-bluetail", "black-eagle", "himalayan-griffon"]),
        ...seen("possible", ["egyptian-vulture", "mountain-hawk-eagle", "rufous-vented-tit", "blue-fronted-redstart", "oriental-honey-buzzard"]),
        one("rhododendron-barbatum", "common", [3, 4]),
      ],
      media: [
        img(PH.ridge, "Wide shot: layered valley hills fading into haze from the Phulchowki summit, the Langtang Himal white on the horizon", { landmarkId: "langtang-himal", place: "Phulchowki summit", altitudeM: 2782, date: "2025-11", note: "clear afternoon, 15:00" }, [0.5, 0.35]),
        img(PH.forest, "Landscape: Himalayan Griffon gliding past the Phulchowki summit, layered hills behind", { speciesIds: ["himalayan-griffon"], place: "Phulchowki summit", altitudeM: 2782, date: "2025-11", note: "thermalling, 14:30" }),
      ],
    },
  ],
  route,
  landmarkIds: ["kathmandu", "phulchowki", "shivapuri-nagarjun-national-park", "langtang-himal"],
  reviewIds: ["ph-phulchowki-a", "ph-phulchowki-b"],
  includes: [
    "Krishna as your lead birding guide for the day",
    "Private transport from Kathmandu to Godavari and the summit road",
    "Packed picnic lunch and drinking water",
    "National Botanical Garden entry (placeholder)",
    "Bird checklist for the day",
  ],
  pricing: { show: false, amount: 120, currency: "USD", per: "group", note: "Placeholder price; confirm with Krishna" },
  status: "published",
} satisfies Trip;
