# Nepal Birdwatching Tours — plan

Vibe, aesthetics and interaction intent: **`VISION.md`** (wins any conflict). This file: stack, sitemap, phases.

Site for **Krishna Thapa**, certified birding guide, artist and photographer, Nepal.
Brand: **Nepal Birdwatching Tours**. English only (translation-ready). Static site on GitHub Pages.

Tone: plain, warm, friendly, professional — openly excited about birds and nature.

**Promise:** not an ordinary trip runner. Krishna is a passionate, serious birder and naturalist: if you're
into birds, he can make your trip — in any season, anywhere in Nepal. The site proves it through
observation: every bird, animal, butterfly, flower and mountain shown carries its name, scientific name,
place, altitude and date — light, never database-like (no coordinates or conservation codes; see "Field label" in STYLE_GUIDE.md; `Observation` in types.ts).

## Stack

| Concern | Choice |
|---|---|
| Build | Vite + React + TypeScript, pnpm |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens in `app/design/tokens.css`) |
| Routing/output | React Router v7 framework mode, `ssr: false`, every route prerendered to static HTML |
| Map | MapLibre GL — label-free paper-style terrain; may swap in a baked relief image layer |
| Dates | react-day-picker (range mode) + date-fns |
| Video | `VideoSource` host per clip: UploadThing (default for 15–20 s clips), local, or YouTube |
| Images | Local under `public/media`, build-time optimized later |
| Content | Typed TS data in `app/content/data/*`, shapes in `app/content/types.ts` |
| Hosting | GitHub Pages via Actions; `BASE_PATH` env for project-page subpath |
| Not doing | Analytics, crash monitoring, database, server, unit tests |

## Sitemap

- `/` — home: full-bleed map of Nepal with trip pins (photo, name, species count); below it: Krishna intro, services, reviews.
- `/trips/` — every published trip as a card, grouped by region (each group's title links to its region page); search by name and filter by kind (`?q=`, `?kind=`) across the groups, full list without JS.
- `/regions/:slug/` — a birding region (Kathmandu Valley, Annapurna, Chitwan…), inside the map layout: the map flies to the region and draws all its trips; the sheet describes the region and lists its trips (hover/focus a card highlights its route) and its parks and peaks. Only regions with published trips exist (Pokhara, Far West, Sagarmatha stay hidden until they have one). A trip's back link leads to its region.
- `/trips/:slug/` — same persistent map, flown into the trip: route, waypoints, per-stop stay/altitude/nights and an interactive bird/wildlife/plant checklist; reel (Ken Burns + ambient clips) under/over the map.
- `/places/:id/` — mountains, ranges, parks, points of interest: same map + rising-sheet interaction as
  trips, lighter content, lower in the hierarchy.
- `/anywhere/` — ways to travel with Krishna beyond the set trips (custom day trips anywhere, crew support
  for photographers/filmmakers/researchers/artists, birding specialist for trekking groups, trek
  photography). Photo-led sections with relevant reviews. Working title, never "services".
- `/birding-in-nepal/` — general guide "Birdwatching Tours in Nepal" (owner's copy): why Nepal, destinations, sample itineraries, what's included, best time.
- `/about/` — Krishna: experience, certifications, art and photography.
- `/reviews/` — every guest review: small photo, their words, the trip they went on.
- `/trip-reports/:slug/` — blog-style report from one past departure: story and photos, the group, species seen.
- `/privacy/`
- No contact page: the **inquiry drawer** opens from any page (header/footer/trip CTAs) and via deep link
  `?inquire&trip=<slug>&from=<date>&to=<date>&party=<n>`. It sends via WhatsApp / email / Instagram.

## Design principles

- **Mobile-first.** Most visitors are on phones. Every interaction (map gestures vs page scroll, sheets,
  inquiry, carousels) is designed for one-handed touch first, then scaled up to desktop.
- **Landscape media, lots of it.** Wide images and clips of birds, animals and landscapes; multiple images
  per section, with carousels where a section has more than one.
- **Design tokens in one place** (`app/design/tokens.css`) — colours, fonts, type scale, motion. Changing
  the look is a token edit. Visual spec: `docs/STYLE_GUIDE.md`.

## Core architecture rule

The map is mounted **once** in a layout route shared by `/`, `/trips/:slug` and `/places/:id`. Navigating between them
never remounts the map — it flies the camera and swaps the surrounding panels. Map code is client-only
(prerendered HTML carries the textual itinerary for crawlers and agents).

## Agent / crawler layer (later phase)

`robots.txt`, `llms.txt`, `llms-full.txt`, `sitemap.xml`, `/data/trips.json`, `/data/availability.json`,
schema.org JSON-LD per page, documented inquiry deep-link contract. Optional WebMCP tools later.

## Phases

0. Scaffold — structure, Tailwind, tokens, fonts, routes, persistent map layout, stubs, i18n strings, Pages deploy
1. Content — placeholder trips/waypoints/species/landmarks/reviews matching `types.ts`
2. Map core — terrain, landmark labels, trip pins, fly-in to itinerary, waypoint selection
3. Trip view — itinerary panel, checklist, stays
4. Inquiry drawer — date range + availability, channel links
5. Agent layer
6. Media — reel, ambient video, map/video overlay scene
7. Reviews (TripAdvisor import script from pasted content), about, art
8. Real content, schedule sync, deploy
9. Ideas: "This month in Nepal" (what's showing now, from species months), seasonal birding calendar

Inspiration screenshots and wireframes: to be supplied by the owner before phases 2/6.
