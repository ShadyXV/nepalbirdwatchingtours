# The day view ("the journey")

A trip's day-by-day mode: full-screen, focused, over the map. Intent: `EXPERIENCE.md` → "Two modes per
trip" (with the owner's decisions) and "Birds of the day"; design origin:
`research/SANRITA_PROJECTS_ABOUT.md` §5. This is the implementation note.

## How to use it

- **Enter** from the trip overview: "Start the journey" (near the top of the story, and on the map
  above the story's peek), "Day n →" on each day of "The way, day by day", or a link to `?day=n`
  (`?day=end` is the final card). Out-of-range values clamp to 1..D.
- **Step**, one day per gesture, strictly in order (never a midpoint, never two days):
  scroll / trackpad (vertical or sideways), swipe up or left (forward) / down or right (back),
  ↓ → PageDown Space J (next), ↑ ← PageUp Shift+Space K (previous), or the ‹ › buttons.
  The ends lean back a little; there is no automatic exit. Day D + 1 is **"The whole way"** (full
  route, total birds, Plan this trip).
- **Midpoints** are on the map: tap one of the day's other stops and the camera goes there, with a
  small panel under the headline (name, altitude, one line); tap it again, the anchor, or "Back to
  the day" to return. The next scroll still moves to the next day.
- **This day** (bottom bar), or **"+75 more birds"** under the birds, raises a sheet with the day's
  own text: stops and stays, Krishna's notes, memories with guests, every bird and animal of the day
  by common name (★ seen with guests), the mountains seen from here. While it is open, the wheel and
  touch scroll it; ✕, Esc or dragging the handle down closes it.
- **Look around**: the orbit buttons (↺ ↻), Q / E or right-drag turn the camera around the day's
  anchor (or the tapped stop); the next step straightens it again.
- **Exit**: "Overview", ✕ (desktop), Esc, or browser Back: the overview comes back exactly as it was
  (scroll position and camera).

## What is on screen

Deliberately little (owner): the headline, two large photos, the birds, the controls.

- **Headline**: `DAY 4` (label caps; day numbers are never in the accent face), the place in Anton,
  then one short line: the altitude (accent numerals) · nights · stay.
- **Two photos** (or ambient clips), anchored to the screen's edges: on wide screens A fills in from
  the top-left corner and B from the bottom-right corner; on tall screens they are full-bleed bands
  along the top and the bottom. Their outer edges run off-screen; only the inner edges feather into
  the map (corners: an organic blob, `feather.ts`; bands: a ramp, `--jr-feather`). One short caption
  each: the bird's common name, the mountain, or the place.
- **Birds**: `78 birds possible`; under it a window of three names (label caps, one line each, never
  wrapped) drifting slowly upward in a seamless loop (2.5 s per name; paused on hover / focus and
  while the sheet is open; the first three, still, under reduced motion); then the text link
  "+75 more birds", which opens the This-day sheet. No icons on it.
- No scientific names anywhere in the day view.
- Controls: top bar ("Overview" as text, the trip, `4 / 12`, ✕ on desktop); bottom bar (‹ ›,
  This day, Inquire; display-only progress dots on desktop). Symbols are unique to their meaning:
  ‹ › step days, ✕ closes, the up chevron only ever means "content rises from below" (the story
  button on the overview, the This-day sheet).

### The layout pass (`dayLayout.ts`)

Nothing may cover the day's route, its markers or their labels, and text never sits on a photo.

1. **Footprint**: where the day is on screen. While the camera moves, the camera's clear band
   (`DAY_LAYOUT` in `app/lib/mapLayout.ts`); once it rests (after a step, a midpoint, an orbit, a
   resize), measured by `map.journeyFootprint()`: today's stretch of the route, the day's stop
   markers and their visible labels.
2. **Wide screens**: the headline at the top of the right-hand column (as close to the route as it
   fits), photo B from the bottom-right corner under it, photo A from the top-left corner, the birds
   at the bottom-left under A (narrowing to the column, at least 250 px). Each photo up to
   `MEDIA.wideShare` (44 % × 62 % of the screen) and never into the route's corridor (footprint +
   `pad` 24 px).
3. **Tall screens**: photo A a band along the top, the headline just above the route, the birds just
   below it, photo B a band along the bottom (each band `MEDIA.tallMin`–`tallMax`, 12–30 % of the
   height).
4. **Priorities**: headline, then the photos (shrunk down to `MEDIA.wideMin` / `tallMin`, not
   dropped), then the birds (in full, then the count alone, then none). Odd footprints fall back to
   a free-spot packer with the same priorities.
5. Blocks and photos glide to their new places (`--duration-day-place`) once placed.

Text blocks carry a soft local scrim (a feathered radial darkening behind them, `--color-day-scrim`)
and a night halo on the letters; the bars have a faint gradient. No boxes.

## URL and history

`?day=n` is a state on the trip page, not a page. Opening pushes one history entry (`dayEntry`), day
steps replace it, and exiting pops it (Back), so Back always lands on the overview however many days
were stepped. A direct landing on `?day=n` opens straight into that day with no entrance animation;
leaving then replaces the URL. The day view itself renders on the client; without JavaScript (and
for crawlers), `?day=n#day-n` links jump to that day in the prerendered itinerary (`DayList`), which
holds every day in reading order: heading, stops and notes, the day's two media (alt text, field
labels), how many birds are possible, the checklist and "seen from here".

## Files

| File | Role |
|---|---|
| `app/lib/tripDays.ts` | Pure day model: `tripDays(trip)` → `{n, waypoints, anchor, rest, midpoints, segment, media, stats, peaks}`; `pickDayMedia`, `dayChecklist`, `peakCandidates`, `alongLine` |
| `app/components/journey/Journey.tsx` | The mode: URL ↔ state, `html[data-journey]`, overview `inert`, input, map wiring, layout pass, live region |
| `.../dayLayout.ts` | The layout pass (`MEDIA` constants) |
| `.../useJourneyUrl.ts` | `?day=` parsing, `open` (push) / `step` (replace) / `exit` (pop), `dayHref` |
| `.../stepInput.ts` | Wheel / trackpad / touch / keys → `step(±1)`, `pull(px)`, `exit()`; `JOURNEY_INPUT` |
| `.../DayStage.tsx` | Headline, stop panel, birds (count + drifting names + "more"), "The whole way" |
| `.../FeatheredMedia.tsx`, `feather.ts` | Photo slots: edge anchoring, inner feather, reveal, video lifecycle |
| `.../DayControls.tsx` | Top bar, progress dots (display only), prev / next, This day, Inquire |
| `.../DaySheet.tsx` | The This-day sheet |
| `.../DayList.tsx` | The prerendered day-by-day itinerary in the overview |
| `.../journey.css` | Document states, controls, masks, text blocks, names window, choreography, reduced motion |
| `app/components/map/controller.ts` | `JourneyApi` (camera, mood, day overlay, midpoints, footprint, line of sight) |
| `app/components/map/camera.ts` | `CAMERA.day`, `dayBearing`, `fitDay`, `dayCamera`, `dayMoveMs`; orbit constants |
| `app/components/map/orbit.ts` | Orbit around the focus point (buttons, keys, right-drag) |
| `app/lib/mapLayout.ts` | `DAY_LAYOUT` (the camera's clear band) and `dayInsets()` |

## Map engine API (`MapApi`, from `useMapLayoutContext().map`)

```ts
openJourney(day, { animate? }): Promise<void>   // remember the camera, mute the map, fly to the day
goToDay(day, { direction?, animate? }): Promise<void>
focusDayStop(waypointId | null): Promise<void>  // a midpoint tap; null = back to the day's view
closeJourney({ animate? }): Promise<void>       // back to the remembered camera, map look restored
setMapMood("day" | "normal", ms?): void
setJourneyListener({ stop?(id), frame?() } | null): void  // marker taps; camera at rest (re-layout)
journeyFootprint(): { rect, anchor } | null     // the day on screen, container px
visiblePeaks(from, peaks): Promise<Set<id> | null>
orbit(dir), orbitHold(dir), orbitRelease()      // look around (see "Orbit" in MAP.md)
```

The engine is camera-only; the URL and the composition live in React.

## The day model

- Days 1..D, D = `durationDays` (or the last waypoint day if later). A day with no stops is a **rest
  day** at the previous anchor.
- **Anchor**: the day's overnight stop (`nights > 0`), else its last stop. **Midpoints**: the rest.
- **Segment**: the route (`trip.route`, else the stops) from the previous anchor (or the start) to
  this anchor. Stops are matched to the line searching forward only, so out-and-back valleys put the
  return stops on the return leg.
- **Media** (two, A and B), in this order, without repeats: the day's key stops (anchor first),
  memories at its stops (newest first), its other stops, a mountain seen from the anchor, then unused
  reel items round-robin (never the same as the day before). A takes the place, B the subject; at
  most one clip per day.
- **Birds**: the species of group "bird" possible on the day's stops (`stats.todayIds`). (The model
  still carries `newIds` / `soFar`; the day view no longer shows them.)
- **Seen from here** (sheet): `waypoint.views` (optional, curated) wins. Otherwise peaks by distance
  (`SEEN_FROM`: ≥ 6,000 m within 60 km, lower ones within 20 km, not closer than 1.5 km), loomiest
  first; the client keeps the first four with a clear line of sight (eye 10 m over the ground, earth
  curvature and refraction, 64 samples on the DEM). The prerendered list is the distance-only one.

## Camera and map

- **Straightened**: bearing = direction of travel (start → end of the day's segment), so the walk
  runs up the screen to the anchor. Loops and short days (< `minChordKm`) use the walk's long axis;
  rest days keep the previous bearing.
- **Pitched** `CAMERA.day.pitch` (52° desktop, 56° phones), fitted to the segment and the day's stops
  inside `DAY_LAYOUT`'s clear band (desktop x 34–60 %, phones y 36–70 %), zoom clamped to
  [`minZoom` 10, `maxZoom` 13.4]; rest days `restZoom` 12.6.
- **Visibility**, kept straight: bearing offsets 0, ±10°, ±20° (outer loop) × pitches 52 / 44 / 36°
  (inner: lowering is preferred over turning); accepted when the anchor and ≥ 70 % of 8 samples along
  the walk are in sight. Cached per day and screen size.
- **Moves**: entering flies (`enterMs` 2,000 ms); day to day eases (fly beyond `CAMERA.stepFlyKm`)
  for `900 + 300·log2(1 + km/2) + 4·|Δbearing|` ms, clamped 900–1,800. A new step retargets from
  wherever the camera is (no queue). Reduced motion: jumps.
- **Midpoint**: camera to the stop, same bearing and pitch, `midpointZoomIn` 0.7 closer.
- **Map mood "day"** (paint overrides, in and out over 400 ms, instant with reduced motion;
  `look.ts` untouched): the terrain recedes by `--map-day-terrain-dim` (0.5: relief colour and
  hillshade at half strength), graticule and other trips off, the trip's whole route at 28 %. On
  top, a runtime overlay: a faint warm glow along today's walk (its corridor a little clearer), the
  days walked so far pale (60 %), today's stretch in the route colour, drawn in over 900 ms. The
  anchor carries the lens; the day's stops stay bright and labelled; other stops dim. Hover reveals
  are off. Constants: `DAY_MOOD`, `DAY_ROUTE` in `controller.ts`.
- Not yet: the real contour lines over the muted map (see "Open").

## Input thresholds (`JOURNEY_INPUT`, `stepInput.ts`)

| Input | Rule |
|---|---|
| Wheel / trackpad | accumulate to **40 px** → one step, then locked; unlock after **160 ms** quiet, or a fresh swipe during a momentum tail (delta ≥ **1.5×** the previous and ≥ **8 px**); at least **420 ms** between steps; sideways counts (`axisBias` 1.2); pinch (ctrlKey) ignored; line / page deltas normalised |
| Touch | swipe ≥ **56 px**, or a flick ≥ **24 px** at ≥ **0.4 px/ms**; < **10 px** is a tap |
| Keys | arrows, Page keys, Space / Shift+Space, J / K; held keys at most one step per **600 ms**; Esc closes the sheet, else exits; Home / End do nothing; Shift + ← / → are left to the orbit |
| Feedback | the text leans toward the next day by 0.3 × the delta (touch 0.4×), at most **28 px** |

Scroll is captured only while the day view is open (listeners attach on open, detach on exit). Form
fields, the inquiry drawer and the This-day sheet (`data-journey-scroll`) are left alone.

## Motion (tokens group 6 JOURNEY)

Per step: old text out 160 ms; photo A spreads in from its screen edge through the old one at
250 ms, B at 330 ms (800 ms; the old fades 600 ms); the headline at 450 ms, its line at 600, the
birds at 700. Opening in-app shifts it all by 900 ms (the camera flies first). Reduced motion:
crossfades only, no camera flights, still bird names. Clips: poster first; only the current day's
clip loads and plays (muted, loop, inline), released when the day moves on; Save-Data, 2g/3g or
reduced motion get posters only.

## Open

- **Contour lines** over the muted map (owner's decision): needs real, crisp isolines at day-view
  zooms. Options: `maplibre-contour` (DEM → vector isolines in a worker, a small dependency), or the
  contour texture (`scripts/geo/contours.mjs`) as a raster image source (registered to Web Mercator,
  but ~500 m/pixel: soft at zoom 12). Not done yet.
- Soundscapes per day, and a group toggle (birds / mammals / plants) are not built.
