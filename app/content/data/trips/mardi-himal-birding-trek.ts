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
const SPRING: Month[] = [3, 4, 5];
const BLOOM: Month[] = [3, 4];

/** Approximate line: Pokhara to Kande by road, up the Mardi ridge to the base camp, back down to
    Low Camp, east to Siding, and the road back to Pokhara. Kathmandu is joined by flight/drive. */
const route: LngLat[] = [
  [83.95750, 28.20870],
  [83.93000, 28.25000],
  [83.89000, 28.27500],
  [83.85000, 28.28000],
  [83.81760, 28.27450],
  [83.82600, 28.28400],
  [83.83440, 28.29670],
  [83.84400, 28.30500],
  [83.85200, 28.31600],
  [83.86250, 28.32900],
  [83.87000, 28.34300],
  [83.87950, 28.35750],
  [83.88900, 28.37100],
  [83.90100, 28.38600],
  [83.91200, 28.40500],
  [83.92450, 28.42450],
  [83.91200, 28.40500],
  [83.90100, 28.38600],
  [83.88900, 28.37100],
  [83.87950, 28.35750],
  [83.89300, 28.35500],
  [83.91000, 28.35200],
  [83.92550, 28.35400],
  [83.93500, 28.33000],
  [83.95000, 28.29000],
  [83.96000, 28.25000],
  [83.95750, 28.20870],
];

const kathmanduSightings: Sighting[] = [
  ...seen("common", ["black-kite", "large-billed-crow", "common-myna", "oriental-magpie-robin", "red-vented-bulbul", "spotted-dove"]),
  ...seen("likely", ["himalayan-bulbul", "eurasian-kestrel", "grey-wagtail"]),
  one("egyptian-vulture", "possible"),
];

const lowCampSightings: Sighting[] = [
  ...seen("common", ["rufous-vented-tit", "grey-crested-tit", "stripe-throated-yuhina", "chestnut-tailed-minla", "white-browed-fulvetta"]),
  ...seen("likely", ["spotted-laughingthrush", "hoary-throated-barwing", "spotted-nutcracker", "darjeeling-woodpecker", "yellow-browed-tit", "bar-tailed-treecreeper", "golden-breasted-fulvetta", "collared-grosbeak"]),
  ...seen("possible", ["himalayan-monal", "koklass-pheasant", "great-parrotbill", "yellow-throated-marten"]),
  one("satyr-tragopan", "rare", SPRING, "Calling from the steep forest below the ridge"),
  one("fire-tailed-sunbird", "likely", [4, 5, 6]),
  one("rhododendron-barbatum", "likely", BLOOM),
  one("rhododendron-arboreum", "common", BLOOM),
];

export const trip = {
  slug: "mardi-himal-birding-trek",
  title: "Mardi Himal Birdwatching Trek",
  tagline: "Up a rhododendron ridge to the foot of Machhapuchhre, with time for every flock in the forest.",
  kind: "birding-trek",
  guideRole: "lead-guide",
  region: "Annapurna Conservation Area",
  durationDays: 9,
  difficulty: "moderate",
  maxAltitudeM: 4500,
  bestMonths: [3, 4, 5, 10, 11],
  summary:
    "The Mardi Himal Trek is one of Nepal's most scenic short treks, and its dense rhododendron and oak forest sections are exceptional for birding. This 9-day itinerary pairs the classic trek to Mardi Himal Base Camp with dedicated birding time in the forest zones.",
  highlights: [
    "Close-up views of Machhapuchhre (Fish Tail) and the Annapurna range",
    "Rich rhododendron forest birding: laughingthrushes, minivets, and Himalayan pheasants",
    "Base Camp viewpoint at 4,500 m",
    "Moderate difficulty, suitable for trekkers with some hiking experience",
  ],
  cover: img(
    PH.snow,
    "Wide shot: Machhapuchhre at sunrise from the Mardi Himal ridge, the trail running up the grassy crest in the foreground",
    { landmarkId: "machhapuchhre", place: "Mardi Himal Base Camp", altitudeM: 4500, date: "2025-11", note: "first light on the fishtail, 06:10" },
    [0.5, 0.35],
  ),
  reel: [
    clip(
      PH.snow,
      "Clip, 16 s: first light moving down Machhapuchhre and Annapurna South from Mardi Himal Base Camp, prayer flags in the wind",
      { landmarkId: "machhapuchhre", place: "Mardi Himal Base Camp", altitudeM: 4500, date: "2025-11", note: "sunrise, 06:05" },
      16,
    ),
    img(
      PH.forest,
      "Wide shot: mossy oak and rhododendron forest between Forest Camp and Low Camp, mist hanging in the trees",
      { speciesIds: ["rhododendron-arboreum"], place: "Forest Camp, Mardi Himal", altitudeM: 2600, date: "2026-04", note: "red blooms in the mist" },
      [0.5, 0.5],
    ),
    img(
      PH.forest,
      "Close, landscape crop: male Himalayan Monal on the open ridge above High Camp, copper and green in low sun",
      { speciesIds: ["himalayan-monal"], place: "High Camp, Mardi Himal", altitudeM: 3600, date: "2025-11", note: "male feeding on the slope, 07:20" },
      [0.5, 0.45],
    ),
    img(
      PH.forest,
      "Landscape: a pair of Scarlet Minivets in a mossy oak below Low Camp, red and yellow against the green",
      { speciesIds: ["scarlet-minivet"], place: "Low Camp, Mardi Himal", altitudeM: 2900, date: "2026-04", note: "pair in the canopy, 08:30" },
      [0.5, 0.5],
    ),
    img(
      PH.plain,
      "Landscape: Krishna and guests with binoculars on the ridge trail above Low Camp, Machhapuchhre behind",
      { landmarkId: "machhapuchhre", place: "Badal Danda, Mardi Himal", altitudeM: 3200, date: "2025-11", note: "group watching a raptor" },
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
        img(PH.plain, "Landscape: Black Kites circling over Kathmandu rooftops and temple spires in the late afternoon", { speciesIds: ["black-kite"], landmarkId: "kathmandu", place: "Kathmandu", altitudeM: 1400, date: "2025-11", note: "kites over the old town, 16:30" }),
      ],
    },
    {
      id: "pokhara",
      name: "Pokhara, Phewa Lake",
      kind: "wetland",
      coords: [83.9575, 28.2087],
      altitudeM: 800,
      day: 2,
      nights: 1,
      stay: { kind: "hotel", note: "Lakeside hotel by Phewa Lake" },
      habitat: ["lake shore", "reed beds", "gardens"],
      summary: "Travel to Pokhara by road or a short flight, and an evening by Phewa Lake.",
      sightings: [
        ...seen("common", ["little-cormorant", "indian-pond-heron", "cattle-egret", "white-throated-kingfisher", "black-kite", "red-vented-bulbul"]),
        ...seen("likely", ["pied-kingfisher", "common-kingfisher", "little-egret", "himalayan-griffon", "oriental-magpie-robin"]),
        one("great-cormorant", "possible", WINTER),
      ],
      media: [
        img(PH.ridge, "Wide shot: Phewa Lake at dusk with painted boats at the shore and Machhapuchhre faint above the hills", { landmarkId: "phewa-lake", place: "Phewa Lake, Pokhara", altitudeM: 800, date: "2025-11", note: "evening, 17:20" }),
      ],
    },
    {
      id: "kande",
      name: "Kande",
      kind: "village",
      coords: [83.8176, 28.2745],
      altitudeM: 1770,
      day: 3,
      nights: 0,
      habitat: ["roadside scrub", "terraced fields", "broadleaf forest edge"],
      summary: "Drive to Kande and begin the trek, climbing straight into birding-rich forest.",
      sightings: [
        ...seen("common", ["himalayan-bulbul", "great-barbet", "grey-hooded-warbler", "oriental-white-eye", "black-throated-tit"]),
        ...seen("likely", ["grey-treepie", "slaty-headed-parakeet", "verditer-flycatcher", "long-tailed-minivet", "black-bulbul", "himalayan-griffon"]),
        one("spiny-babbler", "possible", undefined, "Singing from the scrub above the road"),
      ],
      media: [
        img(PH.forest, "Landscape: the stone trail leaving Kande into the forest, terraced hills and the road below", { place: "Kande, Mardi Himal trail", altitudeM: 1770, date: "2025-11", note: "start of the trek, 09:00" }),
      ],
    },
    {
      id: "forest-camp",
      key: true,
      name: "Forest Camp",
      kind: "camp",
      coords: [83.8625, 28.329],
      altitudeM: 2520,
      day: 3,
      nights: 1,
      stay: { kind: "teahouse", note: "Small teahouse in a forest clearing" },
      habitat: ["oak–rhododendron forest", "mossy broadleaf forest"],
      summary:
        "The first overnight stop, deep in the forest. The last hour of light and the first hour of morning here are for mixed flocks of sibias, yuhinas and minlas, and Kalij Pheasants on the trail.",
      sightings: [
        ...seen("common", ["rufous-sibia", "whiskered-yuhina", "green-backed-tit", "blue-winged-minla", "chestnut-crowned-laughingthrush"]),
        ...seen("likely", ["kalij-pheasant", "striated-laughingthrush", "white-throated-laughingthrush", "rufous-winged-fulvetta", "nepal-fulvetta", "mrs-goulds-sunbird", "scarlet-minivet", "yellow-billed-blue-magpie", "himalayan-langur"]),
        ...seen("possible", ["koklass-pheasant", "hill-partridge", "himalayan-cutia", "great-parrotbill", "barking-deer"]),
        one("himalayan-cuckoo", "likely", [4, 5]),
        one("large-hawk-cuckoo", "likely", [4, 5]),
        one("rhododendron-arboreum", "common", BLOOM),
      ],
      media: [
        img(PH.forest, "Landscape: Chestnut-crowned Laughingthrush on a mossy branch near Forest Camp, soft forest light", { speciesIds: ["chestnut-crowned-laughingthrush"], place: "Forest Camp, Mardi Himal", altitudeM: 2520, date: "2026-04", note: "pair at the forest edge, 06:50" }),
        img(PH.forest, "Wide shot: the teahouse clearing at Forest Camp at dusk, smoke from the kitchen, tall rhododendrons around", { place: "Forest Camp, Mardi Himal", altitudeM: 2520, date: "2025-11", note: "evening, 17:30" }),
      ],
    },
    {
      id: "low-camp",
      key: true,
      name: "Low Camp",
      kind: "camp",
      coords: [83.8795, 28.3575],
      altitudeM: 2970,
      day: 4,
      nights: 1,
      stay: { kind: "teahouse", note: "Teahouse at the top of the forest, with a first view of Machhapuchhre" },
      habitat: ["oak–rhododendron forest", "bamboo patches", "ridge-top forest"],
      summary:
        "A full birding-and-trekking day through dense rhododendron and oak forest, prime habitat for pheasants and laughingthrushes.",
      sightings: lowCampSightings,
      media: [
        img(PH.forest, "Landscape: Spotted Laughingthrush in the bamboo understorey below Low Camp, white spots bright in the shade", { speciesIds: ["spotted-laughingthrush"], place: "Low Camp, Mardi Himal", altitudeM: 2970, date: "2026-04", note: "foraging in leaf litter, 08:10" }),
        img(PH.ridge, "Wide shot: Machhapuchhre above the treetops from Low Camp in the late afternoon", { landmarkId: "machhapuchhre", place: "Low Camp, Mardi Himal", altitudeM: 2970, date: "2025-11", note: "clear afternoon, 15:40" }),
      ],
    },
    {
      id: "high-camp",
      key: true,
      name: "High Camp",
      kind: "camp",
      coords: [83.901, 28.386],
      altitudeM: 3580,
      day: 5,
      nights: 1,
      stay: { kind: "teahouse", note: "Basic teahouse on the open ridge; cold nights" },
      habitat: ["rhododendron scrub", "open ridgeline", "alpine grassland"],
      summary:
        "Continue ascending as forest gives way to rhododendron scrub and open ridgeline, watching for high-altitude species and raptors.",
      sightings: [
        ...seen("common", ["rufous-breasted-accentor", "white-browed-fulvetta", "large-billed-crow", "yellow-billed-chough"]),
        ...seen("likely", ["himalayan-monal", "blood-pheasant", "white-collared-blackbird", "dark-breasted-rosefinch", "himalayan-white-browed-rosefinch", "lammergeier", "himalayan-griffon"]),
        ...seen("possible", ["golden-eagle", "himalayan-tahr"]),
        one("alpine-accentor", "likely", WINTER),
        one("grandala", "possible", WINTER, "Blue flocks over the ridge in winter"),
        one("rhododendron-campanulatum", "likely", [4, 5]),
        one("rhododendron-lepidotum", "possible", [5, 6]),
      ],
      media: [
        img(PH.snow, "Wide shot: High Camp teahouses on the open ridge with Machhapuchhre and Mardi Himal behind, late light", { landmarkId: "machhapuchhre", place: "High Camp, Mardi Himal", altitudeM: 3580, date: "2025-11", note: "evening, 16:50" }),
        img(PH.forest, "Landscape: Lammergeier sailing along the ridge below High Camp, rusty chest lit by the sun", { speciesIds: ["lammergeier"], place: "High Camp, Mardi Himal", altitudeM: 3580, date: "2025-11", note: "low pass along the ridge, 10:15" }),
      ],
    },
    {
      id: "mardi-himal-base-camp",
      key: true,
      name: "Mardi Himal Base Camp",
      kind: "viewpoint",
      coords: [83.9245, 28.4245],
      altitudeM: 4500,
      day: 6,
      nights: 0,
      habitat: ["alpine grassland", "scree", "moraine"],
      summary:
        "An early start for the viewpoint at Mardi Himal Base Camp (4,500 m) and sunrise views of Machhapuchhre and Annapurna South. Snow Pigeons, choughs and accentors work the slopes around us.",
      sightings: [
        ...seen("likely", ["snow-pigeon", "yellow-billed-chough", "red-billed-chough", "lammergeier", "himalayan-griffon", "plain-mountain-finch"]),
        ...seen("possible", ["himalayan-snowcock", "golden-eagle", "white-winged-redstart", "wallcreeper", "himalayan-tahr", "large-eared-pika"]),
        one("alpine-accentor", "likely", WINTER),
        one("grandala", "possible", WINTER),
        one("indian-tortoiseshell", "possible", [4, 5, 10], "Basking on warm stones"),
      ],
      media: [
        img(PH.snow, "Wide shot: Machhapuchhre's twin summit at sunrise from Mardi Himal Base Camp, trekkers small on the ridge", { landmarkId: "machhapuchhre", place: "Mardi Himal Base Camp", altitudeM: 4500, date: "2025-11", note: "sunrise, 06:10" }),
        img(PH.ridge, "Landscape: a flock of Snow Pigeons wheeling across the slope below the base camp, Annapurna South behind", { speciesIds: ["snow-pigeon"], landmarkId: "annapurna-south", place: "Mardi Himal Base Camp", altitudeM: 4400, date: "2025-11", note: "flock in flight, 07:30" }),
      ],
      views: ["machhapuchhre", "annapurna-south", "hiunchuli", "annapurna-i"],
    },
    {
      id: "low-camp-return",
      name: "Low Camp",
      kind: "camp",
      coords: [83.8795, 28.3575],
      altitudeM: 2970,
      day: 6,
      nights: 1,
      stay: { kind: "teahouse", note: "Back at the Low Camp teahouse" },
      habitat: ["oak–rhododendron forest", "bamboo patches"],
      summary: "Then we descend the ridge to Low Camp for the night, with a second chance at the forest birds.",
      sightings: lowCampSightings,
      media: [
        img(PH.forest, "Landscape: Hoary-throated Barwing in a mossy rhododendron near Low Camp, late afternoon light", { speciesIds: ["hoary-throated-barwing"], place: "Low Camp, Mardi Himal", altitudeM: 2970, date: "2025-11", note: "small party in the canopy, 16:10" }),
      ],
    },
    {
      id: "siding",
      name: "Siding",
      kind: "village",
      coords: [83.9255, 28.354],
      altitudeM: 1750,
      day: 7,
      nights: 1,
      stay: { kind: "homestay", note: "Village homestay or small lodge" },
      habitat: ["broadleaf forest", "terraced fields", "stream"],
      summary:
        "Trek down through the forest again, this time in daylight for full birding coverage, ending at Siding village.",
      sightings: [
        ...seen("common", ["grey-treepie", "himalayan-bulbul", "black-bulbul", "plumbeous-water-redstart", "oriental-magpie-robin", "great-barbet"]),
        ...seen("likely", ["blue-whistling-thrush", "slaty-headed-parakeet", "grey-wagtail", "spotted-forktail", "kalij-pheasant", "brown-dipper", "verditer-flycatcher"]),
        ...seen("possible", ["spiny-babbler", "crested-kingfisher", "himalayan-goral"]),
        one("white-capped-redstart", "likely", WINTER),
      ],
      media: [
        img(PH.plain, "Wide shot: Siding village with stone houses and terraced fields above the Mardi Khola, forest on the slopes", { place: "Siding, Mardi Himal", altitudeM: 1750, date: "2025-11", note: "afternoon light" }),
      ],
    },
    {
      id: "pokhara-return",
      name: "Pokhara",
      kind: "town",
      coords: [83.9575, 28.2087],
      altitudeM: 800,
      day: 8,
      nights: 1,
      stay: { kind: "hotel", note: "Lakeside hotel by Phewa Lake" },
      habitat: ["lake shore", "gardens"],
      summary: "A short walk out to the roadhead and the drive back to Pokhara, with a free afternoon by the lake.",
      sightings: [
        ...seen("common", ["little-cormorant", "white-throated-kingfisher", "black-kite", "red-vented-bulbul", "cattle-egret"]),
        ...seen("likely", ["pied-kingfisher", "himalayan-griffon", "red-wattled-lapwing", "oriental-magpie-robin"]),
      ],
      media: [
        img(PH.plain, "Landscape: Pied Kingfisher hovering over Phewa Lake on a quiet afternoon, boats moored behind", { speciesIds: ["pied-kingfisher"], landmarkId: "phewa-lake", place: "Phewa Lake, Pokhara", altitudeM: 800, date: "2025-11", note: "hovering, 15:00" }),
      ],
    },
    {
      id: "kathmandu-departure",
      transit: true,
      name: "Kathmandu",
      kind: "town",
      coords: [85.3123, 27.7154],
      altitudeM: 1400,
      day: 9,
      nights: 0,
      stay: { kind: "none", note: "Departure transfer to the airport" },
      habitat: ["city gardens"],
      summary: "Return to Kathmandu by road or air, and the departure transfer.",
      sightings: kathmanduSightings,
      media: [
        img(PH.ridge, "Wide shot: the Kathmandu Valley from the air, hills and terraces under a clear sky", { landmarkId: "kathmandu", place: "Kathmandu Valley", altitudeM: 1400, date: "2025-11", note: "flight back, morning" }),
      ],
    },
  ],
  route,
  landmarkIds: [
    "pokhara",
    "phewa-lake",
    "annapurna-conservation-area",
    "annapurna-himal",
    "machhapuchhre",
    "annapurna-south",
    "hiunchuli",
    "annapurna-i",
  ],
  reviewIds: [],
  includes: [
    "Kathmandu–Pokhara transport",
    "Teahouse accommodation during trek",
    "All meals during the trek",
    "ACAP and TIMS permits",
    "Expert trekking and birding guide, porter support",
  ],
  excludes: ["International flights and visa", "Personal trekking gear", "Tips and personal expenses"],
  status: "published",
} satisfies Trip;
