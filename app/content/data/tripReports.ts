import type { TripReport } from "../types";

/*
 * Trip reports: one blog-style page per past departure (/trip-reports/<slug>/). Newest first is
 * worked out by the getters, so order here doesn't matter.
 *
 * To add a report, copy the one below and change everything: a new slug, an existing published trip
 * (tripSlug), species ids from app/content/data/catalog/species.ts, and photos (mock photos live in
 * public/media/mock/; see app/content/data/media/mock.ts for what each one shows).
 *
 * PLACEHOLDER: the guests and story are invented to show the layout; the birds and places are real.
 */
export const tripReports = [
  {
    slug: "phulchowki-march-2026",
    title: "Forktails, sunbirds and a picnic by the stream",
    tripSlug: "phulchowki-birding-day",
    date: "2026-03-14",
    guests: "Placeholder Guest E and partner, United States",
    summary:
      "A bright March day on Phulchowki with two first-time birders: rhododendrons in bloom, Mrs. Gould's Sunbird at the flowers, a Spotted Forktail at lunch and griffons over the summit.",
    cover: {
      kind: "image",
      src: "/media/mock/bird_sunbird_landscape_010.jpg",
      alt: "A red sunbird feeding among pink and yellow blossoms",
      width: 4520,
      height: 3389,
      observation: { speciesIds: ["mrs-goulds-sunbird"], place: "Phulchowki", altitudeM: 2300, date: "2026-03-14", note: "male at rhododendron flowers, 07:50" },
    },
    body: [
      {
        kind: "text",
        paragraphs: [
          "My guests had spent four days in Kathmandu's temples and traffic, and they told me in the car that they had never really been birding before. I like days like that. We were at the gate of the Godavari botanical garden at six, with mist still lying on the lawns, and within ten minutes a pair of Red-billed Blue Magpies sailed across the path with their long tails trailing behind them.",
          "We walked slowly along the stream through the garden. Scarlet Minivets in the treetops, Himalayan Bulbuls everywhere, and a Great Barbet calling its loud pi-ooo until we finally found it at the very top of a tree. By eight o'clock they had both learned to stop and listen before looking.",
        ],
      },
      {
        kind: "image",
        image: {
          kind: "image",
          src: "/media/mock/bird_laughingthrush_landscape_063.jpg",
          alt: "Two brown laughingthrushes perched among ferns and berries",
          width: 4322,
          height: 2881,
          observation: { speciesIds: ["streaked-laughingthrush"], place: "Lower Phulchowki Forest", altitudeM: 1750, date: "2026-03-14", note: "pair in the ferns, 09:30" },
        },
        caption: "Laughingthrushes are always in pairs or noisy little groups. Listen for them first.",
      },
      {
        kind: "text",
        paragraphs: [
          "Higher up the road the forest turns mossy and green, and this is where the mixed flocks move through. We stood still on one bend for half an hour while yuhinas, minlas, sibias and two kinds of sunbird worked the same oak. Then, at the first big rhododendron in flower, a male Mrs. Gould's Sunbird came in to feed. Crimson, yellow and that long blue tail. My guest put her camera down and just watched.",
        ],
      },
      {
        kind: "gallery",
        images: [
          {
            kind: "image",
            src: "/media/mock/bird_bulbul_landscape_033.jpg",
            alt: "A small bird perched on a moss-covered branch against a bright background",
            width: 4353,
            height: 3304,
            observation: { speciesIds: ["himalayan-bulbul"], place: "National Botanical Garden, Godavari", altitudeM: 1500, date: "2026-03-14" },
          },
          {
            kind: "image",
            src: "/media/mock/bird_white-tailed-robin_landscape_001.jpg",
            alt: "A blue bird on a bamboo stem, bright green behind it",
            width: 4445,
            height: 3339,
            observation: { speciesIds: ["large-niltava"], place: "Phulchowki Mai Temple", altitudeM: 2100, date: "2026-03-14" },
          },
          {
            kind: "image",
            src: "/media/mock/bird_kalij-pheasant_landscape_066.jpg",
            alt: "A Kalij Pheasant with blue-black plumage walking on leaf litter",
            width: 5184,
            height: 3888,
            observation: { speciesIds: ["kalij-pheasant"], place: "Lower Phulchowki Forest", altitudeM: 1800, date: "2026-03-14" },
          },
        ],
        caption: "A few of the morning's birds, from the garden to the temple.",
      },
      {
        kind: "text",
        paragraphs: [
          "We had lunch on the stone steps of the Phulchowki Mai temple, and as always I asked them to keep one eye on the stream. A Spotted Forktail came bobbing along the wet rocks a few metres from our feet, then a White-capped Redstart, then a Little Forktail. Nobody finished their sandwich for a good while.",
          "In the afternoon we climbed into the cool upper forest, where the rhododendrons were at their best, and reached the summit at three. The Langtang range was hidden in haze that day, but two Himalayan Griffons came up on a thermal right past us. Thirty-four species for two people who had never been birding. I think we made two birders.",
        ],
      },
      {
        kind: "image",
        image: {
          kind: "image",
          src: "/media/mock/landscape_cloud-forest-trail_portrait_062.jpg",
          alt: "A misty, mossy trail beneath gnarled trees, a lone walker ahead",
          width: 3072,
          height: 4096,
          observation: { place: "Upper Phulchowki forest", altitudeM: 2500, date: "2026-03-14", note: "mist coming in, 13:40" },
        },
      },
    ],
    groupPhotos: [
      {
        kind: "image",
        src: "/media/mock/people_birdwatching-group_landscape_046.jpg",
        alt: "The group on a red dirt trail, binoculars raised towards the trees",
        width: 4608,
        height: 3456,
      },
      {
        kind: "image",
        src: "/media/mock/people_guided-group-forest_portrait_048.jpg",
        alt: "Guests on a forest road, one pointing ahead at a bird",
        width: 3229,
        height: 4608,
      },
      {
        kind: "image",
        src: "/media/mock/people_trekkers-hill-road_landscape_047.jpg",
        alt: "The group walking a dirt road through misty green hills",
        width: 3939,
        height: 3336,
      },
    ],
    seen: [
      "red-billed-blue-magpie",
      "himalayan-bulbul",
      "great-barbet",
      "oriental-white-eye",
      "black-throated-tit",
      "green-backed-tit",
      "grey-hooded-warbler",
      "scarlet-minivet",
      "long-tailed-minivet",
      "verditer-flycatcher",
      "blue-whistling-thrush",
      "streaked-laughingthrush",
      "kalij-pheasant",
      "rufous-sibia",
      "whiskered-yuhina",
      "blue-winged-minla",
      "white-throated-laughingthrush",
      "chestnut-crowned-laughingthrush",
      "striated-laughingthrush",
      "green-tailed-sunbird",
      "mrs-goulds-sunbird",
      "fire-tailed-sunbird",
      "spotted-forktail",
      "little-forktail",
      "white-capped-redstart",
      "plumbeous-water-redstart",
      "rufous-bellied-niltava",
      "large-niltava",
      "yellow-bellied-fantail",
      "grey-winged-blackbird",
      "hoary-throated-barwing",
      "rufous-vented-tit",
      "spotted-nutcracker",
      "himalayan-griffon",
      "assamese-macaque",
      "barking-deer",
      "common-mormon",
      "rhododendron-arboreum",
      "rhododendron-barbatum",
    ],
    reviewId: "ph-phulchowki-a",
  },
] satisfies TripReport[];
