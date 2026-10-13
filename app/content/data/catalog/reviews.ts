import type { Review } from "~/content/types";

/**
 * PLACEHOLDER reviews only. Every author is a stand-in and the text is invented to show the
 * layout; replace with real guest reviews (with permission) before launch.
 */
export const reviews = [
  {
    id: "ph-annapurna-a",
    author: "Placeholder Guest A",
    country: "Germany",
    date: "2025-05-06",
    rating: 5,
    title: "Birds I never expected on a trek",
    text: "We came for the mountains and left talking about birds. Krishna heard a Himalayan Monal before we had even finished our tea at Tadapani, and then found us a Kalij Pheasant walking across the clearing. The rhododendrons were in full bloom and the Fire-tailed Sunbirds were right in them. The pace was perfect, and we never felt rushed. Placeholder review.",
    tripSlug: "annapurna-birding-trek",
    source: { name: "Direct" },
    media: [
      {
        kind: "image",
        src: "/media/placeholder-forest.svg",
        alt: "Landscape: two guests with binoculars at the Tadapani clearing, rhododendron in bloom, Krishna pointing at the forest edge",
        observation: { speciesIds: ["kalij-pheasant"], place: "Tadapani, Annapurna", altitudeM: 2630, date: "2025-04", note: "group at the clearing, 06:20" },
      },
    ],
  },
  {
    id: "ph-annapurna-b",
    author: "Placeholder Guest B",
    country: "Netherlands",
    date: "2025-12-02",
    rating: 5,
    title: "Parrotbills, snow pigeons and a hot spring",
    text: "I have been trekking for years, but never with a birder alongside. At Bamboo, Krishna waited patiently while a Great Parrotbill finally came out into the open, and at Annapurna Base Camp we watched Snow Pigeons wheel in front of the south face at dawn. A Brown Dipper at Jhinu Danda was the sweet end to a wonderful trek. Placeholder review.",
    tripSlug: "annapurna-birding-trek",
    source: { name: "Direct" },
    media: [
      {
        kind: "image",
        src: "/media/placeholder-snow.svg",
        alt: "Landscape: a trekker silhouetted against Annapurna I at dawn, Snow Pigeons overhead",
        observation: { landmarkId: "annapurna-i", place: "Annapurna Base Camp", altitudeM: 4130, date: "2025-11", note: "dawn, guest with binoculars" },
      },
      {
        kind: "image",
        src: "/media/placeholder-forest.svg",
        alt: "Close: Brown Dipper on a rock in the Modi Khola near Jhinu Danda",
        observation: { speciesIds: ["brown-dipper"], place: "Jhinu Danda, Annapurna", altitudeM: 1780, date: "2025-11", note: "on boulder, 08:40" },
      },
    ],
  },
  {
    id: "ph-chitwan-a",
    author: "Placeholder Guest C",
    country: "United Kingdom",
    date: "2026-03-01",
    rating: 5,
    title: "A rhino from a canoe!",
    text: "The canoe ride at dawn was the highlight for me, with Gharials on the sandbars, kingfishers everywhere and a rhinoceros feeding on the far bank. Krishna's eye for birds is incredible, and he made the Great Hornbill in the forest feel like a gift. Our lodge was comfortable and the walks were relaxed. Placeholder review.",
    tripSlug: "chitwan-wildlife-safari",
    source: { name: "Direct" },
    media: [
      {
        kind: "image",
        src: "/media/placeholder-forest.svg",
        alt: "Landscape: guests in a dugout canoe on the Rapti, a rhinoceros feeding on the far bank in mist",
        observation: { speciesIds: ["greater-one-horned-rhinoceros"], place: "Rapti River, Chitwan", altitudeM: 150, date: "2026-02", note: "rhino on far bank from the canoe, 07:00" },
      },
    ],
  },
  {
    id: "ph-chitwan-b",
    author: "Placeholder Guest D",
    country: "Australia",
    date: "2026-03-20",
    rating: 5,
    title: "Florican, jacanas and the best breakfast views",
    text: "We went in March, and Krishna took us out to Kasara before sunrise to wait in the grass for a Bengal Florican display. When the male leapt into the air I could hardly believe it. Bis Hazari Tal on the last morning, with jacanas on the lily pads, was a lovely way to finish. Placeholder review.",
    tripSlug: "chitwan-wildlife-safari",
    source: { name: "Direct" },
    media: [
      {
        kind: "image",
        src: "/media/placeholder-forest.svg",
        alt: "Landscape: guests waiting quietly at the edge of the Kasara grassland at first light, with a jeep behind",
        observation: { speciesIds: ["bengal-florican"], place: "Kasara, Chitwan National Park", altitudeM: 150, date: "2026-03", note: "waiting for display, 06:00" },
      },
    ],
  },
  {
    id: "ph-phulchowki-a",
    author: "Placeholder Guest E",
    country: "United States",
    date: "2026-03-18",
    rating: 5,
    title: "A perfect day out from Kathmandu",
    text: "After a few days of temples and traffic, a day on Phulchowki was exactly what we needed. Krishna found Mrs. Gould's Sunbird feeding in a rhododendron and a Spotted Forktail at the stream. We saw so many birds in a single day. Placeholder review.",
    tripSlug: "phulchowki-birding-day",
    source: { name: "Direct" },
    media: [
      {
        kind: "image",
        src: "/media/placeholder-forest.svg",
        alt: "Landscape: guests at the stream below Phulchowki Mai temple with binoculars raised",
        observation: { speciesIds: ["spotted-forktail"], place: "Phulchowki Mai Temple", altitudeM: 2100, date: "2026-03", note: "group at the stream, 11:30" },
      },
    ],
  },
  {
    id: "ph-phulchowki-b",
    author: "Placeholder Guest F",
    country: "Spain",
    date: "2025-11-22",
    rating: 5,
    title: "Mountain birds and a clear view of the Himalaya",
    text: "We were lucky with a clear November day. A Himalayan Bluetail showed beautifully near the top, Himalayan Griffons soared past the summit, and Krishna pointed out the Langtang range on the horizon. Gentle, informative and a lot of fun. Placeholder review.",
    tripSlug: "phulchowki-birding-day",
    source: { name: "Direct" },
    media: [
      {
        kind: "image",
        src: "/media/placeholder-ridge.svg",
        alt: "Wide shot: guests at the Phulchowki summit with the Langtang Himal on the horizon",
        observation: { landmarkId: "langtang-himal", place: "Phulchowki summit", altitudeM: 2782, date: "2025-11", note: "summit view, 15:00" },
      },
    ],
  },
] satisfies Review[];
