import type { BirdingGuide } from "../types";

/**
 * "Birdwatching Tours in Nepal" (/birding-in-nepal/): the owner's copy (2026-10-15), kept as written.
 * Edits: place spellings follow the site (Phulchowki), and the species count in the highlights matches
 * the intro (over 870).
 */
export const birdingGuide: BirdingGuide = {
  title: "Birdwatching Tours in Nepal",
  intro: [
    "Nepal is one of the richest birdwatching destinations in the world, home to over 870 species of birds within a country smaller than many single states. From the lowland jungles of Chitwan and Koshi Tappu to the alpine forests of Annapurna and the high Himalayan valleys near Everest, Nepal's dramatic altitude range packs an extraordinary diversity of habitats and avian life into a compact area. Whether you're a serious lister chasing rare endemics like the Spiny Babbler or a casual nature lover wanting to spot colorful Himalayan Monals and vibrant sunbirds, Nepal offers birding experiences for every level of enthusiast.",
  ],
  why: {
    heading: "Why Choose Nepal for Birdwatching",
    body: [
      "Nepal's position at the crossroads of the Indian subcontinent, the Tibetan plateau, and the Himalayan range creates a unique convergence of bird species from different biogeographic zones. Within a single trip, birders can move from subtropical lowland forests teeming with hornbills, kingfishers, and woodpeckers to misty rhododendron forests echoing with laughingthrushes and warblers, and finally to high alpine meadows where snowcocks, choughs, and lammergeiers soar above 4,000 meters.",
    ],
    highlightsIntro: "Key highlights include:",
    highlights: [
      "Over 870 recorded bird species, more than 8% of the world's total",
      "Several globally threatened and near-endemic species",
      "Diverse habitats: lowland Terai jungles, mid-hill forests, alpine zones, and wetlands",
      "Excellent infrastructure with experienced local birding guides",
      "Combinable with cultural sightseeing, wildlife safaris, and trekking",
    ],
  },
  destinations: {
    heading: "Popular Birdwatching Destinations in Nepal",
    items: [
      {
        id: "chitwan",
        name: "Chitwan National Park",
        body: "A UNESCO World Heritage Site and one of the best lowland birding spots in Asia. Chitwan's riverine forests and grasslands host Bengal Florican, Giant Hornbill, Lesser Adjutant, and numerous raptors, alongside opportunities to spot rhinos and tigers.",
        placeIds: ["chitwan-national-park"],
        tripSlugs: ["chitwan-wildlife-safari"],
      },
      {
        id: "koshi-tappu",
        name: "Koshi Tappu Wildlife Reserve",
        body: "Nepal's premier wetland reserve along the Sapta Koshi River, famous for migratory waterfowl, shorebirds, and the elusive Swamp Francolin. A must-visit for waterbird specialists during winter months.",
        placeIds: ["koshi-tappu-wildlife-reserve"],
      },
      {
        id: "phulchowki-godavari",
        name: "Phulchowki and Godavari (Kathmandu Valley)",
        body: "Just a short drive from Kathmandu, these forested hills are excellent for a half-day or full-day birding trip, known for laughingthrushes, niltavas, and a variety of warblers and flycatchers.",
        placeIds: ["phulchowki"],
        tripSlugs: ["phulchowki-birding-day"],
      },
      {
        id: "pokhara-annapurna",
        name: "Pokhara and Annapurna Foothills",
        body: "The forests around Pokhara, including the Annapurna Conservation Area, offer chances to see Himalayan Monal (Nepal's national bird), various pheasants, sunbirds, and forest babblers against a backdrop of stunning mountain scenery.",
        placeIds: ["pokhara", "annapurna-conservation-area"],
        tripSlugs: ["annapurna-birding-trek"],
      },
      {
        id: "lumbini",
        name: "Lumbini and the Western Lowlands",
        body: "Birthplace of Lord Buddha and surrounding agricultural and wetland areas provide good sightings of open-country species, raptors, and waterbirds, easily combined with cultural touring.",
      },
    ],
  },
  itineraries: {
    heading: "Sample Tour Itineraries",
    items: [
      {
        id: "chitwan-kathmandu-7-days",
        title: "7-Day Chitwan & Kathmandu Valley Birding Tour",
        body: "A balanced introduction to Nepal's lowland and mid-hill birding, combining Chitwan's jungle birding with Phulchowki's forest species and Kathmandu's cultural sites.",
      },
      {
        id: "koshi-tappu-chitwan-10-days",
        title: "10-Day Koshi Tappu & Chitwan Wetland and Forest Tour",
        body: "Focused on waterbirds and forest species, ideal for birders targeting waders, raptors, and the Swamp Francolin alongside classic Terai megafauna.",
      },
      {
        id: "nepal-expedition-14-days",
        title: "14-Day Comprehensive Nepal Birding Expedition",
        body: "A full-spectrum tour covering lowland Terai, mid-hill forests around Pokhara, and high-altitude birding in the Annapurna or Langtang region, designed for serious birders seeking maximum species diversity.",
      },
    ],
    custom: {
      id: "custom-tours",
      title: "Custom Birding Tours",
      body: "All itineraries can be tailored to specific target species, trip duration, fitness level, and travel dates, with departures arranged year-round (best season: October to April).",
    },
  },
  included: {
    heading: "What's Included",
    items: [
      "Expert local birding guides with extensive field experience",
      "Private ground transportation",
      "Accommodation in birder-friendly lodges and hotels",
      "Park entry permits and conservation fees",
      "Daily meals as specified in the itinerary",
      "Spotting scopes and reference materials (binoculars recommended to bring)",
    ],
  },
  bestTime: {
    heading: "Best Time to Visit",
    body: [
      "October to March is ideal for migratory species and pleasant weather, while March to May brings breeding activity and vibrant plumage displays in the hills. Each season offers a different birding experience, and our guides can recommend timing based on your target species.",
    ],
  },
};
