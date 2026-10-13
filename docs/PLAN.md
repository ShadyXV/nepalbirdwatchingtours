# Nepal Birdwatching Tours — plan

Site for **Krishna Thapa**, certified birding guide, artist and photographer, Nepal.
Brand: **Nepal Birdwatching Tours**. English only (translation-ready). Static site on GitHub Pages.

Tone: plain, warm, friendly, professional — openly excited about birds and nature.

## Stack

| Concern | Choice |
|---|---|
| Build | Vite + React + TypeScript, pnpm |
| Styling | Tailwind CSS v4 (CSS-first `@theme` tokens in `app/app.css`) |
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
- `/trips/:slug/` — same persistent map, flown into the trip: route, waypoints, per-stop stay/altitude/nights and an interactive bird/wildlife/plant checklist; reel (Ken Burns + ambient clips) under/over the map.
- `/about/` — Krishna: experience, certifications, art and photography.
- `/privacy/`
- No contact page: the **inquiry drawer** opens from any page (header/footer/trip CTAs) and via deep link
  `?inquire&trip=<slug>&from=<date>&to=<date>&party=<n>`. It sends via WhatsApp / email / Instagram.

## Core architecture rule

The map is mounted **once** in a layout route shared by `/` and `/trips/:slug`. Navigating between them
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

Inspiration screenshots and wireframes: to be supplied by the owner before phases 2/6.
