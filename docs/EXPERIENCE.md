# Experience structure

How a visitor moves through the site, designed for phones first. Visual spec: `STYLE_GUIDE.md`.
Technique source: `research/SANRITA_INTERACTION.md` (we borrow choreography, not code or renderer).

## Principles

1. **The map is the stage; content rises over it.** One MapLibre map, mounted once, never reloaded.
   Routes move the camera; they don't swap pages.
2. **Native scroll, never hijacked.** "Scroll to enter" is ordinary page scroll with the map sticky
   behind. Nothing traps the thumb.
3. **One gesture, one meaning (mobile).** Where the map is a backdrop, touches scroll the page. Where
   the map is explorable, the content sheet is a separate, always-visible drag target.
4. **Every state has a URL.** `/`, `/trips/:slug`, `/trips/:slug?stop=<id>`. Back button = fly back.
5. **Personal, not a brochure.** Each trip and stop leads with *memories*: past trips with real guests,
   their photos, the birds and animals seen together, told in Krishna's voice. Altitude, stays and
   checklists are supporting detail in a compact strip.
6. **Content first, map as enhancement.** Prerendered HTML carries everything. The map chunk loads after
   first paint; reduced-motion gets jumps instead of flights.

## Map states

| State | URL | Camera | Map gestures | What's on the map |
|---|---|---|---|---|
| **S0 Overview** | `/` | All of Nepal, low pitch, slight bearing | Off (backdrop); pins tappable | Terrain, graticule, 6–8 labels (Kathmandu, Pokhara, Chitwan, Bardia, main peaks), trip pins |
| **S1 Trip** | `/trips/:slug` | Fit trip bounds, pitch ~55–60°, route-aligned bearing, bottom padding for the sheet | On, inside the visible map area | Route draws in, stop markers pop in with a stagger, trip's peaks labelled |
| **S2 Stop** | `?stop=<id>` | Ease to stop, closer, slight orbit | On | Lens ring + grid around the stop; other stops dimmed |
| **Ambient** | `/about` | Slow, gentle drift over Krishna's home hills, dimmed | Off | Terrain only |

**Places (overlay on any state, `?place=<id>`):** mountains, ranges, parks and one-off points of
interest are tappable hubs outside the itineraries. Tapping one eases the camera a little toward it and
opens a small **place card**. It does not navigate away; close returns to where you were.

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
├──── drag handle ─────────┤  sheet peek (~35% height), always visible
│ 9 DAYS · 3,870 M · 142 🐦│
│ ‹ Day 1 Syabrubesi › ‹D3›│  stop stepper (swipe) ↔ camera follows
│ [Inquire about this trip]│
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

### Place card (mountains, ranges, points of interest)

```
├──── sheet (half) / popover on desktop ┤
│ [landscape media carousel]            │  Everest at dawn, the range from Kala Patthar…
│ MOUNT EVEREST · 8,849 m               │  field-label style
│ Mahalangur Himal                       │
│ one or two warm sentences             │
│ AROUND HERE  Himalayan Monal · Snow Partridge · Himalayan Tahr · …  (6–12, light)
│ TRIPS NEARBY  [Annapurna trek card] or "none yet"
│ [Plan a trip here]  → inquiry drawer prefilled with the place
└───────────────────────────────────────┘
```

Mountains get special love: big peaks stay labelled on the overview, and ranges glow subtly when one of
their peaks is tapped. Not a full page; just enough to see the beauty and want to go.

### Persistent mobile actions

- Floating **Inquire** button bottom-right on every page (hidden while the drawer is open). The drawer
  is a full-height sheet with a date-range picker, party size and WhatsApp / email / Instagram send.
- Deep links open it prefilled: `?inquire&trip=…&from=…&to=…&party=…`.

## Desktop (≥ 1024 px)

Same states. The sheet becomes a left column (about 28–32 rem) that scrolls independently, and the map
fills the rest. Giant headlines overlap the map from the column edge. Pins are big enough alone, so the
card carousel becomes a hover-synced list. An optional cursor-following lens appears in S1/S2.

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
