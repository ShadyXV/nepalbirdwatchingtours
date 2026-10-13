# The map

How the map is built, its states, and where to retune it. Intent lives in `VISION.md` and
`EXPERIENCE.md`; this is the implementation note.

## How it is built

- **MapLibre GL 6**, client only. `app/routes/map-layout.tsx` lazy-loads `NepalMap` after hydration,
  so prerendered pages never touch `window` and the ~290 kB (gzip) map chunk loads after first paint.
- **No basemap.** The look is two layers over one elevation source (`look.ts`), lit for golden hour:
  - `color-relief`: rich, saturated colours by elevation: deep green lowland forest → deep olive
    mid-hills → olive-gold forest tops → golden alpine meadows → rosy-ochre bare ridges → pale rose
    scree → bright warm snow;
  - `hillshade`, `multidirectional` method: a warm sun (two close rays, so it has two thirds of the
    weight and a soft terminator) gives golden lit slopes and deep, clean slate-blue shadows, plus a
    faint cool sky fill that only lifts the shadow side. Relief strength rises with zoom
    (`HILLSHADE.exaggeration`). Anchored to the viewport so the light always comes from the upper
    half of the screen (light from below makes valleys read as ridges).
  - Sky / fog at pitched views: warm haze only on the far ground (MapLibre fogs the ground from
    pitch 60° up, from `SKY.fogGroundBlend` of the way to the horizon), a dawn-rose or sunset-amber
    glow at the horizon, fading into the dark page.
  - Elevation: public Terrarium tiles (AWS Terrain Tiles / Mapzen), limited to a box around Nepal.
    Colour + shading fetch up to z14 (`DEM.maxzoom`), so close stop views stay crisp; the 3D mesh
    stops at z11 (`DEM.terrainMaxzoom`), it needs far less detail.
- **Outside Nepal** is muted by its own layer, `outside-veil` (a world rectangle with Nepal cut out,
  from `public/geo/nepal.geojson`: Natural Earth 1:10m, simplified to ~630 points, 11 kB), plus a soft
  dark edge and a hairline border.
- **Graticule** (generated 0.5° lines, faint, fading with zoom), **paper grain** (a fine dark stipple:
  texture without lifting the shadows), **cloud patches** (faint at closer views) and an **edge
  vignette**: the last three are static DOM over the canvas (`map.css`), no per-frame cost.
- **3D**: `setTerrain` with exaggeration 1.3 on capable devices. Off with Save-Data, low memory or few
  cores, and dropped at runtime after repeated slow frames during camera moves (then pixel ratio 1).
  Pixel ratio is capped at 2. Rendering is on demand: nothing runs while the map is idle.
- **Labels, pins and stops are DOM markers** (`markers.ts`, styled in `map.css`) so they use the site
  fonts; no glyph pipeline. A collision pass (`labels.ts`) runs when the camera settles, never per frame.
- **Routes**: one GeoJSON source with every trip, `lineMetrics: true`. Lines are slightly hand-drawn
  (seeded bows + Chaikin smoothing, `handDrawn` in `lib/geo.ts`). A segment's bow depends only on
  its two end points, so out-and-back legs (Chhomrong ⇄ ABC, Poon Hill) stay ONE line; seeding by
  position made the two legs bow apart into two parallel lines. The active route is one thin pale
  line (`--color-map-route`, snow) over a subtle dark casing (`--color-map-route-casing`); it
  draws in by animating `line-gradient` over `line-progress` (`routeDraw.ts`, which always uses the
  map route tokens). Other trips' routes stay faint and dashed.
- **Camera framings** are computed from the content (`camera.ts`), so new trips and places frame
  themselves. `controller.ts` turns the URL state into markers, layers and camera moves.

## States

| State | URL | Map |
|---|---|---|
| S0 overview | `/` | All of Nepal on landscape screens; on portrait phones the band holding the trips and tier-1 places (all of Nepal would be a thin strip there). Bearing 17° lays Nepal level, pitch 20°. Trip pins: cover photo in a blob frame, name, "142 birds" (number in the accent italic). On narrow maps only the previewed pin shows its name. Swiping the home trip cards raises that pin and (phones) eases the camera to it, once the user is idle. |
| S1 trip | `/trips/:slug` | `flyTo` (~2.6 s) to the route's fit, pitch 45°, bearing along the route, then checked for visibility (the key stops must not hide behind ridges). The route draws in from ~55% of the flight; stops pop in with a stagger. Stops are dark hand-drawn blobs with a bold pale outline and a line icon (below); key stops large, other stops smaller and quieter. The navigator pill (top) steps through the key stops; "Start the journey" opens the day view. |
| S2 stop | `?stop=<id>` | A deliberate step: pan + turn + tilt (`--duration-map-step`, 1.4 s; a small fly arc beyond 6 km) to a camera that can see the stop. The stop inverts (pale blob, dark icon, thin copper ring); lens (thin pale ring with four ticks, faint grid, no fill); other stops dimmed. Closing the stop returns to the exact camera from before. |
| S3 place | `/places/:id` | Framed by kind. Peaks: a low camera (pitch 62°) looking at the face from the nearest trip stop or city, then turned / lowered until the summit is not hidden. Its range glows softly. |

Direct landings start already framed (no flight, no draw, no pop), then correct the camera once
the elevation data is in if the subject was hidden (only if the user hasn't touched the map).
Reduced motion: jumps, no draw, no pop, no lens animation.

## Stop markers (`markers.ts`, `map.css`)

After the San Rita markers: a dark, slightly irregular blob (`--color-map-marker`, night; seeded
by the stop id, `STOP_BLOB`) with a bold pale outline and a line icon inside
(`--color-map-marker-ink`, snow), all icons drawn on one 24-unit grid in one stroke weight
(`STOP_ICONS`, no icon library). `stopIcon()` picks it:

| Icon | Used for |
|---|---|
| teahouse / lodge | stays (`nights > 0`), unless `stay.kind` is `camp` |
| tent | camp nights; pass-through `camp` stops (base camps) |
| peak | `viewpoint`, `pass` |
| water | `river`, `wetland` |
| binoculars | every other pass-through stop (villages, forest, gates: birding on the way) |

Key stops: `--stop-size` 1.9rem, 2.25px outline, 1.5px icon. Other stops: 1.2rem, 1.5px outline,
1.25px icon, ink a little dimmer. Active: the blob inverts (pale fill, dark outline and icon),
grows (`--stop-active-scale`) and gets a thin copper ring (`STOP_RING_SCALE`). Behind a ridge:
translucent fill, dashed outline. Labels: label caps in snow with a tight dark halo
(`--text-shadow-map-label`); no orange or muted-grey text on the terrain (hover / open place
names get a copper underline instead).

## Gestures (`gestures.ts`)

The map is always a real, explorable map; automatic moves never fight the user.

- **Home (S0)**: desktop mouse drag pans (with inertia); the wheel scrolls the page unless pinching
  (trackpad) or holding Ctrl / ⌘. Phones: **two fingers** pan and zoom (MapLibre cooperative
  gestures), so one-finger swipes still scroll the page. We chose two fingers over "one finger if the
  swipe is horizontal" because the browser can then scroll natively with no delay or guessing (a
  direction test has to hold the first touch frames, which makes page scroll feel sticky, and diagonal
  swipes misfire). MapLibre's full-map banner is hidden; a quiet pill hint appears once per page
  view, only after a sideways one-finger swipe (or the first blocked wheel on desktop).
- **Trip / place**: one finger / mouse drag pans, wheel and pinch zoom, right-drag / Ctrl-drag /
  two-finger twist and tilt rotate and tilt. The content sheet below the map is the scroll handle.
- **Soft edge**: a pan that ends with the centre more than `CAMERA.softBoundsMargin` past Nepal's
  outline eases back inside; MapLibre's hard `maxBounds` is far out (`hardBoundsMargin`), a safety net.
- **Reset view** appears (right edge) once the user turns or tilts more than `CAMERA.adjustedDeg`
  from where the app put the camera; it restores the state's own bearing and tilt (the visibility-
  checked view; in the day view, the straightened day camera), keeping the centre and zoom.
- **Orbit** is the primary map control (below). Zoom +/− are demoted: two small buttons under it, on
  desktop pointers only (hidden on phones, where pinch zooms, and in the day view).
- **Day view** (`journey` mode): no pan, zoom or MapLibre rotate; scroll, swipe and keys step the
  days (`docs/JOURNEY.md`), and only the orbit may turn the camera.
- **User first**: the home preview easing waits until the user has been idle for
  `CAMERA.userIdleMs`; automatic camera moves never fight the user.

## Orbit (`orbit.ts`)

In mountains seen in our near-isometric perspective, looking *around* a ridge (to see a stop that a
valley hides) is more useful than zooming in, so the main control turns the camera around the point
in focus, keeping pitch and zoom.

- **Focus point**: in the day view the tapped stop or the day's anchor; else the focused stop (URL
  or engine); else the open place; else (or when that point is off screen) the screen centre.
- **↺ ↻ buttons** (right edge, thumb-sized on touch screens): a tap turns `CAMERA.orbitStepDeg` (35°)
  over `CAMERA.orbitMs` (700 ms, `--ease-map`); press and hold longer than `CAMERA.orbitHoldMs`
  (320 ms) keeps turning at `CAMERA.orbitDegPerSec` (24°/s) until release. ↺ turns the scene
  anticlockwise (bearing grows).
- **Keys**: Q / E (and Shift + ← / →), tap or hold, anywhere on a map page (not while typing or
  with the inquiry drawer open).
- **Right-drag / Ctrl-drag** (desktop): with a focus point on screen, horizontal drag orbits around
  it and vertical drag tilts (MapLibre's own drag-rotate, which turns around the centre, is switched
  off for that gesture); without one, MapLibre's drag-rotate as before.
- How: the camera centre C rotates around the focus F in Web Mercator, `C' = F − R(θ)(F − C)`, while
  the bearing turns by θ; one rAF loop only while turning. It counts as the user's camera input
  (shows "reset view"). The visibility check is not applied to a look-around; in
  the day view the next day step straightens the camera again.
- Reduced motion: one instant 45° snap per tap (`CAMERA.orbitReducedDeg`), no continuous orbit.

## Hover reveal (`reveal.ts`)

Hovering a trip pin (home) or a stop with media (trip overview: key stops, and minor ones that have
media) shows a large photo or muted clip beside it, edges feathered into the map (`mask-image`, two
intersected soft ramps; `.nbt-reveal` in `map.css`). No card, no pointer events: it lasts only while
the pointer is over the small marker and fades out (`--duration-ui`) when it leaves, the camera
moves, the state changes, the page scrolls or the tab hides. One at a time. Phones: press and hold;
release ends it and the hold never becomes a tap. Placed on the marker's roomiest side inside the
free area (peek, stepper and control column excluded), shrunk to fit, never over the marker; no room
for the minimum size → no reveal. Trips crossfade through `trip.reel` (cover if empty); stops show
their media, then their memories' media; caption `Day n` (accent italic, stops) + name (label caps).
Media load only on intent; videos are released when hidden. Save-Data: stills only. Reduced motion:
one still, fade only. Content comes from `MapContent.revealTrip / revealStop` (`NepalMap.tsx`).

`REVEAL` constants: `intentMs` 150 (hover delay), `holdMs` 350 (press-and-hold), `holdMovePx` 10
(a hold that moves is a pan), `swallowClickMs` 600 (click after a hold ignored), `longSideShare`
0.4 of the map width clamped to `longSidePx` [300, 480], `minLongSidePx` 180, `aspect` 3:2,
`gapPx` 14 (to the marker), `edgePx` 12 (to the free area's edge), `intervalMs` 1800 (crossfade
every; the fade itself is `--duration-sheet`), `maxItems` 6. Feather ramps and caption: `map.css`.

## Visibility-aware camera (`visibility.ts`, `dem.ts`)

For a candidate camera we rebuild MapLibre's eye position (`D = 0.5 / tan(fov/2) · viewport height`,
in metres at that zoom, tilted by the pitch, behind the centre) and walk the line of sight from the eye
to each target, sampling the ground every 1/40 of the way from a CPU copy of the same Terrarium tiles
(`DemSampler`, z10, ~130 m pixels, decoded once into 16-bit metres, at most 36 tiles ≈ 4.6 MB). The
ground, exaggerated like the rendered terrain, must stay 25 m below the line. Candidates go from the
least rotation (current bearing, then the direction of travel) and the highest pitch outwards; the
first clear view wins; if none is clear, the view hiding the fewest targets at the lowest pitch.

Used for stops (any bearing, pitches 50→28°), the whole-route view (key stops, ±45°, 45→30°) and
peaks (face bearing ±60°, 62→38°). Cost: a few thousand array reads per decision (well under a
millisecond); results are cached per stop / trip / place. Elevation for a trip is prefetched when the
trip opens (usually from the HTTP cache, ~10–16 tiles); a camera move waits at most
`CAMERA.visibilityWaitMs` for it, then goes ahead with the geometric view. No 3D terrain → no check.
Stops still hidden behind terrain stay visible (dashed, translucent) rather than fading out.

## Stepping engine (controller.ts)

The engine focuses a trip's stops one at a time: highlight + visibility-aware camera, with a camera
history. It is camera-only (never touches the URL). React gets it from `NepalMap`'s `onReady(api)`; the map layout passes it to pages as
`useMapLayoutContext().map`, with the live state as `.step`.

```ts
type StepperApi = {
  goToStop(index: number, options?: { direction?: 1 | -1; source?: "engine" | "url" }): Promise<void>;
  next(options?): Promise<boolean>;   // false: no next key stop (nothing moves)
  prev(options?): Promise<boolean>;
  back(): Promise<void>;              // to exactly where the camera was before stepping began
  state(): StepState;                 // { tripSlug, keyStopIds, index, waypointId, source }
};
// MapApi = StepperApi & JourneyApi (docs/JOURNEY.md) & OrbitApi
//          & { resetView, zoomIn, zoomOut, setOutsideVeil, nepalOutlinePath }
```

- Indexes are into the **key stops** (`app/lib/tripStops.ts`: `waypoint.key`; falls back to overnight
  stops, then all stops). `direction` makes the camera prefer the direction of travel (or its reverse).
- Every promise resolves when the camera has arrived (or was interrupted). A newer move always wins.
- **Camera history**: the first focus remembers the camera; `back()` returns there exactly. The URL
  flow uses it too: opening a stop pushes one history entry, stepping replaces it, closing it (Esc,
  tapping the stop again, browser Back) pops it and calls `back()`.
- The auto-tour (autoplay) was removed in favour of "Start the journey" (the day view).
- The trip overview uses it through the on-map navigator (`StopStepper`, `navigator.css`): a compact
  stepper pill at the top of the map (‹ DAY 4 · NAME ›, ← → and Esc keys), which writes `?stop=`;
  "Start the journey" above the story's peek; and, on the story's top edge, a round marker-style
  button that brings the story up (and, once it is up, back to the map).

## Layout and scroll

`map-layout.tsx` + `components/map/layout.css`: a sticky map stage (sized to the largest viewport so
mobile bar changes never resize the canvas), a transparent spacer that lets taps through to the map,
and the page content as a dark sheet in normal document flow, rising over the map on scroll (the map
dims). Every map page has this shape (no sidebar): home peeks 44% / 20% (phone / desktop), trip and
place stories 26% / 16%. Trip pages add the stop stepper just above the peek. Sheet and headline
entrances run only on client-side navigation; a direct landing shows the content immediately.
Peek sizes live in `app/lib/mapLayout.ts`, shared by the CSS and the camera padding.

## Retuning

| What | Where |
|---|---|
| Terrain colours, light/shade colours, outside veil, haze, route / marker colours, map label halo | `app/design/tokens.css`, group 4 "MAP" (mirror in `tokens.ts`): `--color-map-*`, `--color-map-route(-casing)`, `--color-map-marker(-ink)`, `--text-shadow-map-label` |
| Elevation stops of the colour bands | `RELIEF_STOPS` in `components/map/look.ts` |
| Sun: direction, height, colour, strength of light / shadow / sky fill, horizon glow | `LIGHT` presets in `look.ts` (`dawn`, `sunset`); `DEFAULT_LIGHT` picks one; `?light=dawn\|sunset` in development compares them (reload) |
| Hillshade mechanics: relief strength by zoom (`exaggeration`, 0–1), second sun ray, sky fill direction | `HILLSHADE` in `look.ts` |
| Elevation detail: shading / colour tile zoom, 3D mesh zoom | `DEM.maxzoom` (14), `DEM.terrainMaxzoom` (11) in `look.ts`; each +1 is ~4× the tiles of a close view |
| Outside-Nepal veil, border, graticule, range glow | `OUTSIDE`, `GRATICULE`, `RANGE_GLOW` in `look.ts` |
| Route: widths by zoom, casing width / opacity / blur, faint routes, dash | `ROUTE` in `look.ts` |
| Haze / fog at pitched views (where it starts, horizon blend) | `SKY` in `look.ts` (`fogGroundBlend` 0.84: far distance only) |
| Stop icons, which icon a stop gets, blob wobble, active ring | `STOP_ICONS`, `stopIcon()`, `STOP_BLOB`, `STOP_RING_SCALE`, `STOP_ICON_SCALE` in `markers.ts` |
| Stop sizes and strokes per tier, active scale | `--stop-size`, `--stop-outline`, `--stop-icon-stroke`, `--stop-active-scale` on `.nbt-stop` / `.nbt-stop--minor` in `map.css` |
| Lens size, ring / tick / grid strength | `.nbt-lens` (`--lens-size`, `--lens-ink`) in `map.css` |
| Paper grain, cloud patches | `.nbt-map__grain`, `.nbt-map__clouds` in `map.css` |
| 3D exaggeration | `TERRAIN_EXAGGERATION` in `look.ts` |
| Pitch, bearing, zoom limits, margins per state | `CAMERA` in `components/map/camera.ts` |
| Day view camera (pitch, zoom range, visibility, move durations) / mood and day overlay | `CAMERA.day` / `DAY_MOOD`, `DAY_ROUTE` in `controller.ts` (see `docs/JOURNEY.md`) |
| Orbit (step, duration, hold, speed, reduced-motion snap) | `CAMERA.orbitStepDeg`, `orbitMs`, `orbitHoldMs`, `orbitDegPerSec`, `orbitReducedDeg`; look in `components/map/controls.css` |
| Bounds and zoom limits | `CAMERA.softBoundsMargin` (soft edge, degrees past Nepal's outline, lng/lat), `CAMERA.hardBoundsMargin` (MapLibre maxBounds), `CAMERA.minZoomSlack` (zoom-out limit below the all-of-Nepal fit, recomputed on resize), `CAMERA.maxZoom` (14.5; the shading DEM ends at z14) |
| Gestures: inertia, idle time before automatic moves, reset-view threshold | `CAMERA.inertia`, `CAMERA.userIdleMs`, `CAMERA.adjustedDeg` |
| Visibility search (pitches, bearing steps / spans per state, wait, prefetch area) | `CAMERA.stop/trip/place.visibility`, `CAMERA.visibilityWaitMs`, `CAMERA.visibilityMarginKm`; sampling and margin in `VISIBILITY` (`visibility.ts`) |
| Stepping | `--duration-map-step` (tokens), `CAMERA.stepFlyKm` |
| Flight / ease / draw / pop timings and easings | `--duration-map-*`, `--duration-route-draw`, `--duration-pop`, `--duration-soft-edge`, `--ease-map`, `--ease-pop` in tokens |
| When the route draws / stops pop during a flight | `DRAW_AT`, `POP_AT` in `controller.ts` |
| Label tiers by zoom, label priority | top of `controller.ts`, `labelPriority()` |
| Hover reveal: delays, sizes, crossfade interval / feather and caption | `REVEAL` in `components/map/reveal.ts` / `.nbt-reveal` in `map.css` |
| Pin, stop (key / minor / covered), lens, engine tag, label, map controls look | `components/map/map.css`; orbit / zoom in `controls.css`; navigator and story button in `navigator.css` (stepper base in `layout.css`) |
| Peeks, stepper room | `MAP_LAYOUT` in `app/lib/mapLayout.ts` |
| Frame-rate budget for dropping 3D | `perf.ts` |

## Golden-hour light

`LIGHT` in `look.ts` holds two presets; `DEFAULT_LIGHT` (one word) chooses the one the site uses.

| Preset | Sun | Look |
|---|---|---|
| `sunset` (default) | from the upper left (300°), 27° up, deep amber `--color-map-sun-sunset`, light 0.95 / shadow 0.92 / sky 0.12 | warmer, deeper shadows, amber horizon |
| `dawn` | from the upper right (55°), 31° up, pale peach-gold `--color-map-sun-dawn`, light 0.85 / shadow 0.86 / sky 0.16 | softer and a little paler, rosy horizon |

Why not a real golden-hour altitude (~17°): in MapLibre's hillshade a slope lit at less than 30°
is SHADED, so a low sun tints even flat valley floors with the shadow colour (the grey-violet veil
of the first version). Around 26–32° flat ground stays neutral to faintly warm, sun-facing slopes go
golden and turned-away slopes deep; the golden-hour mood comes from the colours. The sky fill sits
at the neutral 30° and never shades, so it only lifts the shadow side.

Shadows are `--color-map-shade` (deep slate blue), the sky fill is `--color-map-skylight`. In
development, add `?light=dawn` or `?light=sunset` to any map URL and reload to compare; production
builds ignore the parameter. Directions are relative to the screen, so the light stays the same
however the camera turns (a deliberate trade against real-world sun positions).

## Golden-hour relief (planned refinement)

The live hillshade can only tint slopes by their angle to the sun. The next step towards the
"painted" San Rita-like terrain (their approach: a baked diffuse texture and normal map lit by one
low warm light with real shadows; we would build our own on real Nepal data, never their assets)
is a **baked relief raster**, rendered once on the owner's machine and draped over the 3D terrain:

- **Albedo from land cover**: forest deep olive with a fine canopy stipple, shrub and grass khaki,
  bare rock and sparse vegetation rosy ochre, snow and ice warm white, water deep navy, built-up
  muted. Colours from the MAP tokens.
- **Light**: Lambert diffuse from DEM normals with the `LIGHT` preset's sun (azimuth, altitude,
  colour); **cast shadows** by sweeping along the sun direction (a horizon / line-sweep algorithm,
  not a per-pixel march) with a soft penumbra; **sky ambient occlusion** from a few horizon
  directions so valleys are softer and darker, with a cool ambient fill in shadow; light aerial
  haze with distance / low elevation and a gentle grade towards gold.
- **Output**: 256 px WebP tiles per preset (`public/relief/{preset}/{z}/{x}/{y}.webp`, z8–z12 or
  z13), a small `relief.ts` module adding them as a `raster` source and layer bounded to the baked
  region and zooms, blending into the live golden hillshade outside it. Start with one region
  (Annapurna: ~83.55–84.25 E, 28.15–28.75 N), then decide on all of Nepal by tile size.
- **Script**: a re-runnable Node script (`scripts/relief/bake.mjs`), time-boxed and run at low
  priority (`timeout … taskpolicy -b`), checked by viewing downscaled preview images.
- **Data**:
  - Elevation: AWS Terrain Tiles, Terrarium encoding (`elevation = R·256 + G + B/256 − 32768`),
    z12; sources SRTM and others, compiled by Mapzen
    ([attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)). Decode with
    ImageMagick (`magick … -depth 8 rgb:`); no GDAL needed.
  - Land cover: ESA WorldCover 2021 v200, 10 m, **CC BY 4.0** (attribution required: "© ESA
    WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA
    WorldCover consortium"). Public Cloud-Optimized GeoTIFFs on AWS
    (`esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/…`); read only the needed window
    with HTTP range requests (e.g. the `geotiff` npm package). Fallbacks: Copernicus Global Land
    Cover 100 m, or a pseudo land cover from elevation and slope.
  - The attribution goes into the raster source's `attribution` field so it shows in the map's
    attribution control.

## Hooks for later

- **Outside-Nepal veil is its own layer** (`LAYER.outside`; `map.setOutsideVeil(opacity)` on the
  MapApi), and `map.nepalOutlinePath()` returns Nepal's outline projected for the current camera as
  an SVG path in map pixels. Planned use: on desktop home, hovering a trip fades a large trip photo
  in behind the map, strong outside Nepal (veil lowered, or the path as a CSS/SVG mask) and faint
  inside. Available through `useMapLayoutContext().map`; not used yet.
- **Day view** ("the journey", built): `docs/JOURNEY.md`. The controller's `JourneyApi`
  (`openJourney / goToDay / focusDayStop / closeJourney / setMapMood / visiblePeaks`) straightens
  each day, mutes the map with paint overrides (restored on exit) and draws today's stretch as a
  runtime overlay; React (`components/journey`) owns the URL and the composition.

## Known limitations / next steps

- **Self-host the DEM before launch**: a Nepal-only Terrarium (or Mapbox-RGB) tile set cut with GDAL
  from SRTM / Copernicus GLO-30, z0–12, served from `public/` or a CDN. Removes the third-party
  runtime dependency and usage-policy risk; keep the attribution.
- Optional **baked relief raster**: see "Golden-hour relief (planned refinement)" above.
- **Cloud parallax** bound to zoom (DOM, cheap), **cursor lens** on desktop S1/S2, **ink-blot page
  transitions** to /about and /anywhere.
- Boundary: Natural Earth's de facto line (the Kalapani area follows it). Revisit if needed.
- Labels are DOM markers: fine for dozens; past ~150 switch to a symbol layer with self-hosted glyphs.
- Desktop home cards are hover-synced, not a separate list yet.
- The visibility check uses one DEM zoom (z10): narrow gorges finer than ~150 m can still hide a stop.
- The map remounts when leaving the map layout (/about, /anywhere); move it to the root layout if the
  ambient-map About page is chosen.
