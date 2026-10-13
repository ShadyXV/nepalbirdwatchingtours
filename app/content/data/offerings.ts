import type { ImageAsset, Observation, Offering } from "../types";
import { withMockPhotos } from "./media/withMockPhotos";

/**
 * "Anywhere" offerings: ways to travel or work with Krishna beyond the set trips.
 * Copy is placeholder in Krishna's voice; photos are shot-list placeholders (the alt text says what
 * the real photo should show) to be swapped for real mock-ups later. Reviews are linked later via
 * `reviewIds` (or `Review.offeringIds`).
 */

const PH = {
  plain: "/media/placeholder.svg",
  forest: "/media/placeholder-forest.svg",
  ridge: "/media/placeholder-ridge.svg",
  snow: "/media/placeholder-snow.svg",
} as const;

const shot = (src: string, alt: string, observation?: Observation): ImageAsset => ({
  kind: "image",
  src,
  alt,
  ...(observation ? { observation } : {}),
});

const seed = [
  {
    id: "custom-day-trips",
    title: "Custom day trips",
    tagline: "A morning in the hills, planned around you.",
    audiences: ["birders", "families", "first-timers"],
    body: [
      "Kathmandu sits in a bowl of forested hills, and I never get tired of them. Phulchowki, Shivapuri, Nagarjun and Chandragiri are all within an hour or two of your hotel, and each one has its own birds, its own light and its own quiet.",
      "Tell me how much time you have, what you like to look at, and how far you want to walk. Some people want a lifer list, some just want a good morning with a cup of tea and a Himalayan Bulbul. Both are a great day.",
      "And it does not have to be the Kathmandu hills. If there is somewhere in Nepal you have always wanted to see, we will build the day around it.",
    ],
    examples: [
      "Sunrise on Phulchowki for the forest birds and the rhododendron slopes",
      "A slow, easy morning in Shivapuri for a family with young kids",
      "Chandragiri ridge walk with the whole Himalaya laid out behind us",
      "A last-minute day for a layover traveller who only has Tuesday",
    ],
    media: [
      shot(PH.forest, "Shot list: misty oak and rhododendron forest on Phulchowki just after sunrise, a guest with binoculars on the trail", {
        place: "Phulchowki, Kathmandu",
        altitudeM: 2782,
        date: "2025-03",
        note: "first light on the upper trail",
      }),
      shot(PH.ridge, "Shot list: Chandragiri ridge with the Himalayan skyline behind, two figures walking the crest", {
        place: "Chandragiri Hills",
        altitudeM: 2551,
        date: "2025-11",
      }),
      shot(PH.plain, "Shot list: close portrait of a bird on a mossy branch, taken by a guest on the day", {
        place: "Shivapuri, Kathmandu",
        altitudeM: 2200,
        date: "2025-04",
      }),
      shot(PH.snow, "Shot list: guests sharing a spotting scope at a ridge viewpoint, snow peaks in the haze"),
    ],
    reviewIds: [],
  },
  {
    id: "crew-support",
    title: "Crew support",
    tagline: "A fixer who actually knows the birds.",
    audiences: ["photographers", "cinematographers", "researchers", "artists"],
    body: [
      "If you are making something in Nepal's wild places, a photograph, a film, a field survey, a painting, I can be the person who makes the days work. I know where the birds are, when the light is good, and which hide or trail will give you the shot.",
      "I will scout ahead, find the species you need, handle the permits, and sort out the early starts, the porters and the jeeps, so you can stay behind your lens or your notebook. I am quiet in the field, patient with a long wait, and happy to carry the tripod.",
      "I have worked with people who knew exactly what they wanted and with people who only knew the feeling they were after. Either way, tell me the story and I will help find it.",
    ],
    examples: [
      "Dawn at Phulchowki for a wildlife film crew chasing forest birds",
      "Scouting hides and permits in Chitwan for a stills photographer",
      "A week supporting a bird-survey team in the high valleys",
      "Finding a quiet wetland and a patient subject for a painter's field sketches",
    ],
    media: [
      shot(PH.forest, "Shot list: a camera on a tripod in a forest hide, lens aimed at a feeding branch, a figure crouched beside it", {
        place: "Phulchowki, Kathmandu",
        altitudeM: 2600,
        date: "2025-03",
        note: "waiting on a flock, 06:10",
      }),
      shot(PH.ridge, "Shot list: crew loading gear into a jeep on a dirt road at dawn, ridge line behind them"),
      shot(PH.plain, "Shot list: researcher with a notebook and a mist-net bag beside a stream at first light"),
      shot(PH.snow, "Shot list: long lens pointed up a snow-streaked valley, cameraman's breath in the cold air", {
        place: "Langtang Valley",
        altitudeM: 3400,
        date: "2025-10",
      }),
    ],
    reviewIds: [],
  },
  {
    id: "trekking-group-naturalist",
    title: "Naturalist for your trekking group",
    tagline: "Your trek guide knows the trail. I know what is living along it.",
    audiences: ["trekking-groups", "families"],
    body: [
      "Big trekking groups walk through some of the richest forests on earth and often do not see a thing, simply because nobody is pointing. I would love to be the person who points.",
      "I join your group alongside your trek guide as the birding and nature specialist. Your guide looks after the route, the teahouses and the pace. I look after the monals on the ridge, the langurs in the oaks, the orchids by the path, and the stories that go with them.",
      "It works for a group of ten or thirty, birders or complete beginners. By day three, the people who never thought they cared about birds are usually the ones asking for the scope.",
    ],
    examples: [
      "Morning bird walks before breakfast on the Annapurna trail",
      "Evening talks in the teahouse: what we saw today and what to look for tomorrow",
      "Spotting-scope stops for a school or club group on the way up",
      "A flower and butterfly walk for a trekking group in the spring bloom",
    ],
    media: [
      shot(PH.snow, "Shot list: a line of trekkers on a high trail, one pointing upslope, snow peaks behind", {
        place: "Annapurna region",
        altitudeM: 3100,
        date: "2025-04",
      }),
      shot(PH.forest, "Shot list: group gathered around a spotting scope at the edge of a rhododendron forest", {
        place: "Tadapani, Annapurna",
        altitudeM: 2630,
        date: "2025-04",
        note: "everyone taking a turn on the scope",
      }),
      shot(PH.plain, "Shot list: Krishna crouching to show a trekker a flower beside the trail"),
      shot(PH.ridge, "Shot list: teahouse porch at dusk, the group with tea and a field guide, ridge fading behind"),
    ],
    reviewIds: [],
  },
  {
    id: "trek-photography",
    title: "Trek photography",
    tagline: "Your trek, as the wild around you saw it.",
    audiences: ["trekking-groups", "photographers", "families"],
    body: [
      "Most trek photos are selfies at the pass. I love those too, but I want to give you the other pictures: the mist lifting off a ridge, a monal in the first sun, a yak train on a snow-bright trail, the small details that made your walk feel alive.",
      "I walk with you and photograph the landscape and the wildlife around you, behind the scenes, nature first. These are not portraits or posed shots. They are the story of the place you were walking through, from someone who knows where to look.",
      "You will get a curated set to keep and share after the trek, and I will be glad to point my camera at whatever moved you most.",
    ],
    examples: [
      "A full trek in pictures: forest, ridge, village and the birds along the way",
      "Sunrise and golden-hour landscapes from the camps you sleep at",
      "Behind-the-scenes frames of a group in motion on the trail, from a distance",
      "A gift set for a couple celebrating a trek, built around the wildlife they saw",
    ],
    media: [
      shot(PH.snow, "Shot list: wide landscape of a high valley at golden hour, a tiny line of trekkers far below", {
        place: "Langtang Valley",
        altitudeM: 3870,
        date: "2025-10",
      }),
      shot(PH.forest, "Shot list: a pheasant in rhododendron leaf litter, sharp eye, soft green background", {
        place: "Tadapani, Annapurna",
        altitudeM: 2630,
        date: "2025-04",
        note: "male at the forest edge, 06:40",
      }),
      shot(PH.ridge, "Shot list: ridge line in the first light, prayer flags in the foreground, nobody in frame"),
      shot(PH.plain, "Shot list: detail of frost on a leaf beside a trail, with a trekker's boot blurred behind it"),
      shot(PH.forest, "Shot list: behind the scenes, trekkers crossing a suspension bridge seen from the gorge floor"),
    ],
    reviewIds: [],
  },
] satisfies Offering[];

export const offerings: Offering[] = withMockPhotos(seed);
