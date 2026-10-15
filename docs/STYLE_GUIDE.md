# Nepal Birdwatching Tours: Style Guide

Voice: warm, friendly, professional, and excited about birds and nature. Short sentences, concrete birds and places, no hype.

The type pairing is modelled on San Rita (sanrita.ca): a very tall, ultra-compressed uppercase display face over a monospaced text face. Because the original fonts are commercial (see below), this guide uses free Google Fonts that approximate them.

---

## 1. Typography

### 1.1 Source fonts (reference only)

| Role | San Rita original | Foundry | Evidence |
|---|---|---|---|
| Display headlines | F37 Stout, Black Compressed (weight 900) | F37 Foundry | `F37stout_black_compressed_webfont` woff2 in San Rita's CSS |
| Body, labels, captions | Centra Mono (Book 400, Bold 700) | Designed by Josh Finklea; Sharp Type original, sold by Monotype | `centramono_book_webfont` / `centramono_bold_webfont` woff2 in San Rita's CSS |

The Centra Mono webfont licence has not been confirmed, and self-hosting it would need a web licence from Monotype or Sharp Type. The Google Fonts picks below avoid that.

### 1.2 Primary recommendation

| Role | Google Fonts family | Weights to load | npm package (Fontsource) | Variable? |
|---|---|---|---|---|
| Display | **Anton** | 400 (only weight) | `@fontsource/anton` | No. There is no `@fontsource-variable/anton` |
| Body / labels | **DM Mono** | 400, 500 (300 optional) | `@fontsource/dm-mono` | No. There is no variable package |

Fallback stacks:

```css
--font-display: "Anton", "Impact", "Haettenschweiler", "Arial Narrow Bold", sans-serif;
--font-mono: "DM Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
```

Why these:
- **Anton** is the closest free match for an ultra-compressed, very heavy display cut. Its proportions are very tall and dense, like F37 Stout Black Compressed.
- **DM Mono** is a neutral geometric mono with a clean, modern feel, close to Centra Mono's sans-like mono forms. It reads well at small sizes.

### 1.2b Accent italic (owner's pick)

**Fraunces Italic, Thin (100), wonky forms on**, `@fontsource-variable/fraunces/wonk-italic.css` (weight +
WONK axes). Token `--font-accent`, utility `accent`. **Thin only: never bold or heavier weights.** Keep it
at sizes where hairlines read (about 16px and up).
Used sparingly and only for short text: big numbers (bird counts, altitudes, days), dates and "with
Anna & Tom" lines on memories, short guest quotes and asides, and scientific names in field labels.
Never for body copy or page headlines. **Exception: home section titles** (`SectionTitle`, sentence case, e.g. "Hello, I'm
Krishna"), because Anton caps read too shouty there (owner, 2026-10-15). **Not for day numbers**: `DAY 1` is set entirely in the label style (DM Mono caps),
number included (owner, 2026-10-13).

### 1.3 Runners-up

| Role | Family | Packages | Why it could be better |
|---|---|---|---|
| Display | Big Shoulders Display | `@fontsource-variable/big-shoulders-display` (wght 100 to 900) | Variable, so you can tune weight to 900. Slightly less compressed than Anton |
| Display | League Gothic | `@fontsource-variable/league-gothic` | Very condensed poster cut, but lighter than the San Rita original |
| Display | Bebas Neue | `@fontsource/bebas-neue` | Caps only, which matches the uppercase style. Lighter stroke |
| Mono | Azeret Mono | `@fontsource-variable/azeret-mono` (wght 100 to 900) | Variable, geometric, with more character than DM Mono. Good if you want a variable mono |
| Mono | IBM Plex Mono | `@fontsource/ibm-plex-mono` | Robust and very readable. More technical in tone |

Packages are already in the project's style: it uses `@fontsource-variable/fraunces` and `@fontsource-variable/public-sans`, so install with the same tooling (`pnpm add @fontsource/anton @fontsource/dm-mono`). Import only the weights you use.

### 1.4 Type scale

Headlines are uppercase display. Body copy is mono at a comfortable reading size, with a measure of about 60 to 66 characters.

| Token | Font | Size (clamp) | Line-height | Letter-spacing | Transform | Notes |
|---|---|---|---|---|---|---|
| Hero | display | `clamp(4.5rem, 20vw, 16rem)` | 0.85 | -0.005em | uppercase | Giant headline that overlaps the map |
| H1 | display | `clamp(2.5rem, 9vw, 6rem)` | 0.9 | 0 | uppercase | Page titles |
| H2 | display | `clamp(1.75rem, 5vw, 3.5rem)` | 0.95 | 0 | uppercase | Section titles |
| H3 | display | `clamp(1.25rem, 2.6vw, 2rem)` | 1.05 | 0.01em | uppercase | Card and tour titles |
| Body | mono | `clamp(1rem, 0.95rem + 0.2vw, 1.0625rem)` (about 16px) | 1.6 | 0 | none | Sentence case. Never below 16px on phones |
| Small | mono | `0.8125rem` (13px) | 1.5 | 0 | none | Captions, credits, field notes |
| Label / caps | mono | `0.75rem` (12px), weight 500 | 1.2 | 0.12em | uppercase | Eyebrows, tags, buttons, map labels |

San Rita uses a much wider tracking (0.3em) on its tiny mono eyebrows. Use 0.12em to 0.2em here, which stays readable at 12px.

---

## 2. Colour

### 2a. San Rita palette (reference, extracted from its CSS)

| Name | Hex | Used for (inferred from class usage) | Contrast notes |
|---|---|---|---|
| Deep green | `#161B13` | Dark sheet / background | Pale mint on it: 16.2:1 |
| Forest green | `#2D3329` | Main text on the pale sheet, dark fills | 12.0:1 on `#E2FFCC` |
| Adventure yellow (pale mint) | `#E2FFCC` | Text on dark sheet; pale surface | Passes AAA on deep green |
| Icy blue | `#DDE2E4` | Light text, borders | 13.4:1 on deep green |
| Terrain grey | `#84907F` | Muted text and labels | 5.2:1 on deep green (AA). Only 3.1:1 on the mint sheet, which fails AA for body text |

Also present but sparse: `#FFF` and `#000`.

### 2b. Nepal Birdwatching Tours palette (proposal: pending owner approval)

The palette keeps the same roles as San Rita. Accents come from Nepal: Himalayan Monal (copper, teal, violet), rhododendron, Himalayan snow, forest green, and ochre ridges.

| Token | Hex | Role | Inspiration |
|---|---|---|---|
| `night` | `#0D1210` | Sheet / background | Deep forest before dawn |
| `surface` | `#18211D` | Cards, panels | Shaded understorey |
| `snow` | `#EEF4F1` | Pale text on map and dark sheet (the "pale mint" role) | Himalayan snow |
| `mist` | `#9AA8A2` | Muted secondary text | Lichen and fog |
| `line` | `#3FB8AE` | Route line, primary highlights | Monal teal |
| `monal` | `#C9803F` | Iridescent copper accent, CTAs | Himalayan Monal |
| `violet` | `#7D6BC4` | Alternative routes, secondary accent | Monal violet |
| `rhodo` | `#C8323C` | Marker fill (waypoints), alerts | Rhododendron |
| `forest` | `#2F5D46` | Lowland terrain, dark fills | Forest green |
| `ochre` | `#B8934A` | Ridge terrain, dividers | Ochre hills |

Contrast for text pairs (WCAG 2.x):

| Pair | Ratio | Verdict |
|---|---|---|
| `snow` on `night` | 17.0:1 | AAA, body text |
| `snow` on `surface` | 14.8:1 | AAA, body text |
| `mist` on `night` | 7.7:1 | AAA, body text |
| `mist` on `surface` | 6.7:1 | AA, body text |
| `night` on `snow` (light button) | 17.0:1 | AAA |
| `night` on `monal` (CTA button) | 6.0:1 | AA, button text |
| `snow` on `forest` | 6.8:1 | AA, body text |
| `snow` on `rhodo` | 4.7:1 | AA for text; prefer `snow` on `rhodo` only for bold labels |
| `line` on `night` | 7.8:1 | AAA for route labels |
| `violet` on `surface` | 3.8:1 | Large text and graphics only (3:1). Not for body |
| `rhodo` on `night` | 3.6:1 | Graphics only (3:1). Not for body text |

---

## 3. Map styling tokens

All map styling uses the palette above. Hex values are for SVG and MapLibre style layers.

| Element | Spec |
|---|---|
| Main route (map) | One thin pale line, ~1.3–2.8px by zoom, `snow` (`--color-map-route`), slightly hand-drawn, over a subtle `night` casing; round caps and joins. `line` teal stays the UI's route colour, not the map's |
| Alternative route | Dashed, 3px, `violet` (`#7D6BC4`), dash `6 6` |
| Waypoint blob marker | Irregular hand-drawn blob, fill `night`, bold `snow` outline (2.25px key / 1.5px other), `snow` line icon inside (teahouse, binoculars, tent, peak, water); key ~30px, other ~19px; active inverts with a thin `monal` ring. See docs/MAP.md "Stop markers" |
| POI icon circle | 28px diameter, fill `surface` (`#18211D`), 1.5px `monal` ring, icon in `snow` |
| Highlight "lens" | Circle, 1px `snow` ring at ~78% with a faint dark hairline outside, four short ticks, faint grid; no fill |
| Faint grid | 1px lines in `mist` (`#9AA8A2`) at 8% opacity, 40px spacing. Fades out towards the edges |
| Clouds / fog | Blurred shapes (blur 24 to 40px) in `snow` at 10% to 25% opacity. Keep them in the top third of the map |
| Terrain hints | Lowland `forest` (`#2F5D46`) → hills `#5E7F5A` → ochre ridges `ochre` (`#B8934A`) → snow `snow` (`#EEF4F1`). Use gradient bands by elevation, never saturated |

Keep map labels in the Label / caps style, and use `night` halos behind them for legibility.

---

## 3b. Field label (site signature)

Every photo, clip, species, flower, butterfly and mountain gets a light notebook-style label: name,
scientific name, place, altitude, date. It shows a serious, passionate birder without turning the site
into a database. Every bird is celebrated equally. Data: `Observation` on media, `Species`, `Landmark`.

```
HIMALAYAN MONAL                          label/caps, fg
Lophophorus impejanus                    accent italic (Fraunces), fg-muted
Tadapani, Annapurna · 2,630 m · APR 2025 small, fg-muted
"male displaying on the ridge, 06:40"    small, fg (optional field note)
```

- Scientific names are always in the accent italic (`accent`, about 18px).
- **Not in the day view.** The full-screen day view shows common names only; scientific names live in
  the "This day" sheet, checklists and species details. Keep on-map screens light on text.
- **Never shown:** coordinates, conservation-status codes (IUCN), or other database-style fields.
- Altitude with thousands separator and ` m`. Dates `APR 2025`, or `14 APR 2025` when the day is known.
- Mountains: `MACHHAPUCHHRE · 6,993 m`; no scientific line.
- Placement: overlaid bottom-left of media on a scrim gradient, or beneath it in lists. Compact variant
  (name + scientific name only) for chips and map tooltips.

## 3c. Terrain texture

A faint, seamlessly tiling topographic-contour pattern (generic, not real terrain): `public/textures/contours.svg`,
pale `snow` lines on transparent. `TerrainBackdrop` (`components/ui`) lays it over `night`, static, for
backgrounds and transitional screens; today the map's loading fallback. Tokens: `--texture-opacity`, `--texture-size`.
Regenerate with `node scripts/textures/contours.mjs [seed]` (density, line count, stroke are constants at its top).

## 4. Layout and motion

### 4.1 Layout

- **Content sheets** rise from below the map and cover its lower part. The map stays visible above the sheet's top edge.
- **Giant headlines** (Hero token) sit across the boundary between the map and the sheet. They overlap the map with `z-index` above it. Keep the headline in `snow` so it reads on both.
- **Tilted photo stack**: three photos, rotated about -4°, 2° and 6°, with a 12px `night` border and a soft shadow. The top photo stays straight on mobile.
- Phone width: 16px side gutter, no horizontal page scroll. Headlines use their clamp() minimums there.
- **Square corners everywhere** (owner, 2026-10-15): cards, images, buttons, fields, sheets, avatars. The
  `--radius-*` tokens are 0; don't add `rounded-*` classes.
- **No underlined links** (owner, 2026-10-15). Links read by the accent colour and turn to `fg` on hover;
  standalone "go somewhere" links add a small arrow (`ArrowLink` in `components/ui`). Focus keeps the global
  focus ring.
- **Full-bleed images where they lead a block**: photos with text beside them run to the window edge on
  their side (home services: alternating, image the larger share); on phones they span the full width with
  the text below in the gutter. No borders on images.
- **Air over density**: one idea per screen, generous space between sections, few competing elements.
  Trim eyebrows, dividers and repeated meta rather than adding chrome.

### 4.2 Easing and durations

| Token | Value | Use |
|---|---|---|
| `--ease-sheet` | `cubic-bezier(0.22, 1, 0.36, 1)` | Sheets and headlines entering |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Buttons, tooltips, small UI |
| Micro | 150ms | Hover, focus |
| UI | 250ms | Toggles, tabs |
| Sheet | 700ms | Content sheet rise |
| Map pan / fly-to | 900ms | Camera moves |
| Stagger | 60 to 80ms per child | Cards and list items in a sheet |

### 4.3 Motion notes

- The content sheet slides from `translateY(100%)` to `0` with `--ease-sheet`. Stagger the children after it.
- Hero headlines move up slightly (about 40px) and fade in, with a 120ms delay after the map has loaded.
- Route lines draw from start to end with `stroke-dashoffset` over the Map pan duration.

### 4.4 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .photo-stack > * { transform: none !important; }
  .sheet { transform: none !important; }   /* fade in opacity only, max 150ms */
}
```

Also disable parallax and camera auto-pans. Route lines and markers appear without animation.

---

## 5. Tailwind v4 tokens

The tokens now live in `app/design/tokens.css` (single `@theme` block, with semantic aliases); JS mirror in `app/design/tokens.ts`.

Paste this into the project's global stylesheet. It is the proposed palette from section 2b and is pending owner approval. Do not edit `app/app.css` until the palette is approved.

```css
@theme {
  /* Colour (proposal: pending owner approval) */
  --color-night: #0d1210;
  --color-surface: #18211d;
  --color-snow: #eef4f1;
  --color-mist: #9aa8a2;
  --color-line: #3fb8ae;
  --color-monal: #c9803f;
  --color-violet: #7d6bc4;
  --color-rhodo: #c8323c;
  --color-forest: #2f5d46;
  --color-ochre: #b8934a;

  /* Fonts */
  --font-display: "Anton", "Impact", "Haettenschweiler", "Arial Narrow Bold", sans-serif;
  --font-mono: "DM Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;

  /* Type scale */
  --text-hero: clamp(4.5rem, 20vw, 16rem);
  --text-hero--line-height: 0.85;
  --text-h1: clamp(2.5rem, 9vw, 6rem);
  --text-h1--line-height: 0.9;
  --text-h2: clamp(1.75rem, 5vw, 3.5rem);
  --text-h2--line-height: 0.95;
  --text-h3: clamp(1.25rem, 2.6vw, 2rem);
  --text-h3--line-height: 1.05;
  --text-body: clamp(1rem, 0.95rem + 0.2vw, 1.0625rem);
  --text-body--line-height: 1.6;
  --text-small: 0.8125rem;
  --text-small--line-height: 1.5;
  --text-label: 0.75rem;
  --text-label--line-height: 1.2;

  /* Motion */
  --ease-sheet: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

Usage: `font-display` with `text-hero` or `text-h1` and `uppercase`. Use `font-mono` with `text-body`, `text-small`, or `text-label` plus `uppercase tracking-[0.12em]` for labels.

---

## Open items

- Owner approval for the palette in section 2b.
- Confirm the Anton and DM Mono licences (both are SIL OFL, free for commercial use).
- Check the Anton and Big Shoulders Display specimens at phone width before committing to one.
