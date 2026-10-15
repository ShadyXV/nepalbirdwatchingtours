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

/* Placeholder itinerary: geography and species are real; photos, clips, prices and stays are
   stand-ins for Krishna's own. See docs/research/SEED_TRIPS.md. */

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

const WINTER: Month[] = [11, 12, 1, 2];
const COOL_SEASON: Month[] = [10, 11, 12, 1, 2, 3];
const FLORICAN: Month[] = [3, 4, 5];

/** Approximate polyline joining the day's stops (roads, river and forest tracks). */
const route: LngLat[] = [
  [84.49360, 27.57470],
  [84.48900, 27.57600],
  [84.47600, 27.56100],
  [84.48000, 27.57250],
  [84.46500, 27.56800],
  [84.45600, 27.56500],
  [84.48500, 27.56800],
  [84.51500, 27.56200],
  [84.48000, 27.56500],
  [84.45508, 27.56190],
  [84.43000, 27.56000],
  [84.41006, 27.55335],
  [84.39000, 27.54700],
  [84.36828, 27.54331],
  [84.34700, 27.53800],
  [84.36815, 27.54380],
  [84.39000, 27.54700],
  [84.41070, 27.55304],
  [84.43000, 27.56200],
  [84.45216, 27.57115],
  [84.47660, 27.57445],
  [84.49900, 27.58300],
  [84.46000, 27.59000],
  [84.42350, 27.59200]
];

export const trip = {
  slug: "chitwan-wildlife-safari",
  title: "Chitwan Jungle Birding and Wildlife Safari",
  tagline: "Rhinos at dawn, hornbills overhead and a river full of kingfishers, all from one comfortable base.",
  kind: "wildlife-safari",
  guideRole: "lead-guide",
  region: "Chitwan National Park",
  regionSlug: "chitwan",
  durationDays: 4,
  difficulty: "easy",
  maxAltitudeM: 190,
  bestMonths: [10, 11, 12, 1, 2, 3],
  summary:
    "Four relaxed days in Nepal's best-known lowland jungle. Krishna leads you on dugout canoe rides, jungle walks and jeep drives, looking for everything from the Greater One-horned Rhinoceros to kingfishers and hornbills. Chitwan is one of the richest bird areas in Asia, with sal forest, tall grassland and river and lake edges, all within easy reach of a single lodge in Sauraha. Mornings are early, afternoons are slow, and every day ends with a bird list and a cold drink.",
  highlights: [
    "Dawn dugout-canoe drift on the Rapti River, with gharials, mugger crocodiles and kingfishers",
    "Greater One-horned Rhinoceros on foot with a naturalist, and from the safety of a jeep",
    "Great and Oriental Pied Hornbills in the sal forest canopy",
    "Bis Hazari Tal, a Ramsar-listed lake with jacanas, storks and fish-eagles",
    "Tall grasslands of Kasara, home of the Bengal Florican's spring display",
    "An evening among the Tharu people, with a stick dance and a local meal",
  ],
  cover: img(
    PH.forest,
    "Wide shot: Greater One-horned Rhinoceros grazing at the edge of tall grass in soft morning mist, Chitwan",
    { speciesIds: ["greater-one-horned-rhinoceros"], place: "Rapti River, Chitwan", altitudeM: 150, date: "2026-02", note: "grazing at river edge, mist, 07:10" },
    [0.5, 0.55],
  ),
  reel: [
    clip(
      PH.forest,
      "Clip, 16 s: dugout canoe gliding down the misty Rapti at dawn, a Great Egret lifting off the bank",
      { speciesIds: ["great-egret"], place: "Rapti River, Chitwan", altitudeM: 150, date: "2026-02", note: "canoe drift, 06:50" },
      16,
    ),
    img(
      PH.forest,
      "Wide shot: golden elephant-grass at sunrise at Kasara with a Spotted Deer herd walking through",
      { speciesIds: ["chital"], place: "Kasara, Chitwan National Park", altitudeM: 150, date: "2026-02", note: "herd in low sun, 07:20" },
      [0.5, 0.5],
    ),
    img(
      PH.forest,
      "Landscape: Great Hornbill perched on a bare sal branch, morning light on its yellow casque",
      { speciesIds: ["great-hornbill"], place: "Baghmara Community Forest, Chitwan", altitudeM: 150, date: "2026-02", note: "pair calling at canopy top, 08:00" },
      [0.5, 0.4],
    ),
    img(
      PH.plain,
      "Wide shot: Gharial basking on a sandbar on the Rapti with a Pied Kingfisher on a snag nearby",
      { speciesIds: ["gharial", "pied-kingfisher"], place: "Rapti River, Chitwan", altitudeM: 150, date: "2026-02", note: "adult on sandbar, mid-morning" },
      [0.5, 0.5],
    ),
    clip(
      PH.forest,
      "Clip, 15 s: Greater One-horned Rhinoceros wading and feeding in a pond at Bis Hazari Tal, egrets on its back",
      { speciesIds: ["greater-one-horned-rhinoceros", "cattle-egret"], place: "Bis Hazari Tal, Chitwan", altitudeM: 190, date: "2026-03", note: "feeding in shallows, 17:00" },
      15,
    ),
    img(
      PH.ridge,
      "Landscape: sunset over the Rapti River at Sauraha, Black-necked Stork silhouette on the far bank",
      { speciesIds: ["black-necked-stork"], place: "Sauraha, Chitwan", altitudeM: 150, date: "2026-02", note: "sunset, 17:50" },
      [0.5, 0.5],
    ),
  ],
  waypoints: [
    {
      id: "sauraha",
      name: "Sauraha",
      kind: "village",
      coords: [84.4936, 27.5747],
      altitudeM: 150,
      day: 1,
      nights: 3,
      stay: { kind: "lodge", note: "Garden lodge in Sauraha on the edge of the park; three nights in the same room" },
      habitat: ["village gardens", "river edge", "buffer-zone forest"],
      summary:
        "Our base for three nights on the north edge of the park. The lodge gardens are good for bee-eaters, barbets and sunbirds, and the Rapti River is a short walk away.",
      sightings: [
        ...seen("common", ["oriental-magpie-robin", "red-vented-bulbul", "black-drongo", "common-myna", "asian-pied-starling", "green-bee-eater", "rufous-treepie", "common-tailorbird", "coppersmith-barbet", "rose-ringed-parakeet", "rhesus-macaque"]),
        ...seen("likely", ["indian-roller", "lineated-barbet", "spotted-owlet", "greater-coucal", "long-tailed-shrike", "common-iora", "black-hooded-oriole", "common-hoopoe", "red-breasted-parakeet"]),
        one("black-crested-bulbul", "possible"),
        one("asian-koel", "likely", [3, 4, 5]),
        one("crimson-sunbird", "possible", [2, 3], "At the silk-cotton blossom"),
        one("silk-cotton-tree", "common", [2, 3], "Bare red-flowering branches"),
        one("common-mormon", "likely", [10, 11, 3, 4]),
      ],
      media: [
        img(PH.plain, "Landscape: the lodge garden at Sauraha at breakfast, binoculars and a bird list on the table, Rhesus Macaque on the wall", { place: "Sauraha, Chitwan", altitudeM: 150, date: "2026-02", note: "breakfast, 07:30" }),
        img(PH.forest, "Close: Indian Roller on a garden wire, in the clear morning light", { speciesIds: ["indian-roller"], place: "Sauraha, Chitwan", altitudeM: 150, date: "2026-02", note: "hunting from a wire, 07:45" }),
      ],
    },
    {
      id: "elephant-breeding-centre",
      name: "Elephant Breeding Centre, Khorsor",
      kind: "viewpoint",
      coords: [84.476, 27.561],
      altitudeM: 150,
      day: 1,
      nights: 0,
      habitat: ["sal forest edge", "grassland paddocks"],
      summary:
        "A gentle afternoon walk to meet the elephants and their calves, run by the park. The quiet sal edges around the compound are a good first look at the forest birds.",
      sightings: [
        one("asian-elephant", "common", undefined, "Seen at the breeding centre"),
        ...seen("common", ["cattle-egret", "black-drongo", "rufous-treepie"]),
        ...seen("likely", ["lineated-barbet", "indian-peafowl", "greater-racket-tailed-drongo", "red-junglefowl", "rhesus-macaque"]),
        one("sal", "common", undefined, "Sal forest around the compound"),
      ],
      media: [
        img(PH.forest, "Wide shot: elephant and calf at the Elephant Breeding Centre in late-afternoon light, sal forest behind", { speciesIds: ["asian-elephant"], place: "Elephant Breeding Centre, Chitwan", altitudeM: 150, date: "2026-02", note: "mother and calf, 16:10" }),
      ],
    },
    {
      id: "rapti-river",
      key: true,
      name: "Rapti River",
      kind: "river",
      coords: [84.479, 27.5715],
      altitudeM: 150,
      day: 2,
      nights: 0,
      habitat: ["river", "sandbars", "riverine forest", "tall grass"],
      summary:
        "We slip into a long dugout canoe in the cool of dawn and drift downriver in near silence. Gharials sun themselves on the sandbars, kingfishers hunt from the snags, and sometimes a rhinoceros wades in the shallows at the other bank.",
      sightings: [
        ...seen("common", ["pied-kingfisher", "white-throated-kingfisher", "great-egret", "little-egret", "intermediate-egret", "indian-pond-heron", "little-cormorant", "red-wattled-lapwing", "white-wagtail"]),
        ...seen("likely", ["common-kingfisher", "grey-heron", "oriental-darter", "river-lapwing", "river-tern", "great-thick-knee", "asian-openbill", "woolly-necked-stork", "gharial", "mugger-crocodile", "bengal-monitor", "greater-one-horned-rhinoceros", "chital"]),
        ...seen("possible", ["stork-billed-kingfisher", "black-necked-stork", "purple-heron", "grey-headed-fish-eagle", "lesser-adjutant", "black-crowned-night-heron", "wild-boar"]),
        one("grey-wagtail", "likely", COOL_SEASON),
        one("citrine-wagtail", "likely", WINTER),
        one("ruddy-shelduck", "likely", WINTER, "Pairs on the sandbars"),
        one("wood-sandpiper", "likely", COOL_SEASON),
        one("common-sandpiper", "likely", COOL_SEASON),
        one("small-pratincole", "possible", [3, 4, 5]),
        one("ibisbill", "rare", [12, 1, 2], "Winter visitor to the shingle bars"),
        one("smooth-coated-otter", "rare"),
        one("brown-fish-owl", "rare", undefined, "Roosting in a riverside tree"),
        one("bengal-tiger", "rare", undefined, "Tracks on the sand at dawn"),
      ],
      media: [
        clip(PH.forest, "Clip, 18 s: drifting past a Gharial on a sandbar from the canoe, mist rising off the Rapti", { speciesIds: ["gharial"], place: "Rapti River, Chitwan", altitudeM: 150, date: "2026-02", note: "adult basking, from canoe, 07:15" }, 18),
        img(PH.forest, "Wide shot: a dugout canoe on the misty Rapti at dawn, Krishna pointing out a kingfisher to two guests", { place: "Rapti River, Chitwan", altitudeM: 150, date: "2026-02", note: "canoe, 06:45" }),
        img(PH.plain, "Landscape: Mugger Crocodile basking on the river bank with Little Egrets stepping past", { speciesIds: ["mugger-crocodile", "little-egret"], place: "Rapti River, Chitwan", altitudeM: 150, date: "2026-02", note: "adult on mud bank, 09:00" }),
      ],
    },
    {
      id: "baghmara-community-forest",
      key: true,
      name: "Baghmara Community Forest",
      kind: "forest",
      coords: [84.515, 27.562],
      altitudeM: 150,
      day: 2,
      nights: 0,
      habitat: ["sal forest", "riverine scrub", "grassland"],
      summary:
        "A community-run buffer-zone forest where we walk slowly with a local naturalist, listening for woodpeckers, hornbills and pittas. Rhinoceros and Spotted Deer are regular, and we keep a respectful distance from the big animals.",
      sightings: [
        ...seen("common", ["red-junglefowl", "jungle-babbler", "common-iora", "greater-racket-tailed-drongo", "black-hooded-oriole", "chital"]),
        ...seen("likely", ["indian-peafowl", "oriental-pied-hornbill", "greater-flameback", "lesser-flameback", "fulvous-breasted-woodpecker", "lesser-necklaced-laughingthrush", "small-minivet", "golden-fronted-leafbird", "pin-striped-tit-babbler", "yellow-footed-green-pigeon", "tickells-blue-flycatcher", "bronzed-drongo", "greater-one-horned-rhinoceros", "northern-plains-gray-langur", "rhesus-macaque", "hog-deer", "wild-boar"]),
        ...seen("possible", ["great-hornbill", "blue-bearded-bee-eater", "orange-bellied-leafbird", "white-rumped-shama", "maroon-oriole", "lesser-yellownape", "grey-capped-pygmy-woodpecker", "jungle-owlet", "hill-myna", "sambar", "barking-deer", "indian-rock-python"]),
        one("orange-headed-thrush", "possible", [11, 12, 1, 2, 3]),
        one("chestnut-headed-bee-eater", "possible", [3, 4, 5]),
        one("asian-paradise-flycatcher", "possible", [3, 4, 5], "White males with long tails"),
        one("indian-pitta", "possible", [4, 5], "Arrives for the breeding season"),
        one("sloth-bear", "rare"),
        one("bengal-tiger", "rare"),
        one("leopard", "rare"),
        one("sal", "common"),
      ],
      media: [
        img(PH.forest, "Landscape: Krishna and guests on a quiet forest trail in Baghmara, sal trunks in dappled light", { place: "Baghmara Community Forest, Chitwan", altitudeM: 150, date: "2026-02", note: "walking group, 09:30" }),
        img(PH.forest, "Close, landscape crop: Oriental Pied Hornbill in a fruiting fig, black and white against green", { speciesIds: ["oriental-pied-hornbill"], place: "Baghmara Community Forest, Chitwan", altitudeM: 150, date: "2026-03", note: "feeding in fig, 08:15" }),
      ],
    },
    {
      id: "kasara",
      key: true,
      name: "Kasara and the Core Grasslands",
      kind: "park-gate",
      coords: [84.347, 27.538],
      altitudeM: 150,
      day: 3,
      nights: 0,
      habitat: ["tall grassland", "sal forest", "river bank", "oxbow wetlands"],
      summary:
        "A full-day jeep drive into the heart of the national park, via the Kasara headquarters. The great grasslands here are the home of the Bengal Florican, and the sal forest and wetlands bring hornbills, vultures and, with luck, a glimpse of the elusive big animals.",
      sightings: [
        ...seen("common", ["chital", "wild-boar", "red-junglefowl", "indian-peafowl", "plain-prinia", "common-iora", "rhesus-macaque"]),
        ...seen("likely", ["greater-one-horned-rhinoceros", "hog-deer", "black-francolin", "striated-grassbird", "chestnut-capped-babbler", "crested-serpent-eagle", "oriental-pied-hornbill", "gharial", "bengal-monitor", "northern-plains-gray-langur"]),
        ...seen("possible", ["great-hornbill", "swamp-francolin", "egyptian-vulture", "oriental-honey-buzzard", "sambar", "gaur", "mugger-crocodile", "indian-rock-python", "lesser-adjutant", "black-necked-stork", "woolly-necked-stork"]),
        one("bengal-florican", "possible", FLORICAN, "Male display flights over the grassland"),
        one("pied-harrier", "possible", WINTER),
        one("greater-spotted-eagle", "rare", WINTER),
        one("white-rumped-vulture", "rare"),
        one("jerdons-babbler", "rare", undefined, "Skulks in tall wet grass"),
        one("sloth-bear", "rare"),
        one("bengal-tiger", "rare"),
        one("leopard", "rare"),
        one("kans-grass", "common", [10, 11], "Silver plumes in the autumn light"),
      ],
      media: [
        img(PH.forest, "Wide shot: open-top jeep on the Kasara grassland track at sunrise, tall kans grass glowing gold", { place: "Kasara, Chitwan National Park", altitudeM: 150, date: "2026-02", note: "jeep safari, 07:00" }),
        img(PH.forest, "Landscape: Greater One-horned Rhinoceros in the Kasara grassland, tall grass and sal trees behind", { speciesIds: ["greater-one-horned-rhinoceros"], place: "Kasara, Chitwan National Park", altitudeM: 150, date: "2026-02", note: "female with calf, 08:20" }),
        img(PH.plain, "Close: male Bengal Florican mid-display above the Kasara grassland, wings spread", { speciesIds: ["bengal-florican"], place: "Kasara, Chitwan National Park", altitudeM: 150, date: "2026-03", note: "display flight, early morning" }),
      ],
    },
    {
      id: "tharu-village",
      name: "Tharu Village, Sauraha",
      kind: "village",
      coords: [84.499, 27.583],
      altitudeM: 150,
      day: 3,
      nights: 0,
      habitat: ["farmland", "village", "hedgerows"],
      summary:
        "An easy late-afternoon walk through a Tharu village with mud-and-thatch houses and golden fields. Weaver nests hang in the trees and the evening ends with a local meal and a stick dance.",
      sightings: [
        ...seen("common", ["baya-weaver", "black-drongo", "common-myna", "asian-pied-starling", "cattle-egret", "indian-pond-heron", "red-wattled-lapwing", "scaly-breasted-munia", "plain-prinia"]),
        ...seen("likely", ["indian-roller", "long-tailed-shrike", "common-hoopoe", "spotted-owlet", "rose-ringed-parakeet", "white-throated-kingfisher", "green-bee-eater", "shikra"]),
        one("citrine-wagtail", "likely", WINTER),
        one("plain-tiger", "likely", COOL_SEASON),
        one("common-rose", "possible", COOL_SEASON),
        one("lemon-pansy", "possible", COOL_SEASON),
      ],
      media: [
        img(PH.plain, "Wide shot: Tharu village lane at dusk, a mud-and-thatch house, smoke from a cooking fire, Baya Weaver nests in the tree", { speciesIds: ["baya-weaver"], place: "Tharu Village, Sauraha", altitudeM: 150, date: "2026-02", note: "weaver colony at dusk, 17:15" }),
      ],
    },
    {
      id: "bis-hazari-tal",
      key: true,
      name: "Bis Hazari Tal",
      kind: "wetland",
      coords: [84.4235, 27.592],
      altitudeM: 190,
      day: 4,
      nights: 0,
      stay: { kind: "none", note: "Last morning before the transfer to Kathmandu or Pokhara" },
      habitat: ["lake", "marsh", "sal forest"],
      summary:
        "The \"twenty thousand lakes\" of Bis Hazari, a Ramsar-listed wetland in the community forest north of the park. A last dawn walk around the shore gives jacanas, storks, kingfishers and, if we are lucky, rhinoceros bathing in the shallows.",
      sightings: [
        ...seen("common", ["lesser-whistling-duck", "little-grebe", "grey-headed-swamphen", "white-breasted-waterhen", "common-moorhen", "bronze-winged-jacana", "great-egret", "little-cormorant", "indian-pond-heron", "white-throated-kingfisher"]),
        ...seen("likely", ["cotton-pygmy-goose", "indian-spot-billed-duck", "purple-heron", "oriental-darter", "asian-openbill", "woolly-necked-stork", "pheasant-tailed-jacana", "oriental-pied-hornbill", "mugger-crocodile", "greater-one-horned-rhinoceros", "chital"]),
        ...seen("possible", ["black-necked-stork", "painted-stork", "lesser-adjutant", "grey-headed-fish-eagle", "great-hornbill", "stork-billed-kingfisher", "bengal-monitor", "sambar", "wild-boar"]),
        one("gadwall", "likely", WINTER),
        one("northern-pintail", "likely", WINTER),
        one("ferruginous-duck", "possible", WINTER),
        one("brown-fish-owl", "rare"),
        one("bengal-tiger", "rare"),
      ],
      media: [
        img(PH.forest, "Wide shot: sunrise over Bis Hazari Tal, mist on the water, water lilies in the foreground", { place: "Bis Hazari Tal, Chitwan", altitudeM: 190, date: "2026-02", note: "calm dawn, 06:30" }),
        img(PH.plain, "Landscape: Bronze-winged Jacana walking across lily pads, reflected in still water", { speciesIds: ["bronze-winged-jacana"], place: "Bis Hazari Tal, Chitwan", altitudeM: 190, date: "2026-02", note: "adult on lily pads, 07:20" }),
      ],
    },
  ],
  route,
  landmarkIds: ["chitwan-national-park"],
  reviewIds: ["ph-chitwan-a", "ph-chitwan-b"],
  includes: [
    "Krishna as your lead birding and wildlife guide",
    "Three nights at a lodge in Sauraha, with meals",
    "Dugout canoe, jungle walk and jeep safari",
    "Chitwan National Park entry fees (placeholder)",
    "Daily bird and wildlife checklist",
  ],
  pricing: { show: false, amount: 520, currency: "USD", per: "person", note: "Placeholder price; confirm with Krishna" },
  status: "published",
} satisfies Trip;
