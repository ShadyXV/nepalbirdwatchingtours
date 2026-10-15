import type { ImageAsset, Region } from "../types";

/**
 * Birding regions. Order = display order on the trips listing. Trips join a region through
 * `Trip.regionSlug`; a region with no published trips stays hidden (no map pin, no page).
 * Copy is placeholder until Krishna writes his own.
 */

const cover = (src: string, alt: string, width: number, height: number): ImageAsset => ({
  kind: "image",
  src,
  alt,
  width,
  height,
});

export const regions: Region[] = [
  {
    slug: "kathmandu",
    name: "Kathmandu Valley",
    tagline: "Forest birds and cloud forest on the edge of the city",
    coords: [85.32, 27.7],
    body: [
      "The valley floor is terraced farmland, settlements and temples, but the hills around it hold some of the most accessible forest birding in Nepal. Phulchowki, the highest hill around the valley, has oak and rhododendron forest with laughingthrushes, flycatchers, warblers and kalij pheasants. Shivapuri-Nagarjun National Park, to the north, covers similar forest from about 1,000 metres upwards.",
      "The trips here are short outings from the city, so a single morning is often enough to see the main forest types. Spring and autumn are the best seasons, with clear views of the Himalaya from the ridges and migrants passing through. The monsoon, from June to September, brings mist and wet trails.",
    ],
    cover: cover("/media/mock/landscape_misty-forest-trail_portrait_021.jpg", "Hiker in an orange pack on a misty forest trail under moss-hung trees", 2959, 3945),
    landmarkIds: ["kathmandu", "phulchowki", "shivapuri-nagarjun-national-park"],
  },
  {
    slug: "pokhara",
    name: "Pokhara",
    tagline: "Lake waterbirds and forested hills above Phewa Lake",
    coords: [83.98, 28.21],
    body: [
      "Pokhara sits on the shore of Phewa Lake at about 800 metres, with the Annapurna range rising to the north. In winter the lakes, including Begnas to the east, attract wintering ducks, herons, egrets and kingfishers, and the reedy edges suit warblers and other marsh birds.",
      "The hills behind the town, including the Sarangkot ridge, rise above 1,500 metres into pine and oak forest. Birders look there for barbets, woodpeckers and laughingthrushes, and the clearest views of the peaks come in autumn and winter. The monsoon, from June to September, is the wettest and least clear time to visit.",
    ],
    cover: cover("/media/mock/bird_waterfowl-flock_landscape_049.jpg", "Large flock of waterfowl flying low over hazy farmland", 4538, 3403),
    landmarkIds: ["pokhara", "phewa-lake", "begnas-lake", "sarangkot"],
  },
  {
    slug: "annapurna",
    name: "Annapurna",
    tagline: "From subtropical forest to high passes above 5,000 metres",
    coords: [83.85, 28.45],
    body: [
      "The Annapurna Conservation Area runs from subtropical valleys near 1,000 metres to high passes and glaciers above 5,000 metres, so the birds change as you climb. The lower slopes have rhododendron, oak and pine forest, where kalij pheasants, laughingthrushes and woodpeckers are common, while the upper valleys open into scrub and alpine meadow.",
      "The region is known for the Himalayan monal, Nepal's national bird, and for lammergeiers and Himalayan griffons circling over the ridges. The most reliable seasons are spring, from March to May, and autumn, from October to November, when the weather is settled and the mountain views are clearest.",
    ],
    cover: cover("/media/mock/mountain_annapurna-viewpoint_landscape_030.jpg", "Walkers on a stone wall below a snowy peak, with a prayer flag", 4928, 3264),
    landmarkIds: ["annapurna-conservation-area", "annapurna-himal", "annapurna-south", "machhapuchhre"],
  },
  {
    slug: "langtang",
    name: "Langtang",
    tagline: "Red pandas, rhododendron forest and high alpine lakes",
    coords: [85.45, 28.15],
    body: [
      "Langtang National Park lies north of Kathmandu along the Tibetan border, and its trails climb from warm river valleys to alpine lakes above 4,000 metres. The lower forests of oak, rhododendron and fir hold red pandas, Himalayan monal and laughingthrushes, and Gosaikunda, a sacred lake at about 4,380 metres, sits in open alpine country.",
      "Rhododendrons flower on the hillsides from March to May, which makes spring the best season for both birds and walking. Autumn, from October to November, is the other reliable window. Winter snow closes the higher passes, and the monsoon from June to September brings leeches and landslides to the lower trails.",
    ],
    cover: cover("/media/mock/mountain_snowy-himalaya-ridge_landscape_023.jpg", "Snowy ridge with stone cairns in the foreground and peaks beyond", 4928, 3264),
    landmarkIds: ["langtang-national-park", "langtang-himal", "langtang-lirung", "gosaikunda"],
  },
  {
    slug: "chitwan",
    name: "Chitwan National Park",
    tagline: "Sal forest, grassland and river with rhinos, tigers and gharials",
    coords: [84.35, 27.55],
    body: [
      "Chitwan National Park is a lowland park of sal forest, open grassland and riverine woodland along the Rapti, Reu and Narayani rivers. It is one of the best places in Nepal to see one-horned rhinoceros, Bengal tiger, gharial and wild Asian elephant, and its bird list runs to several hundred species.",
      "Birders look for great hornbills, woodpeckers and kingfishers in the forest, and for grassland species in the open areas, while the rivers hold gharial and waterbirds. The best season is October to March, when the weather is dry and cooler and animals gather at the rivers. The monsoon, from June to September, is hot and wet.",
    ],
    cover: cover("/media/mock/mammal_one-horned-rhino_landscape_027.jpg", "One-horned rhinoceros wading through a river beside tall green grass", 4464, 3348),
    landmarkIds: ["chitwan-national-park"],
  },
  {
    slug: "bardia",
    name: "Bardia National Park",
    tagline: "Lowland sal forest and grassland along the Karnali River",
    coords: [81.35, 28.42],
    body: [
      "Bardia National Park is one of the largest protected areas in the Terai, a lowland mosaic of sal forest, grassland and riverine woodland along the Karnali and Babai rivers. Tigers, one-horned rhinoceros, swamp deer and gharial are among its wildlife, and the Karnali is home to the Ganges river dolphin.",
      "Birders come for the mix of forest, grassland and river, which gives a wide range of species from waterbirds on the Karnali to forest birds in the sal. The dry season from November to March is the most comfortable time to visit, when the grass is lower and animals gather near waterholes.",
    ],
    cover: cover("/media/mock/reptile_gharial_landscape_037.jpg", "Gharials crowded on a dark rocky bank, one with its jaws open", 4608, 3456),
    landmarkIds: ["bardia-national-park", "karnali-river-bardia"],
  },
  {
    // Owner's voice note said "Situ National Park"; Sagarmatha is a guess to confirm.
    slug: "sagarmatha",
    name: "Sagarmatha (Everest)",
    tagline: "Sherpa villages, high passes and the slopes of Everest",
    coords: [86.75, 27.9],
    body: [
      "Sagarmatha National Park covers the Khumbu region on the southern side of Everest, with trails rising from juniper, birch and rhododendron forest near 2,800 metres to glaciers and peaks above 8,000 metres. Red-billed choughs are common around the villages, and higher up the scrub and cliffs hold snowcocks and lammergeiers.",
      "Himalayan monal is found in the forest below the villages, and the open high country is quiet and sparse. The best seasons are March to May and October to November, when the air is clearest and the trails are dry, while winter brings snow to the passes. Altitude slows everything down, so birding here is best done at an easy pace.",
    ],
    cover: cover("/media/mock/mountain_alpenglow-peak_landscape_044.jpg", "Snow peak lit orange by low sun against a dark sky", 4608, 3456),
    landmarkIds: ["everest", "mahalangur-himal"],
  },
  {
    slug: "far-west",
    name: "Far West",
    tagline: "Remote lakes, forest and grassland at Nepal's western edge",
    coords: [81.0, 29.3],
    body: [
      "The Far West is one of the least visited parts of Nepal, and its habitats run from Rara Lake, the country's largest lake at about 2,990 metres, to the lowland grasslands of Shuklaphanta. Khaptad National Park, a forested plateau at roughly 1,400 to 3,300 metres, adds forest and meadow to the mix.",
      "Shuklaphanta is the place for grassland birds and swamp deer, while the forests around Rara and Khaptad hold pheasants and other hill birds. Access is slow, with long road journeys and short flights, so the region suits birders who have time. The best seasons are October to November and March to May.",
    ],
    cover: cover("/media/mock/mammal_blackbuck-herd_landscape_008.jpg", "Herd of blackbuck standing in tall green grass", 3969, 2976),
    landmarkIds: ["rara-lake"],
  },
  {
    slug: "far-east",
    name: "Far East",
    tagline: "Red panda forest, tea hills and wetlands on the eastern plains",
    coords: [87.95, 27.0],
    body: [
      "The Ilam hills combine red panda forest with tea gardens, and the ridges give long views east towards the Himalaya on clear days. In the lowlands, Koshi Tappu Wildlife Reserve is a wetland of rivers, marsh and grassland, known for waterbirds and wild water buffalo.",
      "The Kanchenjunga foothills, north of Ilam, rise through forest and terraced farmland towards the snows of the world's third highest mountain. Birders go there for forest birds and pheasants. The best season is October to April, when the monsoon has passed and the wetlands are busiest with wintering birds.",
    ],
    cover: cover("/media/mock/mammal_red-panda_landscape_002.jpg", "Red panda asleep on a mossy branch above a misty valley", 4945, 3709),
    landmarkIds: ["ilam-red-panda-forest", "koshi-tappu-wildlife-reserve", "kanchenjunga-himal"],
  },
];
