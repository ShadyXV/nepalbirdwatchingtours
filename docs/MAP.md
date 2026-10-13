# The map

How the map is built, its states, and where to retune it. Intent lives in `VISION.md` and
`EXPERIENCE.md`; this is the implementation note.

## How it is built

- **MapLibre GL 6**, client only. `app/routes/map-layout.tsx` lazy-loads `NepalMap` after hydration,
  so prerendered pages never touch `window` and the ~290 kB (gzip) map chunk loads after first paint.
- **No basemap.** The look is two layers over one elevation source (`look.ts`):
  - `color-relief`: natural colours by elevation (Terai greens → green-brown hills → ochre ridges →
    cool greys → snow);
  - `hillshade`, `multidirectional` method: a warm low "sun" from the upper left plus two fill lights,
    anchored to the viewport so light always falls from the top left.
  - Elevation: public Terrarium tiles (AWS Terrain Tiles / Mapzen), limited to a box around Nepal.
- **Outside Nepal** is muted by its own layer, `outside-veil` (a world rectangle with Nepal cut out,
  from `public/geo/nepal.geojson`: Natural Earth 1:10m, simplified to ~630 points, 11 kB), plus a soft
  dark edge and a hairline border.
- **Graticule** (generated 0.5° lines, faint, fading with zoom), **paper grain**, **cloud patches** and
  an **edge vignette**: the last three are static DOM over the canvas (`map.css`), no per-frame cost.
- **3D**: `setTerrain` with exaggeration 1.3 on capable devices. Off with Save-Data, low memory or few
  cores, and dropped at runtime after repeated slow frames during camera moves (then pixel ratio 1).
  Pixel ratio is capped at 2. Rendering is on demand: nothing runs while the map is idle.
- **Labels, pins and stops are DOM markers** (`markers.ts`, styled in `map.css`) so they use the site
  fonts; no glyph pipeline. A collision pass (`labels.ts`) runs when the camera settles, never per frame.
- **Routes**: one GeoJSON source with every trip, `lineMetrics: true`. Lines are slightly hand-drawn
  (seeded bows + Chaikin smoothing, `lib/geo.ts`). The active route draws in by animating
  `line-gradient` over `line-progress` (`routeDraw.ts`); other routes stay faint.
- **Camera framings** are computed from the content (`camera.ts`), so new trips and places frame
  themselves. `controller.ts` turns the URL state into markers, layers and camera moves.

## States

| State | URL | Map |
|---|---|---|
| S0 overview | `/` | All of Nepal on landscape screens; on portrait phones the band holding the trips and tier-1 places (all of Nepal would be a thin strip there). Bearing 17° lays Nepal level, pitch 24°. Gestures off: touches scroll the page; pins and labels stay tappable. Trip pins: cover photo in a blob frame, name, "142 birds" (number in the accent italic). On narrow maps only the previewed pin shows its name. Swiping the home trip cards raises that pin and (phones) eases the camera to it. |
| S1 trip | `/trips/:slug` | `flyTo` (~2.6 s) to the route's fit, pitch 58°, bearing along the route (phones look along it, landscape lays it across). The route draws in from ~55% of the flight; stops pop in with a stagger and back-out overshoot. Stays: filled rhododendron blobs; pass-through spots: small hollow monal-ringed blobs. The trip's peaks are labelled. Gestures on. |
| S2 stop | `?stop=<id>` | `easeTo` (0.9 s) closer, +12° orbit. A lens (ring, faint grid, warm glow) around the stop; other stops dimmed. |
| S3 place | `/places/:id` | Framed by kind. Peaks: low camera (pitch 70°) looking at the face, from the nearest trip stop or city, within 35° of north. A range glows softly (blurred light line through its peaks) while it or one of its peaks is open. |

Direct landings start already framed (no flight, no draw, no pop). Reduced motion: jumps, no draw,
no pop, no lens animation. Back = fly out to S0.

## Layout and scroll

`map-layout.tsx` + `components/map/layout.css`: a sticky map stage (sized to the largest viewport so
mobile bar changes never resize the canvas), a transparent spacer that lets taps through to the map,
and the page content as a sheet in normal document flow. On the home page the content rises as a
dark sheet and the map dims with scroll. On trip/place pages the sheet peeks (36% on phones) and
expands by plain page scroll.

**Desktop (≥ 1024 px): the sheet is a left column (30 rem) that scrolls with the page.** We chose
document scroll over an independently scrolling column: one scroll model on every screen, the
content stays normal flow (find-in-page, keyboard, screen readers, scroll restoration all just
work), the wheel over the map zooms the map and over the column scrolls the story, and the map is
fixed behind so nothing is lost. The camera pads by the column width.

Sheet and headline entrances run only on client-side navigation (`data-enter`), about halfway into
the flight; a direct landing shows the content immediately. Peek sizes and the column width live in
`app/lib/mapLayout.ts`, shared by the CSS and the camera padding.

## Retuning

| What | Where |
|---|---|
| Terrain colours, light/shade colours, outside veil, haze | `app/design/tokens.css`, group 4 "MAP" (mirror in `tokens.ts`) |
| Elevation stops of the colour bands | `RELIEF_STOPS` in `components/map/look.ts` |
| Light directions and strengths | `HILLSHADE` in `look.ts` |
| Outside-Nepal veil, border, graticule, route widths, range glow, sky/fog | `OUTSIDE`, `GRATICULE`, `ROUTE`, `RANGE_GLOW`, `SKY` in `look.ts` |
| 3D exaggeration | `TERRAIN_EXAGGERATION` in `look.ts` |
| Pitch, bearing, zoom limits, margins per state | `CAMERA` in `components/map/camera.ts` |
| Bounds and zoom limits | `CAMERA.boundsMargin` (degrees past Nepal's outline, lng/lat), `CAMERA.minZoomSlack` (zoom-out limit below the all-of-Nepal fit, recomputed on resize), `CAMERA.maxZoom` (14.5; the DEM ends at z12) |
| Flight / ease / draw / pop timings and easings | `--duration-map-*`, `--duration-route-draw`, `--duration-pop`, `--ease-map`, `--ease-pop` in tokens |
| When the route draws / stops pop during a flight | `DRAW_AT`, `POP_AT` in `controller.ts` |
| Label tiers by zoom, label priority | top of `controller.ts`, `labelPriority()` |
| Pin, stop, lens, label look | `components/map/map.css` |
| Sheet peek, column width | `MAP_LAYOUT` in `app/lib/mapLayout.ts` |
| Frame-rate budget for dropping 3D | `perf.ts` |

## Hooks for later

- **Outside-Nepal veil is its own layer** (`LAYER.outside`, `MapController.setOutsideVeil(opacity)`),
  and `MapController.nepalOutlinePath()` returns Nepal's outline projected for the current camera as
  an SVG path in map pixels. Planned use: on desktop home, hovering a trip fades a large trip photo
  in behind the map, strong outside Nepal (veil lowered, or the path as a CSS/SVG mask) and faint
  inside. Not wired to React yet.

## Known limitations / next steps

- **Self-host the DEM before launch**: a Nepal-only Terrarium (or Mapbox-RGB) tile set cut with GDAL
  from SRTM / Copernicus GLO-30, z0–12, served from `public/` or a CDN. Removes the third-party
  runtime dependency and usage-policy risk; keep the attribution.
- Optional **baked relief raster** (hillshade + colour + paper grain, made at build time) for the
  closest "printed paper" look; decide once the live look is judged.
- **Cloud parallax** bound to zoom (DOM, cheap), **cursor lens** on desktop S1/S2, **ink-blot page
  transitions** to /about and /anywhere.
- Boundary: Natural Earth's de facto line (the Kalapani area follows it). Revisit if needed.
- Labels are DOM markers: fine for dozens; past ~150 switch to a symbol layer with self-hosted glyphs.
- Desktop home cards are hover-synced, not a separate list yet.
- The map remounts when leaving the map layout (/about, /anywhere); move it to the root layout if the
  ambient-map About page is chosen.
