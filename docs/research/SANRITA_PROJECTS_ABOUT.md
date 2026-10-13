# San Rita /projects and /about: choreography, and our day view and about page

Research for learning only. We take mechanics and feel, never code, assets or copy. This builds on
`SANRITA_INTERACTION.md` (stack, terrain, home zoom, transitions); read that first. Where this file
corrects it, it says so.

Method: static analysis only. HTML of `/en/projects`, `/en/about` and two case studies
(`/en/projects/s-r-w`, `/en/projects/gzna`) fetched with curl; the RSC flight data decoded; the route
chunks (`f7dde3cf1d48ed5d.js` ProjectsList, `31c3eec9c2c18b0d.js` projects image canvas,
`9c33e027a723933f.js` about page, `2af7baea60a4a3dd.js` case-study blocks, `55ee9050ddf3d87f.js`
YourNextTrail, plus shared chunks) read with grep and windowed reads. No browser was launched and nothing
was executed. About 15 requests to sanrita.ca / datocms-assets.com (HEAD for media), plus one web search.
Collected 2026-10-13.

Tags: **[F]** read directly from their HTML, JS or CSS. **[R]** third-party write-up, unverified.
**[I]** our inference.

---

## 1. Summary

1. **[F] /projects is not a stepper and does not fly a camera.** It is an **infinite, inertial, free
   scrolling track** of full-viewport sections (the 9 projects rendered twice and wrapped with
   `gsap.utils.wrap`). GSAP **Observer** turns wheel, touch and pointer deltas into velocity with 0.95
   per-frame friction. There is no snapping, no threshold and no keyboard support.
2. **[F] The 3D terrain is not drawn on /projects or /about.** The terrain is a drei `<View>` inside the
   home page component only. On /projects the backdrop is a flat `terrain-grey` (#84907F) layer with a
   faint **topographic-contour pattern** drawn on a 2D canvas. The [R] claim "scroll drives the camera"
   has no counterpart in the shipped code. *(Corrects `SANRITA_INTERACTION.md` §4.6, which assumed the
   map sits behind content pages.)*
3. **[F] The route line is a hand-drawn SVG path** per section: pale mint at 40% opacity, 100dvh tall,
   placed at 30vw (10vw on phones). Stacked sections make one continuous vertical trail. Each project's
   marker (a dark blob with an "eye" icon) sits on the line via CSS `offset-path`, with a giant condensed
   title beside it.
4. **[F] The two photos per project are WebGL, not DOM.** A second, small R3F canvas draws two planes with
   a custom shader. Each photo is a **soft feathered ellipse** with a slowly wobbling, noise-driven edge.
   When the project changes, the new photo spreads out from the centre through the old one ("ink"
   reveal, 0.8 s). Placement: top-left and bottom-right, far apart.
5. **[F] Text leads the active state, images lead the index.** The photos switch when the next section's
   top passes mid-screen. The title "activates" (marker scales up, eye opens with an overshoot, the title
   shifts in) when the section's centre is in the middle 40% of the screen.
6. **[F] There is no "More info" overlay on /projects.** Clicking an active marker opens a separate
   case-study page: a full-bleed cover hero, then content blocks revealed from below. That page ends in a
   "next project" teaser whose masked picture grows to fill the screen and becomes the next hero. The
   nearest "rise from below" pattern is the home page's 190 px project box ("view more": the box slides
   up 350 ms).
7. **[F] The about page:** a fixed background photo (not the map); a 100vh header with a giant
   letter-by-letter headline (client-only, not in the prerendered HTML); a dark sheet whose blocks rise
   with CSS scroll-driven animations; a **scroll-scrubbed spiral fan of 5 portrait photos** (full formula
   in §3.4); a fixed hand-drawn mini-trail that draws itself as you scroll, with 4 checkpoints popping in.
8. **[I] Cost:** San Rita runs several always-on loops: Observer ticker, the shader's `useFrame`, the
   contour canvas `rAF` and a mouse-lerp ticker. It also loads all 18 full-size covers (~0.8 to 1.5 MB
   each) to the GPU up front. We copy the look with CSS masks, on-demand MapLibre and no idle loops.
9. **Our design:** a trip has an **overview** (unchanged, natural scroll) and a separate full-screen
   **day view** (`?day=n`). The day view straightens the route (camera bearing along the day's segment),
   switches the map to a quiet "day look", and steps strictly one day per gesture. Each day shows two
   feathered media (image or video) far apart, a headline beside the stop, and a **birding diary** in the
   open space.

---

## 2. /projects: full choreography

### 2.1 What is on screen (one step, desktop) [F unless tagged]

The owner's screenshot, matched against the code:

| Element | How it is built |
|---|---|
| Muted flat background with topographic contours | `TransitionWrapper` (root layout): a `fixed -z-1 w-full h-dvh bg-terrain-grey` div with a 2D `<canvas>`. Every frame it tiles `/pictures/topology-background.svg` (800×400 tiles), at `globalAlpha .2`, scale 1.6, rotated −25°. The pattern drifts at 50 px/s only while a page transition runs (`running = transitionType !== null`); otherwise it is static. The rAF loop itself never stops. **No 3D terrain**: the terrain `<View>` lives only in the home page component, and the canvas' `View.Port` and controls sit in `<Activity mode="hidden">` off-home. |
| Hand-drawn vertical route line | Per section: an `<svg viewBox="-20 0 800 800" class="h-dvh w-auto translate-x-[30vw] max-mobile:translate-x-[10vw]">` with one long wiggly path (`stroke-adventure-yellow opacity-40`, `strokeWidth 4`). Two near-identical variants alternate by index parity. Each section is `h-dvh`, so the line runs continuously through the track. It is not geography. |
| Dark blob marker with an eye | SVG group: a forest-green circle; a pale-mint rough ring (spins `8s linear .35s infinite` when active, stroke 10→4); an "eye" polygon (`scale-y-0 → 100`, 200 ms delay, `cubic-bezier(0,0.57,0.46,2)` overshoot); a pupil that follows the mouse (`--mouse-x/y` lerped 0.075 per tick; ±6 px / ±8 px). Positioned **on the line** with CSS `offset-path: path(...)`, `offset-distance: 40%` (odd) or `50%` (even), i.e. about 40% / 50% of the viewport height. |
| Giant condensed headline beside the marker | SVG `<text x=90>`: F37 Stout, `text-[88px]` in an 800-unit viewBox scaled to 100dvh, so about **11% of the viewport height** (about 99 px at 900 px). On phones 45 units (about 5.6% vh). Pale mint. |
| Mono subtitle line | The project types joined with " + " (`text-eyebrow`, 10 px, icy-blue), 45 units below the title; split onto two lines when there are more than 4 types. |
| Arrow | Small icy-blue arrow SVG near the title, `opacity-0 → 100` when active. |
| Two large feathered photos | Second R3F canvas (§2.3). |
| "SHOW TRAILS" box, top-right | The global trail/legend box from the layout (see `SANRITA_INTERACTION.md` §4.6), not part of ProjectsList. |
| Compass, bottom-right | `Compass` component: the needle rotates `-135° + 180° ± 90°` with the pointer's x (desktop) or y (phones). `m-20` (`m-12` on phones). |
| Caption, bottom-left | "Every project is a journey…": `text-h5-like` (12 px mono) uppercase icy-blue, `max-w-[230px]`, `m-24` (`m-12`, 10 px on phones). |

Note **[F]**: the list has `bg-cod-gray`, but no such colour exists in their palette or CSS, so the class
generates nothing and the list is transparent over the canvases. That is why the contour backdrop shows
through.

### 2.2 Input and motion mechanics [F]

```
ProjectsList (fixed inset-0 z-10, overflow hidden; Lenis stopped and scrolled to 0)
  track = [...projects, ...projects]           18 sections, each 100dvh
  Observer.create({ target: list, type: "wheel,touch,pointer",
                    onChange: e => targetVelocity -= e.deltaY * k })
      k = 0.08 (desktop) | -0.2 (≤ 768px; sign flips so a finger drag follows naturally)
  gsap.ticker (every frame, forever):
      velocity = targetVelocity            (the "lerp" factor is effectively 1)
      targetVelocity *= 0.95               (per frame)
      y = wrap(-9·vh, 0, y + velocity)     → track.style.transform = translateY(y)
      for each section i: n = (y + i·vh + vh/2) / vh
          active ⇔ 0.3 < n < 0.7           → toggles class "-active"
      index = round(|y| / vh) % 9          → useProjects.setCurrentProjectIndex(index)
```

What this means in practice:

- One mouse-wheel notch (deltaY ≈ 100) adds 8 px/frame, which decays to **≈ 160 px of travel**
  (8 / 0.05). A full project is one viewport, so about 5 to 6 notches per project at 900 px **[I]**.
  Firefox line-mode deltas are converted with the body line-height (Observer).
- Trackpad: each momentum event adds velocity, so travel is about **1.6× the summed wheel delta**. A
  flick can fly past several projects; the track stops wherever friction ends it. **No snapping.**
- Touch: total travel is about 4× the finger distance, with a momentum feel **[I]**. Mouse drag
  (pointer type) also scrolls on desktop, inverted relative to the drag direction **[I]**.
- Listeners are **passive** (Observer without `preventDefault`), but the page cannot scroll anyway
  (fixed full-screen list, Lenis stopped).
- Infinite: wrapping plus the duplicated list means there is no start, no end and **no progress
  indicator**. There are no next/prev buttons and **no keyboard handling**. Titles are SVG `<text>` with
  no links; the click target is a 180×180 transparent rect, enabled only while active. A click counts if
  the pointer moved less than 10 px; it navigates with the ink-blot transition to `/projects/<slug>`.

### 2.3 The photos (second canvas, shader) [F]

- A portal `#projects-r3f-portal-root` is appended to `.c-main`: `position:fixed; inset 0; height 100dvh;
  pointer-events:none; z-index:3`, shown only on /projects. It holds its own `<Canvas>` (`dpr [1,2]`,
  PerformanceMonitor drops to 1).
- Two `planeGeometry` meshes, sized in R3F viewport units (fractions of the screen):

| | Desktop size | Desktop centre (from top-left) | Phone size | Phone centre |
|---|---|---|---|---|
| left = `cover1` | 0.60W × 0.70H | (20%, 35%) | 1.00W × 0.60H | (35%, 30%) |
| right = `cover2` | 0.60W × 0.77H | (75%, 65%) | 0.80W × 0.50H | (75%, 70%) |

- The fragment shader does a cover-fit UV for each picture's aspect, then the **feather**:
  `alpha = 1 − smoothstep(0.2 + w, 0.5 + w, r)`, where r is the distance from the plane centre in UV.
  The photo is fully opaque only in the inner 40% of each axis and fades to nothing at the inscribed
  ellipse. That is why it "dissolves into the background".
- The **wobble** `w = 0.03·sin(3θ + 0.5t) + 0.015·sin(7θ − 0.3t) + 0.05·(noise(uv·k − 0.8t) − 0.5)`
  (k = 6 left, 12 right) slowly morphs the edge. It is animated every frame.
- Colour is multiplied by **0.8** (photos sit slightly darker than the backdrop).
- **Change of project:** 200 ms timeout, then `progress 0→1` over **0.8 s `power1.out`** after a 0.1 s
  delay. The mask `1 − smoothstep(p − 0.25, p, r + w)` grows the new photo outward from the centre
  through the old one (organic edge). Both planes switch together. A change mid-transition kills the
  tween and restarts from the current picture.
- First appearance: `uDelayOpacity 0→1`, 0.4 s `power1.out`.
- Loading: a `TextureLoader` for **every project's two full-size covers** (`responsiveImage.src`, about
  2000 to 3000 px; HEAD checks: 0.8 to 1.5 MB each when not served as WebP). Each texture is then
  rendered once into a 64×64 target to force the GPU upload.

### 2.4 Timeline of a scroll from project k to k+1 [F, timings from code]

```
track y moves continuously (velocity, friction .95/frame)
│
├─ section k+1 top passes 50% of the screen → index = k+1
│     +200 ms … +300 ms   photo ink-reveal starts (both planes), 800 ms power1.out
├─ section k centre leaves the 30–70% band → k loses "-active":
│     marker scales 100% → 75%, eye closes, ring stops spinning, arrow fades (300 ms)
│     (between projects nothing is active: just the trail line)
├─ section k+1 centre enters the band (its top < 20% of the screen) → "-active":
│     marker 75% → 100% (300 ms), eye opens after 200 ms with an overshoot,
│     title scales in and shifts 20 px right, arrow fades in, ring spins 8 s/turn
└─ friction stops the track wherever it lands (no snap)
```

### 2.5 Layout diagrams

Desktop (1440×900), the active project settled:

```
┌───────────────────────────────────────────────────────────────────────────┐
│ logo                                                        ┌SHOW TRAILS┐ │
│      ░░░░░░░░░░░░░░░░░░░░         ┆                          └───────────┘ │
│   ░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░        ┆      (topo contours, 20% alpha)       │
│  ░▒▒▓▓ cover1 (feathered) ▓▒▒░    ┆                                       │
│  ░▒▓▓▓  0.6W × 0.7H  ▓▓▓▓▓▓▒░     ◉ ─  S.R.W   ➝                           │
│   ░▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░  marker on the line   + BRANDING + ART DIR…    │
│     ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░          ┆      ░░░░░░░░░░░░░░░░░░░░░░░           │
│                                  ┆   ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░          │
│                                  ┆  ░▒▓▓▓ cover2 (feathered) ▓▓▒░          │
│                                  ┆  ░▒▓▓▓  0.6W × 0.77H   ▓▓▓▓▒░          │
│ EVERY PROJECT IS A               ┆   ░▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░            │
│ JOURNEY. HERE ARE THE…           ┆      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░          ✛ comp│
└───────────────────────────────────────────────────────────────────────────┘
  line at x≈30vw · marker at y≈40% (odd) / 50% (even) · title ≈ 11% vh tall
```

Phone (390×844):

```
┌──────────────────────────┐
│ logo               [≡]   │
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░    │  cover1: 1.0W × 0.6H, centre (35%,30%)
│▓▓▓▓▓ cover1 ▓▓▓▓▓▓▒▒░    │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░     │
│▒▒▒ ┆ ▒▒▒▒▒▒▒▒▒▒▒▒░░       │
│    ◉ ─ S.R.W  ➝          │  line at 10vw, marker ≈ 40–50% vh
│    ┆   + BRANDING …       │  title 45 units ≈ 5.6% vh
│    ┆   ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│  cover2: 0.8W × 0.5H, centre (75%,70%)
│    ┆  ░▒▓▓ cover2 ▓▓▓▓▓▓▓│
│    ┆  ░▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ EVERY PROJECT…   ✛       │
└──────────────────────────┘
```

### 2.6 Case-study page and "next project" [F]

- `BlockHero`: `h-screen` (phones `h-[98svh]`), cover image as a CSS background; title bottom-left at
  `clamp(100px,20vw,240px)`; SplitText letters from the centre (`scale 1.3→1, opacity`, stagger 0.028,
  1 s `power2.out`). Delay 1.1 s (0.3 s on phones), or **0.16 s when arriving from the "next project"
  teaser**. Tagline and date fade up after the letters. A forest-green gradient rises from the bottom
  (to 50%).
- Blocks (`BlockIntro`, `BlockVisualFeatured` image/video/YouTube, `BlockVisualSplit` text or
  front-over-background picture, `BlockVisualGrid`, `BlockVisualStats`, `BlockVisualFooter` credits and
  CTA). Each sits in a `bg-forest-green` wrapper with **descending z-index (72, 71, … 61)** and
  `mt-[180px] reveal-scroll-content-y`. Videos play only while in view (ScrollTrigger `onToggle`).
- `BlockVisualSplit` picture variant: a background photo (object-cover) with a front image or video
  centred at 3/4 width, square, object-contain. This is the "image over image" composition.
- `YourNextTrail`: the next project's cover behind an organic PNG mask (`mask-size 80%` at 15% 50%;
  hover 90%). On click: the block becomes `fixed` full-screen; its text fades out with 40 ms × i
  delays; the mask grows to **800%** (phones 200%) over **1000 ms ease-in-out after 350 ms**. On
  `transitionend` of `mask-size` it routes to the next project (with `from = "your-next-trail"`). The
  route is prefetched when the teaser enters view (skipped on 2g or Save-Data).

---

## 3. /about: full choreography

### 3.1 Structure [F]

```
.c-about_wrapper
  fixed bg photo  (/pictures/about/about-hero-background.webp, cover, z-0)  ← not the map
  fixed mini-trail SVG (top 15%, left 15%, width 300, phones scale .75, z-50, pointer-events none)
  section (z-10) grid-rows [100vh, 1fr, auto]
    header 100vh: transparent → deep-green gradient (transparent 60% → #161b13 100%)
       giant H1 (client-only) + right-aligned 300px mono description + small compass glyph
    content: grid-12 (phones grid-4), bg-deep-green, text icy-blue
       separator · INTRO (title, text, spiral stack, caption) · separator 194px
       SERVICES (sticky-ish video/image + 3 icon lists) · TECHNOLOGIES (logos)
       separator 180px · TEAM (cards, phones: horizontal snap row) · separator 180px
       VALUES (2×2 cards with blob labels that expand on tap)
    footer: YourNextTrail → /projects (same mask-grow hand-off)
```

### 3.2 Headline [F]

"We are San Rita": F37 Stout uppercase, `text-[25.4vw] leading-[.9]` (tablet 25vw; phones
`45.6vw / .8`), pale mint over the photo. SplitText `words,chars`; `gsap.from(chars, {opacity 0,
scale 1.3, duration 1, ease power2.out, stagger {each .03, from "center"}, delay 1.1 (phones .3)})`.
There is an `sr-only` H1 plus an `aria-hidden` visual H1, but **both render only after hydration** (the
header waits for `isMobile`). The prerendered HTML has no headline. *(Corrects `SANRITA_INTERACTION.md`
§4.6, which implied the sr-only H1 was there for crawlers.)*

### 3.3 Content from below [F]

```css
.reveal-scroll-content-y {
  animation: linear both reveal-scroll-content-y;
  animation-timeline: view();
  animation-range: entry calc(var(--stagger-index, 1) * 15%) contain 75%;
  opacity: 0;                                  /* hidden where unsupported */
}
@keyframes reveal-scroll-content-y { from { opacity: 0; transform: translateY(40px) } to { opacity: 1; transform: none } }
/* -x: translateX(-25px), range "entry cover 40%"; -opacity: range entry (stagger*25%) → contain 65% */
```

This is scrubbed (linear, tied to scroll position), not timed. Each block rises 40 px and fades in as
it travels from just inside the viewport bottom to 75% "contain". Cards use `--stagger-index` (0, 1,
2, …) so siblings start 15% later each.

Other about-page mechanics: the services video plays only while on screen (ScrollTrigger
enter/leave). Team cards get `--dist-x/--dist-y` from the pointer on `pointermove` and `scroll`, plus a
fixed `radial-gradient` glow with `mix-blend-mode: color-burn` on hover. Values cards: a coloured label
cut by an irregular `clip-path` polygon over a photo; tap toggles `-active`, which expands the label to
the full rectangle (150 ms), opens the text with `grid-rows 0fr → 1fr`, and fades paragraphs in over
1 s.

**Mini-trail [F]:** a fixed 300 px hand-drawn route (`c-about_main-path`, icy-blue, stroke 2). It is
drawn with `strokeDasharray = L`, `strokeDashoffset L → 0` on a ScrollTrigger over the whole page
(`start "top top"`, `end "bottom bottom"`, `scrub 1`). Four checkpoints (circle and icon) pop in
(`scale 0→1, opacity, .5 s power1.out`) when the dash offset passes 250 / 190 / 140 / 40 path units
going down, and reverse going up. It is skipped when the page mounts already scrolled.

### 3.4 The curved fan-out image flow [F]

The intro holds **5 portrait photos** (823×1027 to 978×1146, aspect ≈ 0.80 to 0.85). They sit in one
grid cell of `411×513 px` (phones `280×350`). Each `<Image>` is `object-contain rotate-3 mt-16
ml-[70px]` (phones `mt-8 ml-35px`), `z-1`, `will-change-transform`. The CMS order is **reversed** before
rendering, so DOM index `i = 0` is the last CMS photo (painted at the bottom). The **first CMS photo is
`i = n−1`: painted on top, furthest out, and moving first.**

```
step  = mobile ? 20 : 30         base = mobile ? 30 : 40        growth = mobile ? 2 : 6
r0(i) = i·step + base            φ(i) = 0.8·i  (radians)
initial:  x = cos(φ)·r0,  y = sin(φ)·r0,  scale 0.7          (a loose coil around the stack)
timeline (ScrollTrigger: trigger = stack, start "top bottom", end "bottom -25%", scrub 0.1):
  for each i: tween {p: 0→1, r: r0 → r0·growth}, duration 0.5, ease "none",
              starts at (n−1−i)·0.05            (top photo first)
  onUpdate: θ = p·π + φ(i);  x = cos θ·r,  y = sin θ·r;  scale = 0.7 + 0.2·p
```

Equivalently, with scroll progress `s ∈ [0,1]` over the trigger range, timeline length
`T = 0.5 + (n−1)·0.05` (= 0.7 for 5 photos):

```
p_i(s) = clamp((s·T − (n−1−i)·0.05) / 0.5, 0, 1)
θ_i    = π·p_i + 0.8·i                      (clockwise on screen, since y points down)
r_i    = r0_i · (1 + (growth − 1)·p_i)
x_i, y_i = r_i·cos θ_i, r_i·sin θ_i         scale_i = 0.7 + 0.2·p_i      (tilt stays 3° for all)
```

So each photo swings **half a turn clockwise** around the stack while its radius grows linearly
(6× desktop, 2× phones). The photos peel off one by one, top photo first, into a widening spiral
(computed; px relative to the resting stack, y down):

| s | i4 (top, CMS #1) | i3 | i2 | i1 | i0 (bottom) |
|---|---|---|---|---|---|
| 0 | (−160, −9) | (−96, +88) | (−3, +100) | (+49, +50) | (+40, 0) |
| 0.5 | (+456, −557) | (−216, −473) | (−350, −10) | (−98, +186) | (+59, +81) |
| 1 | (+958, +56) | (+575, −527) | (+18, −600) | (−293, −301) | (−240, 0) |

Phones: final radii 60 to 220 px; i4 ends at (+220, +13), so the phone fan stays within about one
screen width.

The range is "top bottom" → "bottom −25%", a scroll distance of 1.25·vh + 513 px. The fan opens
**while the stack itself rises through the viewport**, so the photos stream up and outwards ahead of it,
over the neighbouring text (z-1). The scrub of 0.1 s gives a hair of smoothing.

Curve at three moments (desktop, 1 char ≈ 60 px wide, 1 row ≈ 100 px; ◻ = photo centre, O = stack):

```
s = 0 (tight coil)        s = 0.5 (peeling off)                 s = 1 (open arc)
                          i3◻           i4◻        →             i2◻         i3◻
                                                                i1◻
   i4◻ O i0◻              i2◻    O  i0◻                       i0◻    O                 i4◻→
   i3◻i2◻i1◻                 i1◻
```

### 3.5 Mobile behaviour [F]

The same code with the smaller parameters. Lenis is off (native scroll), the headline is 45.6vw, the
mini-trail is scaled 0.75 at the same fixed spot, team cards become a snap row (230×320), and values
cards stack (360 px tall).

---

## 4. Content model implied, and how it maps onto ours

| San Rita (DatoCMS) | Use | Ours |
|---|---|---|
| Project `{title, slug, description, cover1, cover2, projectTypeSelection[]}` | One step: headline, subtitle "+ A + B", two photos | **Trip day** `{n, waypoints of that day, anchor stop, segment}` derived from `Trip.waypoints` (`day`, `nights`, `key`) |
| `cover1` (wide, ~1.94:1) / `cover2` (16:9, square or portrait) | Left / right feathered photo | Two `MediaAsset`s per day (image **or** `VideoAsset`), picked by the rule in §5.6 |
| `projectTypeSelection` | Mono subtitle line | Day meta: `2,630 m · 1 night · teahouse` (+ habitat) |
| Marker on the trail | Position of the step | The day's anchor stop on the real route (MapLibre marker) |
| — | — | **Birding diary**: `sightingStatsByStop(trip, group?)` → `{total, newIds, soFar}`, aggregated per day |
| Case study (blocks) | Long-form detail | Overview content (memories, itinerary, includes, checklists) |
| About `introMedias[5]` + caption | Spiral fan | `Guide.portrait` + `Guide.art` (+ selected `MediaAsset`s of Krishna in the field) with `Observation` captions → `FieldLabel` |
| About services / values / team | Expandable cards, lists | Certifications, languages, specialties (`Guide.certifications` …) |

Our field labels replace their mono subtitles: name in label caps, scientific name in the accent italic,
place · altitude · date. Never coordinates or codes.

---

## 5. Our design: the trip's **day view** ("the journey")

Per `EXPERIENCE.md` → "Two modes per trip": the **overview** stays as it is: the map with the whole
route, stops in any order, and content rising from below on natural scroll. The **day view** is a
separate, full-screen, focused mode on the same page (`/trips/:slug/?day=n`). It is not a pop-up. Only
inside it does scroll step through days.

### 5.1 What we take from San Rita, and what we change

| San Rita | Day view |
|---|---|
| Free inertial infinite track, no snap | **Strict stepping**: one day per gesture, in sequence, with a start and an end |
| Flat grey + contour backdrop, no terrain | The **real map in a quiet "day look"** (§5.4): muted relief and, as an option, real DEM contours |
| SVG trail line at 30vw | The **real route, straightened**: camera bearing along the day's segment so it runs up the screen |
| WebGL shader feather and wobbling edge, always rendering | **CSS `mask-image`** feather (works on `<img>` and `<video>`), static organic edge, reveal via a registered custom property; nothing runs when idle |
| Photos switch at the half-way point, text activates later | Same lead: media reveal starts 250 ms after a step, the headline 450 ms after |
| No keyboard, progress or a11y | Keys, buttons, a visible day progress row, live region, reduced motion, an exit always visible |

### 5.2 Entering and leaving

**Entry points:** a prominent **"Start the journey"** button in the overview (it opens day 1); **"Day n
→"** on each itinerary line (`<a href="?day=n#day-n">`, so without JS it just jumps to that itinerary
line); deep links `?day=n`. Unknown or out-of-range n clamps to 1..D.

**Enter (overview → day n), client navigation:**

```
t=0      save overview: window.scrollY, camera snapshot (engine's "before stepping"), autoplay status
         pause autoplay · history.pushState(?day=n) · <html> gets data-dayview, overflow:hidden
         overview sheet + stepper + pins: sheet slides down out of view (translateY 100%, 450 ms
           --ease-sheet); overview UI fades 200 ms; overview subtree gets `inert`
         map: gestures off (new Gestures mode "locked"); setLook("day", 600 ms paint transitions)
t=0      camera → day camera (§5.3), flyTo when far, else easeTo; ≈ 1600–2200 ms, --ease-map
t≈55%    route: previous days solid, today's segment draws in (routeDraw line-gradient)
t≈60%    day composition plays its step choreography (§5.7) from "nothing"
```

**Exit ("Overview" button, Esc, or browser Back):**

```
t=0      day layer fades (200 ms; text −12 px, media opacity) · setLook("default", 600 ms)
         camera → engine.back() (the exact overview camera), ≈ 1200 ms
t≈50%    restore scrollY first (instant, while still hidden), then the overview sheet slides back up
         (450 ms --ease-sheet); overview UI fades in; remove inert, html overflow restored
URL      if we pushed the entry: history.back() (Back/Forward stay symmetric);
         if the page was landed on with ?day: navigate(pathname, {replace: true})
```

`popstate` from `?day=n` to no param runs the same exit. Day-to-day steps use `replaceState(?day=k)`, so
**Back always returns to the overview exactly as it was**, however many days were stepped.

**Direct landing on `?day=n`:** GitHub Pages serves the overview HTML (query ignored). After hydration,
and once the map is ready, the day view opens **without the entry animation** (jump-cut camera, day
content visible immediately). The overview behind it stays at scrollY 0.

**Reduced motion:** camera jumps, the sheet simply hides and shows, and the media crossfade takes 150 ms.

### 5.3 Straightening the route with real geography

Days, not key stops: steps are **days 1..D** (strictly sequential). A day groups the waypoints with
`waypoint.day === n`. The **anchor** is the day's overnight stop (`nights > 0`), else its last waypoint.
A rest day with no waypoints reuses the previous anchor ("Rest day at Tadapani"). Key stops still decide
which days carry rich media; plain days fall back (§5.6).

**Segment:** the route from the previous anchor (or trip start) to this anchor. Slice `trip.route` (or
the hand-drawn GeoJSON line) between the nearest vertices to the two stops; without a route, use the
day's waypoints in order.

**Camera (new `dayCamera(trip, day, insets)` in `camera.ts`):**

1. Travel bearing `β = bearingBetween(segStart, segEnd)`. If the chord is under ~0.3 km (rest day, loop),
   use the principal axis of the segment points, else keep the previous day's bearing.
2. Camera `bearing = β`: forward points up the screen, so the day's walk runs **from the bottom of the
   frame (yesterday) to the anchor near the upper third**, like San Rita's vertical line.
3. `pitch` 50° (desktop) / 55° (phones): looking along the walk.
4. Zoom and centre from `fitPoints` with the bearing fixed and **asymmetric insets from the day layout**
   (§5.5), so the chord lands on the "route column" (x ≈ 40% desktop, 24% phones) between y ≈ 78% and
   30%. Clamp zoom to [`CAMERA.trip.minZoom`, `CAMERA.stop.minZoom + 0.5`]: bus days zoom out, short
   birding days zoom in.
5. Visibility: reuse the existing visibility search (`visibility.ts`), constrained to stay straight:
   bearings `β + {0, ±10°, ±20°}`, pitches `[50, 42, 35]`. Pick the first where the anchor and at least
   70% of the segment samples are unoccluded. Prefer lowering pitch over turning.
6. Day-to-day: `easeTo` with shortest rotation (`wrapDegrees`), duration
   `clamp(900 + 300·log2(1 + km/2) + 4·|Δbearing|, 900, 1800)` ms. Use `flyTo` (curve 1.2) beyond
   `CAMERA.stepFlyKm`. If a new step arrives mid-move, retarget from the current camera (no queue).

The route stays honest: real wiggles, real ridges. "Straight" means the frame is aligned to the day's
direction of travel, not that the line is redrawn.

**Route styling in the day view:** previous days solid snow at 70%; **today's segment bright** (`line`
teal, 5 px, drawn in over 900 ms from yesterday's anchor); later days faint dashed (25%); other trips
hidden. Today's anchor: the stay blob plus a pulse ring that scales in with `--ease-pop` (San Rita's eye
overshoot). The ring stops after one pulse, so nothing loops.

### 5.4 A calmer map for the day view (recommended)

Yes: switch the map to a **"day look"** while the day view is open. It gives legibility for the snow
headline, feathered media and the diary, and the calm negative space of the screenshot.

- `MapController.setLook("day" | "default", ms)` using MapLibre paint transitions (no re-style):
  colour-relief opacity to about 0.45, blended toward a muted green-grey; hillshade highlight softened;
  graticule off; labels limited to the day's peaks and the "seen from here" mountains; 3D terrain kept
  but exaggeration eased to about 1.0.
- **Option, owner's call: real contour lines.** Generate isolines from the same DEM tiles in a worker
  (e.g. the `maplibre-contour` plugin: minor every 100 m, major every 500 m, snow at 20–30% opacity).
  This gives San Rita's contour texture, but true to the land. It adds a small dependency and some
  worker work per tile. Try it after the base look.
- A cheap DOM scrim (night, 0 → 35% toward the diary and headline edges) under the text. It is static,
  with no per-frame cost.
- Do **not** copy their fake contour canvas: a decorative pattern over a real map would contradict the
  geography, and their version redraws every frame.

### 5.5 Composition per day

San Rita's composition (the owner's screenshot): two feathered photos on one diagonal (top-left and
bottom-right), the trail with the marker, and a headline at the seam. That leaves the **other diagonal
empty**. We put the **birding diary** in the top-right void and **"seen from here"** in the bottom-left.

Desktop (1440×900); percentages are of the viewport:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ← OVERVIEW   ANNAPURNA BIRDING TREK                           DAY 4 / 9    ✕ Esc │ 0–7
│ ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░            ┊ yesterday→today      ┌ BIRDING DIARY ──────┐ │
│ ░▒▓▓▓▓▓ MEDIA A ▓▓▓▓▓▓▒░          ┊ (route, straight)    │ 38 birds today       │ │ 9–44
│ ▒▓▓ x 3–43%, y 8–52% ▓▓▓▒         ┊                      │ 12 new · 96 so far   │ │ x 62–95
│ ░▒▓▓▓ feathered ▓▓▓▓▓▓▒░          ┊                      │ ✦ SATYR TRAGOPAN     │ │
│  ░░▒▒▒▒▒▒▒▒▒▒▒▒ ▒▒░░             ◉  4  ← accent Thin     │   Tragopan satyra    │ │
│   SATYR TRAGOPAN · Tragopan satyra  TADAPANI  ← Anton     │ ✦ HIMALAYAN MONAL …  │ │
│   Tadapani · 2,630 m · APR 2025  ┊ 2,630 m · 1 NIGHT · TEAHOUSE · OAK–RHODODENDRON
│                                  ┊   ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░                   │
│ SEEN FROM HERE                   ┊  ░▒▓▓▓▓▓▓ MEDIA B ▓▓▓▓▓▓▓▓▓▒░                 │ 52–92
│ ▲ MACHHAPUCHHRE · 6,993 m        ┊  ▒▓▓▓ x 46–90%, y 52–92% ▓▓▒                  │
│ ▲ ANNAPURNA SOUTH · 7,219 m      ┊  ░▒▓▓▓▓ (video ok) ▓▓▓▓▓▓▒░                   │
│ "Mist lifted at dawn…" DM Mono italic ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░                   │
│ ●──●──●──◉──○──○──○──○──○          ‹ PREV    NEXT ›         THIS DAY ↑            │ 92–100
└─────────────────────────────────────────────────────────────────────────────────┘
route column x ≈ 40% · anchor ≈ (40%, 42%) · headline right of the anchor, over the seam
```

- **Headline:** `DAY` in label caps; the number `4` in the accent (Fraunces Italic Thin) at about 9vh;
  the place `TADAPANI` in Anton, uppercase, `clamp(3rem, 9vh, 7.5rem)` (San Rita's ≈ 11% vh); a
  meta line in label caps with altitude, nights, stay and habitat. Snow colour with a soft night text
  shadow over the seam between media and map.
- **Paragraph:** one or two lines of the day's note (`waypoint.summary`, first sentence) in **DM Mono
  italic**, bottom-left, `max-w-[34ch]`.
- **Media:** A (top-left, about 40vw × 44vh) and B (bottom-right, about 44vw × 40vh). Each has its
  `FieldLabel` (compact on phones) at the inner bottom edge of its feathered area, never covering the
  anchor.
- **Insets for the camera** (`DAY_LAYOUT` in `mapLayout.ts`): the anchor must land in the clear band
  between A and B. Desktop padding is about `{top: 18%, right: 52%, bottom: 30%, left: 30%}` of the
  viewport, giving anchor ≈ (40%, 42%). The engine reads these like the existing peek insets.

Phone (390×844), the same diagonal folded into one column:

```
┌──────────────────────────┐
│ ← Overview   DAY 4/9   ✕ │ 0–6%
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░     │
│▓▓▓▓▓ MEDIA A ▓▓▓▓▓▒▒░    │ 6–34%  x 0–88%  (feathered, bleeds off the left edge)
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░      │
│▒▒▒▒ SATYR TRAGOPAN ░     │ compact FieldLabel
│     ┊     38 BIRDS TODAY │ 34–43% diary tally, right of the route
│     ┊  12 new · 96 so far│
│     ◉ DAY 4              │ 43–56% anchor at (24%, 47%); headline beside it
│     ┊ TADAPANI           │
│     ┊ 2,630 m · TEAHOUSE │
│     ┊  ░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│
│     ┊ ░▒▓▓ MEDIA B ▓▓▓▓▓▓│ 56–80% x 30–100%
│     ┊ ░▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│ ✦ Satyr Tragopan  ✦ Kalij│ 80–87% top 2 new species (compact labels) + "+10"
│ ●─●─●─◉─○─○  ‹  ›  ↑ DAY │ 87–100% progress · prev/next · This day
└──────────────────────────┘
```

On phones the map shows mostly through the route column and between the two media. Camera padding is
about `{top: 40%, right: 10%, bottom: 50%, left: 14%}`. "Seen from here" moves into the This-day sheet
(§5.8) to keep the screen calm.

### 5.6 Two media per day (images or video)

**Which two (`pickDayMedia(trip, day)` in a new `app/lib/tripDays.ts`), in order, de-duplicated:**

1. `media` of the day's **key** waypoints (anchor first).
2. `media` of **memories** whose `waypointId` is one of the day's waypoints, newest first.
3. `media` of the day's non-key waypoints.
4. `media` of a **landmark seen from the anchor** (mountain portrait), see "seen from here" below.
5. Unused `trip.reel` items, round-robin, never the same item as the previous or next day.
6. Nothing more: if only one asset exists, render one media slot (A) and give the space to the diary. No
   placeholder art.

**Which slot:** A (larger, top-left) prefers the **landscape** (an `observation.landmarkId`, or the
widest aspect). B prefers the **subject** (`observation.speciesIds`: the bird). Each day then reads as
"the place, and one bird". **At most one video plays per day:** if both picks are videos, B shows its
poster as an image.

**Feather (works for `<img>` and `<video>`):** the mask is applied to the media wrapper, so the same
code covers both. The gradient approximates San Rita's `1 − smoothstep(0.2, 0.5, r)`:

```css
.feather {
  --edge: radial-gradient(closest-side,
            #000 40%, rgb(0 0 0 / .93) 50%, rgb(0 0 0 / .74) 60%, rgb(0 0 0 / .5) 70%,
            rgb(0 0 0 / .26) 80%, rgb(0 0 0 / .07) 90%, transparent 100%);
  -webkit-mask: var(--edge), var(--blob) center / 100% 100% no-repeat;
          mask: var(--edge), var(--blob) center / 100% 100% no-repeat;
  -webkit-mask-composite: source-in;  mask-composite: intersect;
}
```

- `--blob`: one of 4 static organic SVG shapes (blurred edge baked in, ~1 KB each, `data:` URIs). The
  shape is chosen per day (`day % 4`) for variety without animation.
- Photos and videos use `object-fit: cover` with `object-position` from `focal`. San Rita's 0.8
  darkening: apply `filter: brightness(.88)` on images only; on video use a night overlay at 12% opacity
  inside the mask (filters on video are costly).

**Day-to-day reveal (San Rita's ink reveal, in CSS):** the incoming media gets a third mask layer
`radial-gradient(circle at 50% 50%, #000 var(--reveal), transparent calc(var(--reveal) + 25%))`. Its
`--reveal` is a registered `@property <percentage>` animated from −25% to 100% over 800 ms
`--ease-out`. The outgoing media stays underneath and fades over 600 ms, then is removed. That is two
masked layers repainting for under a second, then nothing.

**Video lifecycle:**

- Ambient clips only: `muted loop playsinline disablepictureinpicture`, no controls, `preload="none"`.
  The `src` is set only when the day becomes current. YouTube assets are not used as day media (poster
  only).
- **Only the current day plays.** On step: the outgoing video `pause()`s at the start of its fade. After
  1.5 s it is unloaded (`removeAttribute("src"); load()`), so phones keep one decoder.
- **Poster first, always:** the poster renders as the masked image. The video element fades in over it
  on `playing` (never a black frame).
- **Next day:** preload its two posters / images only (`new Image()` + `decode()`, or
  `<link rel=preload as=image imagesrcset>`). Never prefetch video bytes.
- **Save-Data, `effectiveType` 2g/3g, or `prefers-reduced-motion`:** posters only. A small "▶ play clip"
  control in the FieldLabel row lets the visitor opt in (reduced motion: no autoplay ever).
- Pause on `visibilitychange: hidden` and on exit; resume on return, current day only.

**Image sizes:** A up to 1600 px wide (desktop) / 900 px (phones), B up to 1200 / 700. AVIF or WebP with
`srcset` 480–1600, `sizes` from the slot widths, `decoding="async"`, and `fetchpriority="high"` only on
the first day's A.

### 5.7 Step choreography (per day)

```
t (ms)  commit (input accepted; the day index changes; replaceState ?day=k; live region announces)
0       outgoing headline, meta, note and diary list: opacity → 0, y −10 px (160 ms ease-in)
0       camera → next day (§5.3, 900–1800 ms) · today's segment draws in (900 ms)
0       progress row: the current dot moves (300 ms --ease-out)
250     media A reveal (800 ms) · outgoing A fades (600 ms) · A's video play() if allowed
330     media B reveal (800 ms) · outgoing B fades
450     DAY number slides 20 px and fades in (300 ms); place letters scale 1.3 → 1 and fade from the
        centre (stagger 20 ms, 600 ms --ease-sheet); the anchor's ring pops (--ease-pop)
600     meta line and note fade up 12 px (300 ms)
700     diary: "today" crossfades; "so far" counts up from the previous total (500 ms, ease-out;
        numbers in the accent Thin); new species enter one by one (60 ms stagger, y 8 px → 0,
        ✦ pops with --ease-pop); show up to 6 (desktop) or 2 (phones) + "+n more"
≈1500   settled
```

- Backwards steps run the same choreography mirrored: counters count down, new-species labels leave in
  reverse, and media reveal from the side of travel.
- If a new step arrives mid-sequence, the Web Animations in flight `finish()` and the new sequence
  starts. The camera retargets from where it is. Every day passed through is committed in order (no
  skipping), but the visitor never waits for an animation.
- No GSAP needed: CSS transitions plus `element.animate()`.

### 5.8 The birding diary (owner's request)

Data: `sightingStatsByStop(trip, group?)` gives per waypoint `{total, newIds, soFar}`. A day can hold
several waypoints, so add `sightingStatsByDay(trip, group?)` in `tripDays.ts`:

- `total` = unique species over the day's waypoints;
- `newIds` = the union of their `newIds` (first seen on this trip today);
- `soFar` = the `soFar` of the day's last waypoint.

```
DAY 4 · TADAPANI · 2,630 m                       label caps (diary header, desktop only)
38 birds today · 12 new · 96 so far              numbers accent Thin, words label caps
✦ SATYR TRAGOPAN        Tragopan satyra          ✦ = new today (monal accent); FieldLabel compact
✦ HIMALAYAN MONAL       Lophophorus impejanus
✦ …  +6 more                                     → This-day sheet
```

- Groups: birds by default. A tiny toggle (Birds · Mammals · Plants) appears only when the trip has
  more than one group; it filters with the `group` argument.
- Order of the new species: species seen with guests first (`Memory.seen`), then by likelihood. Never by
  rarity framing; every bird is celebrated equally.
- **Seen from here:** mountains as field labels (`MACHHAPUCHHRE · 6,993 m`, no scientific line).
  Proposed data: an optional `Waypoint.views?: Landmark["id"][]` (curated). Fallback: the trip's
  `landmarkIds` peaks within about 35 km of the anchor that pass the visibility check.
- Placement: desktop top-right void (x 62–95%, y 9–44%) and bottom-left for the mountains. Phones: tally
  right of the route above the headline, top 2 new species above the controls, the rest in the
  This-day sheet.
- Day 1 shows `38 birds today · 38 so far` (no "new" on the first day).

### 5.9 Input model (inside the day view only)

All listeners live on the day layer and are removed on exit. A small DOM-only module, `stepInput.ts`,
emits `step(+1 | −1)` and `pull(offset)` (visual feedback).

**Wheel / trackpad (Mac inertia):**

```
CONFIG = { threshold: 40px, silenceMs: 160, cooldownMs: 420, reArm: 1.5, reArmMin: 8px,
           pull: 0.3, pullMax: 28px, axisBias: 1.2 }
onWheel(e):                                   // { passive: false }
  e.preventDefault()
  if e.ctrlKey: return                        // trackpad pinch: ignored (no map or page zoom here)
  d = normalise(e)                            // deltaMode 1 → ×16, 2 → ×innerHeight
  d = |dx| > |dy|·axisBias ? dx : dy          // sideways counts too: right/down = forward
  gap = e.timeStamp − lastT; lastT = e.timeStamp; mag = |d|
  if gap > silenceMs:              locked = false; acc = 0      // a new gesture after silence
  else if locked and mag > lastMag·reArm and mag > reArmMin
          and now − lastStep > cooldownMs:  locked = false; acc = 0   // a fresh flick during momentum
  lastMag = mag
  if locked: return
  acc += d; pull(clamp(acc·pull, ±pullMax))   // the day block leans toward the next day
  if |acc| ≥ threshold and now − lastStep ≥ cooldownMs:
      step(sign(acc)); locked = true; lastStep = now; acc = 0; pull(0)
after silenceMs with no step: pull springs back to 0 (200 ms)
```

- A Mac momentum tail decays monotonically, so it stays locked. A new flick during the tail has rising
  magnitude and re-arms.
- A mouse notch (~100 px) steps once. Notches spun faster than 160 ms apart step once per burst.
- All numbers are tunables in one `JOURNEY_INPUT` constant (retune by feel; see §7).

**Touch:** `touch-action: none` on the day layer; `overscroll-behavior: none` on `<html>` while open
(prevents pull-to-refresh and, on Mac Chrome and Safari, the horizontal swipe-back gesture during
sideways trackpad swipes).

- During a swipe, the day block follows the finger × 0.4, capped at 28 px.
- On release, the step commits if `|d| ≥ 56 px`, or `|d| ≥ 24 px` with velocity ≥ 0.4 px/ms. Swipe up or
  left = forward; down or right = back.
- Movement under 10 px is a tap (buttons, labels).

**Keyboard:** ↓ → PageDown Space J = next; ↑ ← PageUp Shift+Space K = prev (auto-repeat is limited to
one step per 600 ms); Esc = exit. Home and End are deliberately inert (no skipping).

**Buttons:** ‹ PREV / NEXT ›, the progress dots (they show the trail, but are **not** jump targets, to
honour strict sequence; owner may relax this), "Overview", "This day ↑", and an optional ▶ autoplay
(steps every ~6 s; any input pauses it).

**Ends:** at day 1 backwards, or day D forwards, the block gives a 24 px rubber-band and the controls
highlight "Overview" (and "Plan this trip" at the end). There is no automatic exit. Optional, owner's
call: a final **"The whole way"** card after day D (route pulled back, `142 birds in 9 days`, Plan this
trip).

**Escape hatches and accessibility:**

- "Overview" and ✕ are always visible top-left and top-right; Esc and Back exit.
- The overview subtree is `inert` while the day view is open.
- The day layer is a labelled region (`aria-roledescription="day by day"`) with one `<article>` per day:
  only the current one is rendered visible, and the rest are `hidden`.
- A polite live region announces "Day 4 of 9. Tadapani, 2,630 metres. 38 birds, 12 new."
- Focus starts on the day heading and is kept inside the day view.

### 5.10 "More info": what it is now

The two modes settle the owner's earlier "More info overlay":

1. **Trip-level information (what's included, practicalities, price, the full itinerary, reviews)
   lives in the overview's rising content**, which the owner already likes. In the overview, a
   "More info ↓" button simply scrolls that sheet up (700 ms `--ease-sheet`; instant with reduced
   motion). In the day view, a "Trip details" link exits to the overview and scrolls to that section.
2. **Inside the day view, "This day ↑" raises a small day sheet.** It covers 70svh on phones, or a 640 px
   centred panel at 60vh on desktop, rising from below (`translateY(100%) → 0`, 450 ms
   `--ease-sheet`), with its own scroll. It holds the day's text: Krishna's note and memory story with
   guests, stay, the full checklist for that day (with filter chips, ★ seen with guests), the rest of the
   new species, and "seen from here". While it is open, wheel and touch scroll the sheet (stepping is
   suspended); Esc, ✕ or dragging the handle down closes it.

This keeps one source of truth for trip facts and gives the day view its own quieter text. It is still
not a pop-up: a sheet from below, as everywhere else.

### 5.11 Static, SEO and no-JS

The day view is a **client-only enhancement** of the overview. It has no separate indexable page
(`?day` is a state). The prerendered trip HTML already holds every day in reading order, in the
overview's itinerary: `<li id="day-4">` with heading, altitude, stay, note, media with `alt`, field
labels as `<figcaption>`, and sightings. "Day n →" links are `?day=n#day-n`, so without JS they scroll
to that line. Nothing is hidden by default (no `opacity: 0` in base styles). JSON-LD and `llms.txt`
stay as they are.

### 5.12 Performance on mid phones

- No second WebGL canvas, no shader, no always-on ticker. MapLibre renders only during camera moves.
  Masks repaint only during the 800 ms reveal. Count-ups use `element.animate` or a single rAF that stops
  when done.
- At most two masked media layers per slot, briefly; one playing video; off-screen days unloaded.
- Preload only the next day (posters and images), on `requestIdleCallback` after a step settles.
- Wheel and touch handlers do O(1) work, no layout reads, and only transform writes.
- Map: the day look lowers terrain exaggeration; DPR stays capped at 2. The existing perf monitor can
  drop 3D terrain for the day view first.

### 5.13 Components, files and build order

New:

| File | Responsibility |
|---|---|
| `app/lib/tripDays.ts` | Pure: `tripDays(trip)` → `Day[]` `{n, waypoints, anchor, segment, media: [A?, B?], stats}`; `pickDayMedia`; `sightingStatsByDay`; `seenFrom(anchor)` |
| `app/lib/stepInput.ts` | DOM-only input → `step(±1)` / `pull(px)` / `exit()`; wheel intent detection, touch swipe, keys; the `JOURNEY_INPUT` tunables |
| `app/components/dayview/DayView.tsx` | The mode: open/close choreography, URL (push on enter, replace per day, popstate), snapshot and restore of the overview, engine wiring, live region, focus, autoplay bridge |
| `app/components/dayview/DayStage.tsx` | One day's composition (slots, headline, meta, note) |
| `app/components/dayview/FeatheredMedia.tsx` | Masked image or video, reveal transition, video lifecycle, poster-first, Save-Data handling; reuses `MediaFrame` source selection |
| `app/components/dayview/BirdDiary.tsx` | Tally, count-up, new-species `FieldLabel`s, group toggle, "seen from here" |
| `app/components/dayview/DayControls.tsx` | Progress row, prev/next, Overview, This day, ▶ |
| `app/components/dayview/DaySheet.tsx` | The This-day sheet |
| `app/components/dayview/dayview.css` | Slots per breakpoint, masks, `@property --reveal`, transitions, reduced motion |

Changed:

- `controller.ts`: `goToDay(n, {direction})` on the stepper (or generalise `goToStop` to take a camera
  target); `setLook(mode, ms)`; route-progress styling (`routeDraw.ts`); retarget mid-move.
- `camera.ts`: `dayCamera()` and the straightening rules.
- `look.ts`: `DAY_LOOK` (and optional contours).
- `gestures.ts`: a `"locked"` mode.
- `mapLayout.ts`: `DAY_LAYOUT` slots → insets.
- `map-layout.tsx` and `layout.css`: day-view mode, sheet hide and restore, scroll lock.
- `TripScreen.tsx`: "Start the journey", "Day n →" on itinerary lines, `id="day-n"`.
- `tokens.css`: `--duration-day-*`, reveal, count-up.
- i18n strings.
- `types.ts`: optional `Waypoint.views`.

Build order:

1. `tripDays.ts` (days, segments, media pick, diary stats).
2. Camera: `dayCamera` with straightening and visibility, plus `goToDay`, checked on two seed trips by
   eye.
3. Day view shell: enter/exit, URL, snapshot/restore, gestures locked, scroll lock.
4. `stepInput.ts` and controls; tune by feel on a Mac trackpad, mouse, and a phone.
5. Composition: slots, headline, `FeatheredMedia` (images), reveal.
6. `BirdDiary` and its animation; "seen from here".
7. Video lifecycle and Save-Data / reduced motion.
8. Day look (paint transitions), then optionally contours.
9. This-day sheet; "More info" scroll in the overview.
10. Accessibility and performance pass; optional "The whole way" card and autoplay.

---

## 6. Our about page

Content: Krishna's story, certifications, art and photography (`Guide`). Mobile-first. Lean: no map
needed.

**Backdrop.** San Rita uses a fixed photo, not its map. We recommend the same: one fixed, dimmed
landscape of Krishna's home hills at dawn (`position: fixed; inset: 0; background-size: cover`, night
overlay at 35%). It is cheap, keeps the map chunk off /about, and answers the open item in `VISION.md`
("about over a drifting map, or plain") with a third, lighter option. The ambient map can come later.

**Header (100svh).** A giant Anton headline (`KRISHNA THAPA`, or `HELLO, I'M KRISHNA`) at
`clamp(4.5rem, 24vw, 22rem)`, line-height .85, snow, overlapping the gradient seam
(`transparent 60% → night`). Unlike San Rita, it is **prerendered**. The letters rise from the centre
(scale 1.3 → 1, stagger 25 ms, 900 ms `--ease-sheet`) only on client-side navigation. A right-aligned
DM Mono italic line: `based in …, guiding since …`.

**Content from below.** San Rita's `reveal-y` (40 px, scrubbed with `view()`, staggered by
`--stagger-index`), but guarded:

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    html.js .rise { animation: rise linear both; animation-timeline: view();
                    animation-range: entry calc(var(--i, 1) * 12%) contain 70%; }
  }
}
@keyframes rise { from { opacity: 0; translate: 0 40px } to { opacity: 1; translate: 0 0 } }
```

Browsers without scroll-driven animations (Firefox) get an IntersectionObserver class toggle (600 ms
`--ease-sheet` transition). No JS means everything is simply visible.

**The fan (the owner's "curved flow that fans out").** San Rita's formula with our parameters, plus
three small organic touches:

```
n = 5–7 photos (portrait first, then Krishna's art and photographs)
r0(i)  = i·step + base             desktop step 30, base 40 · phone step 18, base 24
growth = desktop 5 · phone 2.2    (clamped so the outermost photo stays on screen at 360 px)
θ_i    = sweep·p_i + 0.8·i        sweep = π (desktop) · 0.8π (phone)
p_i    = smoothstep(clamp((s·T − (n−1−i)·0.05)/0.5, 0, 1))      T = 0.5 + (n−1)·0.05
r_i    = r0·(1 + (growth−1)·p_i) · (1 + jitter_i)               jitter ±8%, seeded per photo
scale  = 0.72 + 0.2·p_i
tilt   = tilt0_i·(1 − p_i) + 3°·sign(tilt0_i)·p_i              tilt0 alternates ±8°: unwinds as it flies
z      = first photo on top (as San Rita)
range  = section enters at the bottom → section bottom 25% above the top   (s ∈ [0,1])
```

- **Implementation:** CSS does the trigonometry (`cos()`/`sin()` in `calc`, supported in all current
  browsers). Each photo gets `--i`, `--n`, `--r0`, `--tilt0`, `--jit`, and the transform is
  `translate(calc(cos(var(--θ)) * var(--r)), calc(sin(var(--θ)) * var(--r))) rotate(var(--tilt))
  scale(var(--sc))`.
- **Only one variable, `--s`, is written by JS.** A passive scroll listener, active only while an
  IntersectionObserver says the section is visible, lerps `--s` toward its target with a 100 ms time
  constant (San Rita's `scrub .1`) and stops when settled.
- In Chromium, `--s` could instead be a registered `@property` driven by `animation-timeline: view()`,
  with no JS. Use the JS path everywhere for one behaviour.
- **Layout:** desktop, story text in columns 2–6 and the fan anchored in columns 8–11 (San Rita's
  placement). The section has `overflow-x: clip` (their top photo flies 958 px right; we must not create
  a horizontal scrollbar). Phones: the text first, then the fan as its own 70svh block centred below it,
  so photos never sit over the paragraph being read.
- **Each photo carries a `FieldLabel`** (art: title · medium · year; photographs: subject · place ·
  altitude · date). It shows only when `p_i > 0.85` (the photo has landed).
- **No JS / reduced motion:** a tidy, slightly fanned static stack (positions at `s = 0.35`, baked as
  the default `--s`). Reduced motion keeps it static.

Fan curve, phone (360 px wide, the stack centred; ◻ = photo centre):

```
s = 0          s = 0.5               s = 1
                  ◻   ◻               ◻      ◻
  ◻◻◻          ◻   O  ◻           ◻     O        ◻
  ◻ O                ◻                 ◻
```

**Sections.**

1. **Story:** the fan, plus a caption in the accent italic.
2. **Certifications:** cards rising with stagger, each a San Rita "values" card. A blob-shaped label
   over a field photo expands in place to show the issuer, year and a line from Krishna. Built on
   `<details>/<summary>` for no-JS and keyboard use (`grid-template-rows 0fr → 1fr`, 200 ms).
3. **Art and photography:** a second, larger fan (the 7 strongest works) or a horizontal snap row on
   phones, with field labels.
4. **Languages and specialties** as label-caps lines.
5. A guest quote in the accent italic.
6. "Plan a trip": inquiry, plus a **next-trail teaser** to a featured trip. Its masked cover grows to
   fill the screen (San Rita's `YourNextTrail`: mask-size 80% → 800%, 1 s ease-in-out after 350 ms) and
   hands off to `/trips/:slug/`.

**Mini-trail (desktop ≥ 1024 only).** A small fixed hand-drawn route from Krishna's home to a peak,
drawn with scroll (`stroke-dashoffset`, scrubbed). Four checkpoints (Story, Certifications, Art, Plan)
pop in with `--ease-pop` and are real anchor links. It is hidden on phones (San Rita's fixed overlay
covers content there).

---

## 7. What can't be determined statically, and what to confirm by eye

Not determinable statically:

- The felt speed of the projects track (friction 0.95 per frame: same distance at 120 Hz, but twice as
  fast), and how touch momentum feels on a real phone.
- Whether the backdrop reads exactly as in the screenshot. We inferred transparency from the missing
  `cod-gray` rule and saw the contour canvas; colour management of the shader output (×0.8) is unknown.
- The exact look of the wobbling feathered edge (the noise amplitude reads subtle on paper).
- Whether the SVG title shift (20 px) animates or snaps: the transition classes target the parent group.
- How the about page's fixed mini-trail sits on phones, and the background photo's content.
- Real device frame rates, and whether the descending z-index on case-study blocks is used for any
  overlap effect.

The owner should confirm by eye (a short screen recording would settle most of these):

1. On /projects: does a trackpad flick fly past several projects (we expect yes, with no snap)? Do the
   photos change before the title activates?
2. The feathered photo edges: is a gentle **static** organic edge enough, or is the slow wobble
   essential? It costs an always-on loop.
3. For our day view: **strict stepping** (one day per gesture) versus San Rita's free glide. We chose
   strict, per your brief. Should the progress dots be jump targets, or stay display-only for strict
   sequence?
4. Day look: muted relief only, or also **real contour lines** (small dependency)?
5. A final "The whole way" summary card after the last day: yes or no?
6. Forward direction: the day's walk runs **up** the screen (camera behind you, looking ahead). OK?
7. About page backdrop: a fixed photo (recommended) versus the ambient map. Headline wording.
8. "Seen from here" mountains: curate per stop (`Waypoint.views`) or derive by distance and visibility?

---

## Appendix: sources

- Own static analysis of sanrita.ca HTML, RSC data and JS/CSS chunks (listed under Method).
- [Awwwards: Mapping the Uncharted, the San Rita project](https://www.awwwards.com/mapping-the-uncharted-the-san-rita-project.html)
  [R]: "infinite scroll … persistent 3D world in the background … GSAP links scroll position to the
  camera". The first two match the code (`wrap()`, the persistent canvas); the camera link does not.
- [Abduzeedo: San Rita's Topographic Web Design Navigates Projects as Terrain](https://abduzeedo.com/node/89189)
  [R]: lightweight HTML/SVG with GLSL on photography; infinite scroll via GSAP `wrap()`. This matches
  the code.
- [DatoCMS: On trading templates for topography](https://www.datocms.com/casual-chats/on-trading-templates-for-topography) [R].
- All requests used `User-Agent: nbt-research-script/1.0`. No personal data was sent in any request or
  search query. No browser was launched.
