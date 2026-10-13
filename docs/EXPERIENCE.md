# Experience structure

How a visitor moves through the site, designed for phones first. Visual spec: `STYLE_GUIDE.md`.
Technique source: `research/SANRITA_INTERACTION.md` (we borrow choreography, not code or renderer).

## Principles

1. **The map is the stage; content rises over it.** One MapLibre map, mounted once, never reloaded.
   Routes move the camera; they don't swap pages.
2. **Native scroll, except the trip journey.** "Scroll to enter" is ordinary page scroll with the map
   sticky behind. The one deliberate exception is a trip page's journey, where scroll/swipe steps through
   days (owner's decision, after San Rita's projects page; design in progress, see
   `research/SANRITA_PROJECTS_ABOUT.md`).
3. **The map is always explorable.** Drag to pan and zoom everywhere, with smooth inertia and soft
   edges, never a wall. Desktop: mouse drag pans, even on home, while the wheel scrolls the home page
   unless pinching or holding Ctrl/⌘. Phones: in trip/place views one finger pans the visible map and the
   sheet is the scroll handle; on home, two fingers pan/zoom so one-finger swipes still scroll. 3D tilt
   and rotation stay gentle, with a "reset view" control. Automatic camera moves never fight the user.
4. **Every state has a URL.** `/`, `/trips/:slug`, `/trips/:slug?stop=<id>`, `/places/:id`. No pop-ups. Back button = fly back.
5. **Personal, not a brochure.** Each trip and stop leads with *memories*: past trips with real guests,
   their photos, the birds and animals seen together, told in Krishna's voice. Altitude, stays and
   checklists are supporting detail in a compact strip.
6. **Content first, map as enhancement.** Prerendered HTML carries everything. The map chunk loads after
   first paint; reduced-motion gets jumps instead of flights.

## URLs, SEO and AEO

- **Paths for things, params for states.** Indexable entities get real paths, each prerendered to full
  static HTML: `/`, `/trips/:slug/`, `/places/:id/`, `/about/`. Transient states are
  query params on top: `?stop=`, `?inquire…`. They're shareable but not separate pages.
  GitHub Pages ignores query strings, so a param-only design would serve crawlers one page.
- **Same URL, two experiences.** In-app navigation (from home) keeps the map, flies the camera and animates
  content in. A direct landing serves the prerendered HTML instantly; the map then loads already in that
  state. Entrance animations run **only on client-side navigation**. Content is never hidden waiting
  for JavaScript (no `opacity: 0` defaults).
- **No-JS / crawler / AI agent:** every page's HTML holds the full text: memories, itinerary, species
  names, place info. Plus canonical URLs (trailing slash), meta, schema.org JSON-LD (TouristTrip, Person,
  Review, Place/Mountain), `llms.txt`, per-trip JSON, sitemap. All generated at build time from the same
  content files.

## Map states

| State | URL | Camera | Map gestures | What's on the map |
|---|---|---|---|---|
| **S0 Overview** | `/` | All of Nepal, low pitch, slight bearing | Pan/zoom (desktop drag; phone two-finger); pins tappable | Terrain, graticule, 6–8 labels (Kathmandu, Pokhara, Chitwan, Bardia, main peaks), trip pins |
| **S1 Trip** | `/trips/:slug` | Fit trip bounds, pitch ~55–60°, route-aligned bearing, bottom padding for the sheet | On, inside the visible map area | Route draws in, stop markers pop in with a stagger, trip's peaks labelled |
| **S2 Stop** | `?stop=<id>` | Ease to stop, closer, slight orbit | On | Lens ring + grid around the stop; other stops dimmed |
| **S3 Place** | `/places/:id` | Ease to the mountain/place, framed for its view (peaks: low pitch, looking at the face) | On | The place highlighted, its range softly lit, nearby trip routes faint |
| **Ambient** | `/about` | Slow, gentle drift over Krishna's home hills, dimmed | Off | Terrain only |

Route-to-route moves: S0→S1 `flyTo` about 2.4–3 s; S1→S2 `easeTo` about 0.9 s; S1→S0 fly back out;
trip→trip flies through S0 (handled by `flyTo` curve).

## Phone layouts (portrait, 360–430 px)

### S0 Home: map hero + trip cards

```
┌──────────────────────────┐
│ NBT        ☰   [Inquire] │  header, transparent over map
│                          │
│     · Langtang ●         │  map backdrop (touches scroll the page)
│  ▲ Annapurna   ▲ Everest │  peaks labelled, Nepal fills width
│   ● Pokhara  ● Kathmandu │
│          ● Chitwan       │  active pin enlarged + pulses
├──────────────────────────┤
│ ┌──────────────────┐ ┌── │  trip card carousel (swipe)
│ │ [landscape photo]│ │   │  swiping a card eases the camera to its pin
│ │ LANGTANG VALLEY  │ │   │  tap card or pin → S1
│ │ 9 days · 142 birds│ │  │
│ └──────────────────┘ └── │
│   SCROLL TO MEET KRISHNA ↓│
└──────────────────────────┘
   ↓ native scroll: map dims, night sheet rises with giant headline
┌──────────────────────────┐
│ HELLO, I'M KRISHNA       │  giant display type overlapping map edge
│ [tilted photo stack]     │
│ intro · services · day tours (Kathmandu hills, Chitwan, Bardia)
│ reviews carousel (photos, real names, TripAdvisor link)
│ art & photography carousel
│ [Inquire]  footer        │
└──────────────────────────┘
```

Why: Nepal is wide and short; in portrait it is a thin strip, so pins alone are too small to tap
well. The card carousel is the primary picker and the map follows it.

### S1 Trip: explorable map + sheet

```
┌──────────────────────────┐
│ ←  LANGTANG        [♡?]  │  back = fly out to S0
│                          │
│    route draws in        │  map gestures active here
│   ●──●───●──── ●         │  stops pop in; tap a stop → S2
│        ▲ Langtang Lirung │
├──── drag handle ─────────┤  slim peek: navigation only, no dense facts
│ ANNAPURNA BIRDING TREK   │
│ ‹  DAY 4 · TADAPANI  ›  ▶│  stop stepper ↔ camera follows; ▶ = auto-tour
│ [Inquire]   story ↓      │
└──────────────────────────┘
   ↑ drag or scroll the sheet: it expands into the trip story (page scroll)
┌──────────────────────────┐
│ ANNAPURNA BIRDING TREK   │  giant headline over a gradient seam into the map
│ a short personal intro   │
│ ▶ reel: Ken Burns stills + ambient clips (map tinted over video)
│ MEMORIES ON THIS TRAIL   │  photo-led stories with past guests, stop by stop
│  "April 2025 · Tadapani — Anna & Tom saw their first Satyr Tragopan…"
│  [photo stack] · guests' review quote · birds seen that day
│ THE WAY  day by day, compact: stop · altitude · nights · stay
│ WHAT YOU MIGHT SEE  chips: Birds 142 · Mammals 12 · Plants 30
│                     (★ = seen with guests here)
│ price (only if shown) · [Inquire]
└──────────────────────────┘
```

### Key stops

Not every stop gets rich content. **Key stops** (`waypoint.key`) carry the photos, story text, memories
and a full checklist; they're what the story features, the auto-tour visits and the stepper steps
through. Other stops stay a quiet line in the itinerary (day · name · altitude · stay) and a minor marker
on the map. What you might see across the whole trip is still summarised at trip level.

### A birding diary that grows along the route

Each day/stop in the journey shows its sightings in the generous empty space around the photos, as a
running tally: `38 birds today · 12 new · 96 so far`, with the new species highlighted. You watch the
list grow as the trip climbs through habitats. Data: `sightingStatsByStop(trip, group?)` in
`app/content/index.ts`. Mountains seen from that stop can join the list as field labels.

### S1 auto-tour: the trip plays itself

After the fly-in, route draw and stop pop, the trip **plays itself** until the visitor interacts:

- A pulse ring and a label at the current stop: `DAY 1` (accent italic, Thin) over `POKHARA · 820 m`
  (label caps).
- Every 4–5 s the camera glides slowly to the next **key** stop (others are skipped, to keep it short); the label and pulse move with it. The sheet's day stepper follows in sync. Checklist
  and stay details stay quiet, as supporting information.
- Any tap, drag, pinch, scroll or key press **pauses** it. A small "▶ Play the route" control resumes.
  At the last stop it pulls back to the whole route and ends.
- The tour never writes `?stop=` (the URL changes only on deliberate choices). It pauses when the map is
  scrolled out of view or the tab is hidden.
- Reduced motion: no camera movement; the day highlight steps in place.
- Future: with soundscapes, each stop's ambience can fade in as the tour arrives.

### S2 Stop

```
├──── sheet (half) ────────┤
│ DAY 4 · TADAPANI         │
│ 2,630 m · 1 night · teahouse · oak–rhododendron   ← supporting strip
│ [memory carousel]        │  past guests here: photos, short story, date
│  "Mist lifted at dawn and a Kalij pair walked…"
│ [Birds][Mammals][Plants] │  filter chips
│ ★ Kalij Pheasant   common│  ★ seen with guests here · likelihood · months
│ ◐ Himalayan Monal  likely│  tap → species card (photo, note, eBird link)
│ ‹ prev stop   next stop ›│
└──────────────────────────┘
```

### S3 Place (mountains, ranges, points of interest)

Same interaction as a trip: real page, camera flies there, sheet peeks, scroll reveals more. **No pop-ups,
no cards-as-modals, anywhere.** Places are lower in the hierarchy than trips: smaller markers (peaks
keep their labels), less content, and no main-nav entry. You reach them from the map, from trip pages and
from home.

```
│   ▲ EVEREST  (camera framed on the face)   │  map, gestures on
├──── sheet peek ─────────────────────────────┤
│ MOUNT EVEREST · 8,849 m · Mahalangur Himal  │
│ [Plan a trip here]                          │
└─────────────────────────────────────────────┘
   ↑ scroll: the sheet expands into the place story
│ giant headline · one or two warm paragraphs  │
│ media carousel (landscape stills, clips)     │
│ memories here (if any)                       │
│ AROUND HERE  light species list, field labels│
│ TRIPS NEARBY  trip cards → fly to the trip   │
│ [Plan a trip here]  → inquiry prefilled with the place
```

Mountains get special love: big peaks stay labelled on the overview, and a range glows softly while one of
its peaks is open.

### Anywhere (ways to travel with Krishna)

Same rising-sheet language over an ambient map. One full-bleed, photo-led section per offering: giant
headline, "for you if you're a photographer / filmmaker / researcher / artist / trekking group…", a carousel
of those experiences, a few lines in Krishna's voice, the guests' own reviews woven in, and "Ask about
this" (inquiry prefilled with the offering). Sections are anchors (`/anywhere/#trek-photography`), so trips
and places can link straight to the relevant one.

### Persistent mobile actions

- Floating **Inquire** button bottom-right on every page (hidden while the drawer is open). The drawer
  is a full-height sheet with a date-range picker, party size and WhatsApp / email / Instagram send.
- Deep links open it prefilled: `?inquire&trip=…&from=…&to=…&party=…`.

## Desktop (≥ 1024 px)

Same states, and **no content sidebar**. On trip and place pages the map fills the screen, as on home.
A **small floating navigator** carries only navigation: trip or place name, the stop stepper
(`DAY 4 ‹ › TADAPANI`), play/pause for the auto-tour, Inquire, and a "scroll for the story ↓" cue.
**Scrolling reveals the story** as a dark overlay rising from below (as on the home page): giant
headline overlapping the map's edge, then memories and photos, then the compact itinerary, what you
might see, and practical facts. Scroll back up and the map is whole again. Pins are big enough alone, so
the home card carousel becomes a hover-synced list. An optional cursor-following lens appears in S1/S2.

## Motion (tokens in `app/design/tokens.css`)

| Moment | Motion |
|---|---|
| S0→S1 | camera flight about 2.6 s; sheet rises at about 50% of the flight (700 ms, `--ease-sheet`); route draws over about 1.4 s; stops pop with 80 ms stagger, back-out overshoot |
| Home scroll | map dims / desaturates with scroll progress; headline letters rise from centre; photo stack springs in, tilted |
| S1→S2 | 0.9 s ease; lens ring grows in with slight overshoot |
| Page ↔ about | ink-blot clip-path wipe about 0.5 s out / 0.5 s in (our own shape) |
| Reduced motion | camera jumps; no draw, pop, parallax or wobble; content simply appears |

## Media

- Landscape-first: 3:2 stills and 16:9 clips, several per section, in swipe carousels.
- Ambient clips (UploadThing, 15–20 s, muted, `playsinline`, loop) play only while on screen. A poster
  shows first; Save-Data or reduced motion gets the poster only.
- Ken Burns stills: slow pan and zoom toward each image's `focal` point; crossfade between them.
- Map-over-video scene: in the trip story, the map switches to `appearance="overlay"` (translucent) over
  the reel.

## Performance budget (mid-range phone)

- First paint from prerendered HTML; map chunk lazy-loaded after.
- Device pixel ratio capped at 2. 3D terrain only on capable devices (drops after repeated slow frames).
- Map renders on demand, with no idle animation loop. Videos pause off-screen.

## Open decisions

1. Home on phones: trip card carousel synced with the map (recommended) vs pins only.
2. About page over the ambient map (map moves to the root layout) vs a plain page.
3. "Seen it" ticks on checklists, saved on the device — fun, optional.
