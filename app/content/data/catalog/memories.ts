import type { ImageAsset, Memory, Observation } from "~/content/types";

/**
 * PLACEHOLDER memories. The moments, guests and stories are invented to show the layout (the
 * places, seasons and species are real and plausible); Krishna replaces each with a real
 * moment from a past trip, its photos and, where agreed, the guests' names.
 */

const PH = {
  plain: "/media/placeholder.svg",
  forest: "/media/placeholder-forest.svg",
  ridge: "/media/placeholder-ridge.svg",
  snow: "/media/placeholder-snow.svg",
} as const;

const img = (src: string, alt: string, observation: Observation): ImageAsset => ({
  kind: "image",
  src,
  alt,
  observation,
});

export const memories = [
  /* --------------------------------------------------- Annapurna birding trek */
  {
    id: "mem-annapurna-tadapani-pheasants",
    tripSlug: "annapurna-birding-trek",
    waypointId: "tadapani",
    date: "2025-04",
    guests: "Placeholder Guest A and partner, Germany",
    title: "The pheasant that walked into breakfast",
    story: [
      "We had reached Tadapani the evening before in thick cloud, and I had told my guests only that morning would show us what the place was. At first light I woke them for a cup of tea on the doorstep. The clearing was grey and still, and then, from the ravine below, a Himalayan Monal began to call.",
      "We waited, tea going cold, until a Kalij Pheasant stepped out of the rhododendrons and walked straight across the open ground with its tail low. Right behind it the sun reached the ridge, and the blooms along the trail turned scarlet all at once. A Fire-tailed Sunbird dropped into the nearest flower, so close we could see the red in its tail.",
      "My guests said nothing for a full minute. That, to me, is the best sort of silence.",
    ],
    seen: ["kalij-pheasant", "himalayan-monal", "blue-fronted-redstart", "fire-tailed-sunbird", "rhododendron-arboreum", "himalayan-langur"],
    media: [
      img(PH.forest, "Wide shot: the Tadapani clearing at first light, two guests on the teahouse doorstep with tea and binoculars, rhododendron blooms along the path", { speciesIds: ["rhododendron-arboreum"], place: "Tadapani, Annapurna", altitudeM: 2630, date: "2025-04", note: "dawn at the clearing, 06:00" }),
      img(PH.forest, "Landscape: male Kalij Pheasant crossing the Tadapani clearing, low sun on its crest", { speciesIds: ["kalij-pheasant"], place: "Tadapani, Annapurna", altitudeM: 2630, date: "2025-04", note: "male walking the clearing, 06:12" }),
      img(PH.forest, "Close, landscape crop: Fire-tailed Sunbird at a rhododendron flower, long scarlet tail showing", { speciesIds: ["fire-tailed-sunbird"], place: "Tadapani, Annapurna", altitudeM: 2630, date: "2025-04", note: "feeding at flower, 06:25" }),
    ],
    reviewId: "ph-annapurna-a",
  },
  {
    id: "mem-annapurna-poon-hill-dawn",
    tripSlug: "annapurna-birding-trek",
    waypointId: "poon-hill",
    date: "2025-04",
    guests: "Placeholder Guests G and H, Canada",
    title: "A wall of mountains and one very loud monal",
    story: [
      "We left Ghorepani at four in the morning with headlamps, climbing in the dark behind a line of other trekkers. I always warn my guests that a bird is as good a reason to climb as the view. Halfway up, somewhere below us in the black forest, a Himalayan Monal began to call.",
      "By the time we reached the top the sky had gone pink. Dhaulagiri stood on the left and Annapurna South and Machhapuchhre were catching the first light, each one turning gold in turn. Behind us a Lammergeier slid along the ridge, long-winged and rust-coloured, and my guests, who had come for the mountains, spent the next ten minutes with their heads tilted back.",
    ],
    seen: ["himalayan-monal", "lammergeier", "rufous-breasted-accentor", "spotted-nutcracker"],
    media: [
      img(PH.ridge, "Wide shot: crowds and headlamps on the Poon Hill viewpoint at blue hour, Dhaulagiri a pale wall behind", { landmarkId: "dhaulagiri-i", place: "Poon Hill, Annapurna", altitudeM: 3210, date: "2025-04", note: "blue hour, 05:30" }),
      img(PH.ridge, "Landscape: alpenglow on Annapurna South and Machhapuchhre seen from Poon Hill, a Lammergeier crossing the sky", { speciesIds: ["lammergeier"], place: "Poon Hill, Annapurna", altitudeM: 3210, date: "2025-04", note: "adult gliding along the ridge, 06:10" }),
      img(PH.forest, "Close: Rufous-breasted Accentor hopping at the Poon Hill viewpoint wall, mountains blurred behind", { speciesIds: ["rufous-breasted-accentor"], place: "Poon Hill, Annapurna", altitudeM: 3210, date: "2025-04", note: "hopping on the wall, 07:00" }),
    ],
  },
  {
    id: "mem-annapurna-bamboo-parrotbill",
    tripSlug: "annapurna-birding-trek",
    waypointId: "bamboo",
    date: "2025-11",
    guests: "Placeholder Guest B and a friend, Netherlands",
    title: "Waiting for the parrotbill",
    story: [
      "We reached Bamboo wet and tired after the long walk down from the Sanctuary. I told my guests I had heard something moving in the bamboo behind the teahouse, and they were too tired to argue. We stood in the drizzle for half an hour, watching a flock of fulvettas and a Golden Bush-Robin, and then it appeared.",
      "A Great Parrotbill is a big, soft, brown bird with a stubby yellow bill, and it came out onto a bamboo stem and calmly started stripping shoots, two metres away. My guest forgot his tiredness completely. He later said it was the bird of the trek, more than the snow peaks.",
    ],
    seen: ["great-parrotbill", "golden-breasted-fulvetta", "himalayan-bluetail", "golden-bush-robin", "white-browed-fulvetta"],
    media: [
      img(PH.forest, "Landscape: Great Parrotbill gripping a bamboo stem, drizzle and moss behind", { speciesIds: ["great-parrotbill"], place: "Bamboo, Annapurna", altitudeM: 2335, date: "2025-11", note: "stripping bamboo shoots, 15:40" }),
      img(PH.forest, "Wide shot: two guests standing in the drizzle behind the Bamboo teahouse, binoculars up toward the bamboo wall", { place: "Bamboo, Annapurna", altitudeM: 2335, date: "2025-11", note: "waiting in drizzle, 15:20" }),
    ],
    reviewId: "ph-annapurna-b",
  },
  {
    id: "mem-annapurna-abc-snow-pigeons",
    tripSlug: "annapurna-birding-trek",
    waypointId: "annapurna-base-camp",
    date: "2025-11",
    guests: "Placeholder Guests I and J, United States",
    title: "Snow pigeons at the end of the world",
    story: [
      "It was minus eight when we crept out of the lodge for sunrise at Annapurna Base Camp, and nobody spoke. The south face of Annapurna I went from grey to pink to gold, and then a flock of about forty Snow Pigeons came up out of the dark cliffs and crossed it. I will never forget the sound of the wingbeats in that silence.",
      "Later, on the moraine, an Alpine Accentor hopped almost to my guests' boots, and a Large-eared Pika called from the boulders. My guests said it was the coldest and happiest morning of their lives.",
    ],
    seen: ["snow-pigeon", "lammergeier", "alpine-accentor", "blue-sheep", "large-eared-pika", "yellow-billed-chough"],
    media: [
      img(PH.snow, "Wide shot: Annapurna I turning gold at dawn above the Sanctuary, a small flock of Snow Pigeons crossing the face", { speciesIds: ["snow-pigeon"], landmarkId: "annapurna-i", place: "Annapurna Base Camp", altitudeM: 4130, date: "2025-11", note: "flock of c.40, 06:50" }),
      img(PH.snow, "Landscape: Alpine Accentor on a rock at Annapurna Base Camp, frost on the stones, snow peaks behind", { speciesIds: ["alpine-accentor"], place: "Annapurna Base Camp", altitudeM: 4130, date: "2025-11", note: "on frosty rock, 07:30" }),
      img(PH.snow, "Close: Large-eared Pika on a boulder at the Sanctuary, mid-call", { speciesIds: ["large-eared-pika"], place: "Annapurna Base Camp", altitudeM: 4130, date: "2025-11", note: "calling from boulder, 08:15" }),
    ],
  },
  {
    id: "mem-annapurna-last-list",
    tripSlug: "annapurna-birding-trek",
    date: "2025-04",
    guests: "Placeholder Guests K and L, Australia",
    title: "The last evening's list",
    story: [
      "On the final night in Ghandruk, with the slate roofs still warm from the sun, we sat on the guesthouse terrace and went through the week's list. It had started with Brown Dippers at the river by Birethanti, and it ended with a Himalayan Monal, Great Barbets, forktails and a hillside of rhododendron.",
      "My guests were most pleased with the small ones, a sunbird on a flower, a bulbul on a wall. A trek like this, I tell people, is a long walk in the company of friends who happen to have wings.",
    ],
    seen: ["himalayan-monal", "brown-dipper", "great-barbet", "spotted-forktail", "rhododendron-arboreum"],
    media: [
      img(PH.plain, "Wide shot: guests and Krishna on the Ghandruk guesthouse terrace at sunset, a notebook and bird list on the table, Annapurna South in the distance", { landmarkId: "annapurna-south", place: "Ghandruk, Annapurna", altitudeM: 1940, date: "2025-04", note: "evening list, 18:30" }),
      img(PH.plain, "Close: a hand-written bird checklist with ticks, a mug of tea and binoculars on a wooden table", { place: "Ghandruk, Annapurna", altitudeM: 1940, date: "2025-04", note: "end-of-trek checklist" }),
    ],
  },

  /* -------------------------------------------------------- Chitwan safari */
  {
    id: "mem-chitwan-rapti-dawn",
    tripSlug: "chitwan-wildlife-safari",
    waypointId: "rapti-river",
    date: "2026-02",
    guests: "Placeholder Guest C and son, United Kingdom",
    title: "Drifting past a rhinoceros",
    story: [
      "The Rapti is at its best in the cold hour after sunrise, when mist still lies on the water and the canoeman hardly needs to paddle. We had seen a Gharial on a sandbar, a Pied Kingfisher hovering over its pool, and a pair of Ruddy Shelducks on a spit, when I saw a grey shape at the edge of the tall grass.",
      "A Greater One-horned Rhinoceros stood knee-deep and was feeding, quite undisturbed by our silence. My guest's son, who was eleven, held his breath for what felt like a whole minute. I think he decided that morning that he wanted to become a naturalist.",
    ],
    seen: ["greater-one-horned-rhinoceros", "gharial", "pied-kingfisher", "ruddy-shelduck", "mugger-crocodile"],
    media: [
      img(PH.forest, "Wide shot: dugout canoe on the Rapti in mist, a boy pointing toward a rhinoceros feeding on the far bank", { speciesIds: ["greater-one-horned-rhinoceros"], place: "Rapti River, Chitwan", altitudeM: 150, date: "2026-02", note: "from canoe, 07:05" }),
      img(PH.plain, "Landscape: pair of Ruddy Shelducks on a sandbar in early light, mist behind", { speciesIds: ["ruddy-shelduck"], place: "Rapti River, Chitwan", altitudeM: 150, date: "2026-02", note: "pair on sandbar, 07:20" }),
      img(PH.plain, "Close: Pied Kingfisher hovering over the river, wings blurred", { speciesIds: ["pied-kingfisher"], place: "Rapti River, Chitwan", altitudeM: 150, date: "2026-02", note: "hovering before the dive, 07:35" }),
    ],
    reviewId: "ph-chitwan-a",
  },
  {
    id: "mem-chitwan-kasara-florican",
    tripSlug: "chitwan-wildlife-safari",
    waypointId: "kasara",
    date: "2026-03",
    guests: "Placeholder Guest D and friends, Australia",
    title: "Waiting for the florican",
    story: [
      "In March the grass at Kasara is shorter after the annual cutting, and if you are lucky, you can find the Bengal Florican in its display. We left the lodge in the dark and sat in the jeep at the edge of the grassland with the engine off, a thermos of tea passing between us.",
      "For almost an hour there was just the grass, the dawn chorus, and the cold. Then a black-and-white shape shot up out of the field, wings quivering, hung in the air for a moment and dropped back out of sight. My guests laughed out loud. It was the sort of thing you can only appreciate by seeing it.",
    ],
    seen: ["bengal-florican", "chital", "hog-deer", "black-francolin", "greater-one-horned-rhinoceros"],
    media: [
      img(PH.forest, "Wide shot: jeep parked at the edge of the Kasara grassland at first light, guests with binoculars and a thermos", { place: "Kasara, Chitwan National Park", altitudeM: 150, date: "2026-03", note: "waiting, 06:05" }),
      img(PH.plain, "Landscape: male Bengal Florican mid-leap above the golden grass, wings spread", { speciesIds: ["bengal-florican"], place: "Kasara, Chitwan National Park", altitudeM: 150, date: "2026-03", note: "display flight, 06:55" }),
    ],
    reviewId: "ph-chitwan-b",
  },
  {
    id: "mem-chitwan-baghmara-hornbills",
    tripSlug: "chitwan-wildlife-safari",
    waypointId: "baghmara-community-forest",
    date: "2026-02",
    guests: "Placeholder Guests M and N, Switzerland",
    title: "The sound of a hornbill",
    story: [
      "We were walking the sal forest in single file when I heard it before anyone else: a rhythmic whoosh, like a steam train a long way off. A Great Hornbill was crossing the forest overhead and its wings were beating the air with each stroke.",
      "It landed on a bare branch and began to feed on a fig, a huge yellow casque and a bill like a banana. My guests hardly dared to breathe. A pair of Oriental Pied Hornbills joined it, and we stood there for twenty minutes with the forest all to ourselves.",
    ],
    seen: ["great-hornbill", "oriental-pied-hornbill", "red-junglefowl", "indian-peafowl", "lesser-necklaced-laughingthrush"],
    media: [
      img(PH.forest, "Landscape: Great Hornbill on a bare sal branch, yellow casque catching the sun", { speciesIds: ["great-hornbill"], place: "Baghmara Community Forest, Chitwan", altitudeM: 150, date: "2026-02", note: "adult feeding on a fig, 08:10" }),
      img(PH.forest, "Wide shot: guests in single file on a sal-forest trail, all binoculars pointing upward", { place: "Baghmara Community Forest, Chitwan", altitudeM: 150, date: "2026-02", note: "walking group, 08:00" }),
    ],
  },

  /* ------------------------------------------------------ Phulchowki day */
  {
    id: "mem-phulchowki-mai-forktail",
    tripSlug: "phulchowki-birding-day",
    waypointId: "phulchowki-mai",
    date: "2026-03",
    guests: "Placeholder Guest E and partner, United States",
    title: "Lunch with a forktail",
    story: [
      "We stopped at the Mai temple for lunch, unwrapped our sandwiches on the stone steps and, as always, I told my guests to keep their eyes on the stream. Within five minutes a Spotted Forktail was bobbing along the wet rocks a few metres from our feet, its long black-and-white tail swinging.",
      "A Rufous-bellied Niltava flicked in above us, and a White-capped Redstart appeared on a boulder in mid-stream. Nobody finished their sandwich for a good while. That is a perfect Phulchowki lunch.",
    ],
    seen: ["spotted-forktail", "little-forktail", "white-capped-redstart", "rufous-bellied-niltava", "large-niltava"],
    media: [
      img(PH.forest, "Landscape: Spotted Forktail walking on wet rocks in the stream below the temple steps", { speciesIds: ["spotted-forktail"], place: "Phulchowki Mai Temple", altitudeM: 2100, date: "2026-03", note: "foraging at stream edge, 11:40" }),
      img(PH.forest, "Close: Rufous-bellied Niltava in the shaded forest by the temple, orange breast glowing", { speciesIds: ["rufous-bellied-niltava"], place: "Phulchowki Mai Temple", altitudeM: 2100, date: "2026-03", note: "male on low branch, 12:05" }),
    ],
    reviewId: "ph-phulchowki-a",
  },
  {
    id: "mem-phulchowki-summit-langtang",
    tripSlug: "phulchowki-birding-day",
    waypointId: "phulchowki-summit",
    date: "2025-11",
    guests: "Placeholder Guest F and friends, Spain",
    title: "A clear day in November",
    story: [
      "November is when the Kathmandu air is at its clearest, and the Langtang range stood out against the sky at the summit as if it were painted. A Himalayan Bluetail, blue-backed and orange-flanked, was working the undergrowth by the path, and my guests had their cameras trained on it from the moment we arrived.",
      "While we looked at the mountains, two Himalayan Griffons rose on a thermal right past the summit. One came so close we could hear the air in its feathers. I told them: remember this, this is Kathmandu's own mountain, and it is only an hour from the city.",
    ],
    seen: ["himalayan-bluetail", "himalayan-griffon", "spotted-nutcracker", "black-eagle"],
    media: [
      img(PH.ridge, "Wide shot: guests at the summit looking toward the Langtang range on a very clear November afternoon", { landmarkId: "langtang-himal", place: "Phulchowki summit", altitudeM: 2782, date: "2025-11", note: "clear sky, 14:45" }),
      img(PH.forest, "Landscape: Himalayan Bluetail perched low on a bamboo stem by the summit path", { speciesIds: ["himalayan-bluetail"], place: "Phulchowki summit", altitudeM: 2782, date: "2025-11", note: "male in undergrowth, 14:20" }),
    ],
    reviewId: "ph-phulchowki-b",
  },
] satisfies Memory[];
