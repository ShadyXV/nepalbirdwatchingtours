# San Rita (sanrita.ca/en) — interaction model and rendering technique

Research for learning only. We do not copy their code, models, textures or copy text; we want the
techniques, so we can design our own implementation for Nepal Birdwatching Tours.

Method: static analysis only (HTML, JS/CSS chunks and glTF headers downloaded with curl, grep, and a small
GLB-header reader kept outside the download dir; nothing executed, no browser launched), plus three web lookups.
Collected 2026-10-13.

Evidence tags used throughout:

- **[F]** fact, read directly from their HTML/JS/CSS/GLB.
- **[R]** reported by a third-party write-up (Awwwards / DatoCMS / Abduzeedo), not independently verified.
- **[I]** inference, our interpretation. Verify before relying on it.

---

## 1. Summary

1. **[F]** San Rita is a Next.js (App Router, Turbopack, RSC) site. The "map" is a **single fixed React Three Fiber (three.js) canvas** over a **baked, low-poly Blender terrain**. It is not a tile map.
2. **[F]** The terrain is one Draco mesh of **8,284 vertices / 16,166 triangles** (63 KB), 9 x 6 world units, max height 0.435. Its colour and relief come from **baked KTX2 textures** (diffuse + normal map; 2.3 MB + 3.7 MB desktop, about 1 MB + 1 MB mobile).
3. **[F]** Routes, markers, hotspots, labels and the big "park name" text are **separate Blender-authored meshes** (Draco GLBs, 30-84 KB each) with emissive pale-mint materials. They are not SVG or DOM.
4. **[F]** The glowing grid "lens" is a **fragment-shader patch** (`onBeforeCompile`) on the terrain material. It follows the raycast cursor UV and is made of a ring, a 120-line grid, simplex-noise "smoke" and a long-press barrel distortion.
5. **[F]** Everything on the home view is driven by **one scalar, `zoom` (0 to 1)**, in a zustand store. It is fed by a **hijacked wheel/touch accumulator** (200 px of delta, exponential damping at lambda 6) or by +/- buttons (600 ms sine ease-out). The scalar sets camera zoom, tilt, label opacity, route opacity, marker scale, cloud depth, the DOM grid lines and the side panel.
6. **[F]** The camera is `camera-controls` (yomotsu) with wheel disabled and drag = screen-pan. It is clamped to the terrain bounding box, polar angle <= 36 degrees, azimuth locked.
7. **[F]** Page transitions use a DOM overlay: a scrolling topology pattern on a 2D canvas, plus an organic **"ink-blot" polygon `clip-path` iris** (0.5 s in, route change, 0.5 s out). The WebGL canvas lives in the root layout and persists across routes.
8. **[F]** Content pages (about / projects) are plain DOM over the map: a 100vh transparent header with a gradient into a near-black sheet, a giant condensed headline (25.4vw) split into characters by GSAP SplitText, a **scroll-scrubbed spiral photo stack**, and CSS `animation-timeline: view()` reveals.
9. **[F]** Performance tactics: Draco + KTX2, separate mobile textures and HDR, DPR 1-to-adaptive via drei `PerformanceMonitor`, a pre-compile and warm-up pass behind a loader, native scroll and no Lenis on mobile. **[R]** The authors say "early high-poly models crashed mobile browsers", which pushed them to low-poly + baked textures. No `prefers-reduced-motion` handling was found **[F]**.
10. **Recommendation:** keep MapLibre as the engine (Nepal to trek is about a 100x zoom range; baking that in a mesh is not owner-maintainable). Copy San Rita's **choreography**, not its rendering: one progress scalar, tilt coupled to zoom, a staged reveal, an ink-blot transition, a dark sheet with a gradient seam, a giant headline, a spiral photo stack. See section 7.

---

## 2. Tech stack found, with evidence

| Layer | Finding | Evidence |
|---|---|---|
| Framework | **[F]** Next.js, App Router, Turbopack, RSC. Hosted on Cloudflare. | `/_next/static/chunks/turbopack-*.js`, `<meta name="next-size-adjust">`, `vary: rsc, next-router-state-tree`, `server: cloudflare` |
| 3D | **[F]** three.js + @react-three/fiber + @react-three/drei. | `WebGLRenderer`, `GLTFLoader`, `KTX2Loader`, `DRACOLoader`, `ShaderMaterial` in `00a4eae2b524cbe1.js`, `7b186ae425b7f038.js`; drei `Cloud`, `useGLTF`, `PerformanceMonitor`, `Environment` |
| Camera | **[F]** `camera-controls` (yomotsu) via drei `CameraControls`. | `class Ay extends Am{static install(e)...` plus `mouseButtons.wheel=A.NONE` in `6d694427e76d83bf.js` |
| Animation | **[F]** GSAP + ScrollTrigger + SplitText + `useGSAP`. | `gsap.registerPlugin(ScrollTrigger)`, `SplitText.create("h1.c-about_header_title",{type:"words,chars"})` (`9c33e027a723933f.js`) |
| Smooth scroll | **[F]** Lenis, desktop non-home pages only (`lerp .125`, `autoRaf:false`, driven by Tempus). Mobile gets native scroll. | `6d694427e76d83bf.js` ~199000: `void 0!==m&&m){...return children}`, `lerp:_ ... .125` |
| RAF scheduler | **[F]** Tempus (darkroom.engineering) drives all per-frame DOM and CSS-variable updates. | `window.tempusVersion="1.0.0-dev.17"` |
| State | **[F]** zustand stores: `useZoom`, `useToggle` (showTrails/showProject), `useStoreRef`, `useFrom`, preload progress. | `useZoom`, `showTrails:!1` |
| CSS | **[F]** Tailwind utility classes (v4-style `bg-(--var)`), CSS modules, CSS scroll-driven animations. | `.reveal-scroll-content-y{animation-timeline:view();animation-range:entry 15% contain 75%}` |
| CMS | **[F]/[R]** DatoCMS (images at `datocms-assets.com`; DatoCMS publishes a customer story). | `og:image .../datocms-assets.com/116050/...` |
| Fonts | **[F]** F37 Stout Black Compressed (display), Centra Mono (body), woff2 preloaded. | `Link` header `F37stout_black_compressed_webfont`, `centramono_book_webfont` |
| Analytics | **[F]** Google Tag Manager `gtag/js`. | in HTML |
| Not found | **[F]** No Mapbox/MapLibre/deck.gl/Lottie/Rive/Theatre/Framer Motion/Howler, no postprocessing (`EffectComposer` absent), no audio on the home view. | grep over all 19 chunks |

Asset inventory (**[F]**; sizes measured with a capped read, no file over 5 MB downloaded except the first 5 MB of the HDR to size-check it):

| Asset | Size | Role |
|---|---|---|
| `/webgl/sanrita-3d-map.glb` | 63 KB | the terrain: node `mountain-lowpoly`, 8,284 verts, `KHR_draco_mesh_compression`, no material or texture embedded |
| `/webgl/sanrita-trails.glb` | 84 KB | 62 nodes: `trail-main-path`, `trail-{about,project}-path`, `trail-hotspot-inner/outer.NNN`, `*-main-hotspot`, `*-title` (a `@fr` variant exists for French) |
| `/webgl/sanrita-hotspots.glb` | 46 KB | `hotspot-eyeglass-1..4`, `hotspot-fishhook-1..4`: circle, inner circle, clickable, shape |
| `/webgl/sanrita-labels.glb` | 32 KB | 10 text meshes (park, peak, creek, canyon, range, forest, desert, valley, lake and river names) |
| `…map-texture@diffuse.ktx2` | 2.33 MB (mobile 1.05 MB) | baked colour |
| `…map-texture@normal.ktx2` | 3.69 MB (mobile 1.05 MB) | baked normal map |
| `/webgl/environment.hdr` (+ `@mobile.hdr`) | > 5 MB desktop | image-based light, only `environmentIntensity .4` |
| `/pictures/cloud.webp` | 42 KB | one cloud sprite |
| `/pictures/map/map-hotspot-*.webp` | n/a | popup images for hotspots; one hotspot opens a YouTube Short |
| `/pictures/topology-background.svg` | n/a | tiled contour pattern for the transition overlay |

Mobile detection is `matchMedia("(max-width: 799.98px)")` **[F]**.

---

## 3. Scene and rendering breakdown

### 3.1 Terrain

- **[F]** One `<mesh>` with `meshStandardMaterial {map: diffuse.ktx2, normalMap: normal.ktx2, normalScale [0.6,-0.6], metalness 0, roughness 1}`, max anisotropy, `castShadow` and `receiveShadow`.
- **[F]** The geometry is a Draco low-poly mesh with a single UV set. Positions span x -4.5..4.48, z -3.0..3.0, y 0.001..0.435. That is a flat sheet with about 5% relief, viewed from above.
- **[R]** "Real GPS data and heightmaps, then sculpted in Blender; high-res sculpts baked onto low-poly meshes in Substance 3D Painter"; custom GLSL gives a "printed-paper" grain. Another report says terrain regions come from Canada and California.
- **[I]** The "photographic" ochre/pink ridges, dark-green forest and dark rivers are painted or baked in the diffuse texture. The 3D mesh is only a coarse carrier, and fine ridge detail is faked by the 3.7 MB normal map under a low raking sun.
- **[F]** Lighting is a single warm `directionalLight` (`#f8b275`, intensity 9, position [-20,3,-10], 4096x4096 shadow map, bias -1e-4) plus HDR environment at 0.4. Tone mapping is off (`toneMapping:0`).
- **[I]** The low sun angle (3 up over 20 across) is why the relief reads strongly and why the colours skew ochre and pink. Trail and marker meshes also cast shadows onto the terrain, so route ribbons look slightly raised.

### 3.2 Clouds / fog

- **[F]** drei `Cloud` machinery: instanced billboard quads with `cloud.webp`, per-instance opacity attribute, depth-sorted every frame. Two groups: one with `bounds [8,6,4] opacity .5 speed .5 segments 20 seed 3`, one with `bounds [5,3,4] scale .6 opacity .5 speed .25 seed 2`, both white and `fade 5`.
- **[F]** The group's `position.z = 20 * zoom`. As you zoom in, the clouds slide through the camera, which gives soft patches at the edges and a parallax "flying in" feel. They only render on the home route.
- **[I]** There is no volumetric fog. Atmosphere is just these sprites over the cool `#dde2e4` page background.

### 3.3 Grid

Two different grids, which is easy to miss:

1. **Map-sheet lines (hero):** **[F]** plain DOM. `c-home_grid-lines` is a 4 x 3 CSS grid of 1 px `forest-green` lines at 40% opacity. Its opacity is `100 - 100*zoom %`, so it fades out as you zoom in. Tempus writes CSS variables each frame.
2. **Lens grid (zoomed):** **[F]** in the terrain fragment shader, see 3.4.

### 3.4 Lens (cursor "magnifier")

All **[F]**, injected with `onBeforeCompile` at `#include <dithering_fragment>` of `MeshStandardMaterial`:

- Each frame, `raycaster.setFromCamera(pointer)` hits the terrain and copies the hit **UV** into `uMouse`.
- `circle = 1 - smoothstep(r, r+0.0025, dist + grid)`, with base radius `0.03` UV units. The radius shrinks with `uLongPressProgress` (-0.0085) and `uActiveProgress` (-0.018, when the pointer is over a clickable hotspot).
- Inside the lens: a grid, `step(0.95, fract(uv*120))` on both axes, with the UV warped by two simplex-noise waves ("smoke", `snoise(uv*8 + t*0.1)`), so the grid wobbles. `grid *= pow(1-uActiveProgress,1.5)`.
- A 25% mint tint (`uAdventureYellowColor = hsla(94,100%,90%)`) inside, a bright ring, and a **barrel distortion** `uv + (uv-mouse)*(1 - dot(d,d)*longPress*400)` while the pointer is held.
- Lens opacity is `uZoomProgress * 0.18`. When hovering a hotspot it pulses `mix(0.4,0.5,sin(t*2))`. It only appears once you are zoomed in. On touch devices it fades in on touch (`uTouchFadeProgress`, 0.3 s in, 0.4 s out).
- Pointer down: `gsap.to(uLongPressProgress, {value:1, duration:.15, ease:"back.out(2)"})`.
- The cursor changes: `default` below zoom 0.5, then `grab` / `grabbing` / `pointer`.

### 3.5 Routes (trails)

- **[F]** Authored in Blender as ribbon meshes (`trail-main-path`, `trail-about-path`, `trail-project-path`, ...) with the emissive `gray` material (emissive ~#B8C2C6, base black). Smaller hotspot circles use `lemon` (emissive ~#C4FF9D) and `green`. Solid vs dashed is baked into the geometry **[I]**.
- **[F]** Route visibility: every path except `trail-main-path` has `material.opacity = zoom`. Nothing is "drawn along its length" on the map. They just fade in with zoom.
- **[F]** A dash-draw effect does exist, but only as **SVG in the loader/hero overlay**: `stroke-dasharray = progress*length` for solid paths, a `clip-path: circle(progress%)` reveal for dashed paths, and checkpoint groups that get `.visible` (opacity/scale, `cubic-bezier(0,0,0.11,2.02)` 600 ms) in sequence.

### 3.6 Markers / hotspots

- **[F]** Each is a small Blender group: blob shape (`lemon`), circle (`gray`), inner circle (`green`/`green-spot`, 50% alpha) and an invisible `clickable-transparent` hit mesh (`alphaMode MASK`, alpha 0) for raycasting.
- **[F]** The "main" hotspots (About, Projects, Playground, Contact) are tilted `rotation.x = PI/6` and grow to 1.3x on hover (0.3 s `back.out(2)`), with the title mesh scaling in. Clicking navigates with the transition.
- **[F]** The small trail hotspots reveal by zoom: tween `scale 0 to 1`, 0.5 s, `back.out(2)`, triggered when `zoom` crosses `0.1 + i/n * 0.8`, reversed when zooming back out.
- **[F]** The eyeglass/fishhook POI icons open an HTML popup (webp image, or a YouTube Short for one) on click/hover. The popup is placed over `.c-home-wrapper`, and clicking elsewhere closes it.

### 3.7 Labels

- **[F]** Park/peak/creek names are 3D text meshes (emissive pale mint) with per-label Y-rotations (-0.6 to 1.15 rad), so they are laid out at angles. Opacity is `zoom - 0.3` (they appear from zoom 0.3).
- **[I]** That is the "large rotated park name over terrain" in the zoomed screenshot. It is geometry, so it cannot be changed without Blender.

### 3.8 Colour tokens (**[F]**, CSS)

`adventure-yellow #e2ffcc` (the pale mint), `deep-green #161b13` (content sheet), `forest-green #2d3329`, `icy-blue #dde2e4` (page and loader bg), `terrain-grey #84907f`.

---

## 4. Interaction and motion choreography

### 4.1 Load

1. **[F]** The HTML ships a fixed `c-preload-overlay` (icy-blue, centered SVG logo, `z-index 99999999`, opacity transition .3 s) and an `inert` `c-client-boot` shell.
2. **[F]** An asset preloader counts total assets: 2 GLBs (map, trails), 2 KTX2 (diffuse + normal), 1 HDR, 3 images (`cloud.webp` plus two project images), and 3 fonts. It increments a progress value per completed asset. The loader SVG scales `0.9 + 0.1*progress` and strokes draw by `progress`.
3. **[F]** Draco decoder (`/webgl/draco/`) and Basis transcoder (`/webgl/basis/`) are self-hosted; `setWorkerLimit(1)` caps KTX2 workers.
4. **[F]** A warm-up component sets all hidden objects visible, calls `gl.compile(scene, camera)` and renders a 128 px `CubeCamera` once to build the environment, so the first interactive frame has no shader-compile hitch.
5. **[F]** When complete, the overlay fades out (0.3 s).

### 4.2 Hero (zoom = 0)

- **[F]** Camera: top-down (`polar 0`), `zoom 1`, centred. Hotspots at scale 0. Labels at opacity 0. Small paths at opacity 0. Map-sheet grid lines at full opacity. Header logo and the left "The trails of San Rita" nav panel (350 px wide) are visible.
- **[F]** Prompt text "Scroll to enter our world" is split into letters.
- **[F]** Wheel and touchmove are captured on `window` with `preventDefault` (passive false) on the homepage. They accumulate into a virtual position 0..200 (`scrollHeight:200`), so **200 px of wheel delta spans the whole zoom**. That is only a couple of mouse-wheel notches.
- **[F]** Each frame (Tempus): `zoom += damp(zoom, target, lambda 6, dt)` (three's `MathUtils.damp`), snapping at 0.00085. While the value changes, `activeZoom = "wheel"` is held and released 150 ms after the last movement. `activeZoom` arbitrates between wheel, click and animation so they cannot fight.

### 4.3 Zoom-in (zoom 0 to 1)

All **[F]**. On every `zoom` change:

- Camera: `zoomTo(1 + zoom*p)` (instant, no smoothing in the call) and `rotatePolarTo(zoom*p/4)`, with `p = 2` normally (zoom factor 1 to 3, tilt 0 to ~0.5 rad / 29 degrees) or `p = 0.85` when R3F `viewport.factor > 180` (**[I]** roughly viewports taller than ~1040 CSS px, so less zoom on big screens). `camera-controls` smoothing (`smoothTime .2`) softens the jumps.
- Pan: while `zoom <= 0.4` the camera is pinned (`moveTo(0,0,0)`, `truckSpeed 0`). Above 0.4, drag pans (`truckSpeed 4`), clamped to the terrain's bounding box inset by 2.3 units (1 on mobile).
- Marker groups: scale (non-circle parts) = zoom. Small paths: opacity = zoom. Labels: opacity = zoom - 0.3.
- Small hotspots pop in staggered at offsets 0.1 + i/n*0.8 (see 3.6).
- Lens opacity ramps with zoom (0.18 * zoom).
- Clouds slide: `z = 20 * zoom`.
- DOM: grid lines fade `100 - 100*zoom %`; wrapper padding `40 - 40*zoom px`; side nav slides out `--scroll-aside = 314px * zoom` (with a 0.0015 dead zone); logo translates `(1 - zoom) * 40px`; prompt letters collapse with a staggered `scaleX(1-t^4) scaleY(1-0.6*t^4)` and fade where `t = clamp((zoom - 0.85*i/(n-1)) / 0.15)`.
- Pointer-events on the content layer switch at `zoom > 0.5`.

### 4.4 Click zoom (+/-)

- **[F]** A +/- control (a 32 x 64 px chamfered box). `animateZoomTo(target 0|1, 600 ms)` uses `ease = sin(t * PI/2)` (sine ease-out) on a rAF loop. While it runs `activeZoom = "click"`. In the R3F frame loop the value is also lerped 0.1 toward the target and snapped within 0.001.

### 4.5 Navigate to a trail (hotspot click)

- **[F]** `useNavigateWithTransition`: `setTransitionType("in")`, set `isAnimating`, store the target URL, and `router.push` only after the in-transition ends (500 ms timer).
- **[F]** The overlay `.transition-in` runs `transition-mask-in 0.5s ease-out forwards`. It is a `clip-path: polygon(...)` with 11 points all at 50% 50% at 0%, an irregular small blob (e.g. `43.5% 45.2%, 46.7% 40.9% ... 44.3% 54.8%`) at 60-70%, then a full rectangle at 100%. Over the overlay, a 2D canvas scrolls `topology-background.svg` tiles rotated -25 degrees, scaled 1.6, alpha 0.2, moving at 50 px/s.
- **[F]** After the route change, the "out" phase: 500 ms, then the main shell animates `main-transition-mask-in 0.5s ease-out` plus `main-transition-scale-in 0.7s ease-in-out` (scale .9 to 1, opacity .6 to 1).

### 4.6 Content page (about / project)

- **[F]** On non-home routes the camera effect re-runs: `moveTo(0,0,0)`, `zoomTo(1+p)`, `rotatePolarTo(p/4)`, `setZoom(1)`. So the map sits at full zoom/tilt behind the DOM. The canvas keeps `pointer-events:none` and the controls are disabled.
- **[F]** Layout is a 2-row grid. Row 1 is `c-about_header`, a 100vh transparent block with `background: linear-gradient(to bottom, transparent 60%, #161b13 100%)`. Row 2 is the content on `bg-deep-green`.
- **[F]** Headline: `font-f37stout uppercase text-[25.4vw] leading-[.9]` (mobile 45.6vw / .8), mint on the map. GSAP SplitText `words,chars`; `gsap.from(chars, {delay 1.1 (mobile 0.3), duration 1, opacity 0, scale 1.3, ease "power2.out", stagger {each .03, from "center"}})`. A screen-reader-only `<h1>` carries the real text and the visual one is `aria-hidden`.
- **[F]** Body reveals: CSS `reveal-scroll-content-y` keyframes `opacity 0, translateY(40px)` to `opacity 1, 0` on `animation-timeline: view()`, `animation-range: entry calc(var(--stagger-index,1)*15%) contain 75%` (opacity starts at 0). Variants: `-x` (-25 px) and `-opacity` (entry 25% to contain 65%).
- **[F]** Photo stack (this is the "tilted stack"): N `.c-about_picture-stack` images, each CSS-tilted `rotate-3`, 411 x 513 px (280 x 350 mobile), in a single grid cell. A GSAP timeline is bound to the section with `ScrollTrigger {start "top bottom", end "bottom -25%", scrub 0.1}`. Image `i` starts at radius `r0 = i*30 + 40` (mobile `i*20 + 30`) and angle `0.8*i`, scale 0.7. During the scrub, `p` goes 0 to 1 and the image is placed at `(cos(p*PI + 0.8i) * r, sin(p*PI + 0.8i) * r)` with `r` growing to `r0 * 6` (mobile `* 2`) and scale `0.7 + 0.2p`, `ease: none`, staggered `(n-1-i)*0.05`. So the stack **fans out along a spiral as you scroll**. It is scroll-scrubbed, not a spring.
- **[F]** Team cards track the pointer (CSS variables `--dist-x/--dist-y` per card from `pointermove` and `scroll`); a hover scale of 1.05 over 300 ms.
- **[F]** The "Show trails" control is **not a map-layer toggle**. It is a collapsible legend/nav box (`c-trail-box`, 190 px) labelled "Show trails / Hide trails" (`trails_toggle_*`). Opened, it lists map legend entries (road, trail, fishing spot, viewpoint) as navigation. It closes on outside click (350 ms delay) and on route change.
- **[R]** The projects page is an infinite scroll over a persistent 3D world; GSAP maps scroll position to camera movement; selecting a project moves the camera to a map coordinate "in one continuous shot". **We could not confirm this in the home/about code** (we only saw project-page chunks for the list), so treat it as unverified.

---

## 5. Page / route transitions and state

- **[F]** The canvas and the preloader are in the **root layout**, outside the page tree. Navigation is client-side (`next/navigation`), so the WebGL scene never remounts. **[R]** Confirmed by the write-up: "the canvas stays mounted outside the App Router".
- **[F]** Routes: `/en` (map), `/en/projects`, `/en/about`, `/en/playground`, `/en/contact`, plus a `/fr` mirror. Each is real HTML (SSR/RSC), so SEO and no-JS crawlers see content. The hotspot GLB has an `@fr` variant for localised titles.
- **[F]** Links are intercepted: `onClick` calls `preventDefault()` then `navigateTo()`, so a normal URL changes and the back button works. The transition store carries `transitionType`, `isAnimating` and an `onTransitionComplete` callback.
- **[F]** Home-only behaviours (wheel hijack, clouds, zoom subscription, `Lenis` off) are gated by `isHomepage`. The camera is reset to zoom 1 on route change; zoom state is **not** remembered across routes **[I]**.
- **[I]** There is no deep link into a "zoomed" state on the home page. The URL does not encode camera position.

---

## 6. Performance and accessibility tactics

Performance (**[F]** unless stated):

- Draco geometry (about 5 to 10x smaller), KTX2/Basis textures (GPU-compressed), 63 KB terrain, tiny instanced clouds.
- Separate mobile assets: `@mobile` diffuse/normal at 1024 px (about 1 MB each), `environment@mobile.hdr`; on mobile the lens starts hidden and fades in on touch; desktop group scale adapts to viewport (`1.4 + ((w+h)/2 - 1440) * 2e-4`).
- `Canvas`: `powerPreference: high-performance`, `antialias: true`, `preserveDrawingBuffer: false`, `fov 60`, `shadows: true`, `dpr [1, f]` with drei `PerformanceMonitor` (`onIncline -> 3`, `onDecline -> 1`, `flipflops 3`, `onFallback -> 1`). **[I]** The `f` values mean "DPR cap 1 on decline, higher on incline". R3F still clamps to the device ratio. **[R]** The authors add that shadow resolution and grain density are lowered when the frame rate drops (we saw only the DPR path).
- Scene warm-up (shader compile + cube capture) hidden behind the loader. Self-hosted decoders. Hidden-route 3D (controls, view port) sits in a React `Activity` set to hidden, so it is not updated on non-home routes.
- Frame loop is **always on** (no `frameloop="demand"` found) **[I]**; the cost is bounded by DPR and the tiny scene.
- WebGL context loss: handlers call `preventDefault()` and log a warning on `webglcontextlost`; the restore handler is empty (**[F]**).
- Lenis is disabled on mobile; the layout uses `100dvh`.

Accessibility:

- **[F]** Headline duplicated as a visible `aria-hidden` h1 and a `sr-only` h1. Nav links are real `<a href>`. `inert` on the boot shell until ready. `meta viewport ... maximum-scale=1` (blocks pinch-zoom: negative).
- **[F]** **No `prefers-reduced-motion` handling** in the JS or CSS we downloaded. The CSS scroll reveals start at `opacity:0` with no fallback shown, so unsupported browsers may show blank content (**[I]**, untested).
- **[F]** Wheel/touch hijack on the home view prevents normal page scroll there (by design; on mobile too, via `touchmove` `preventDefault`).
- **[I]** The WebGL map itself (hotspots) is not keyboard-reachable; the left nav provides the keyboard route.

---

## 7. Adaptation for Nepal Birdwatching Tours

### 7.1 What their technique means for our requirements

Their rendering approach is excellent for one small, art-directed world and weak for ours:

| Our need | San Rita approach | Problem for us |
|---|---|---|
| Whole of Nepal (about 880 km x 200 km, 60 m to 8,848 m) at the start, then zoom to a single trek region | One baked mesh, about 3x camera zoom | We need roughly 100x scale change. One 16k-triangle mesh and a 2K texture would be blurry at trip scale. We would need a mesh plus texture LOD per trip. |
| Owner adds / edits trips (typed TS data, lat/lng) | Every route, marker and label is a Blender mesh | Each new trip would need 3D authoring and a re-export. Not owner-maintainable. |
| Real geography | Fictional or composite terrain | Birders will recognise real ridges, rivers and the Terai; real data matters here. |
| Static hosting, mid phones | Works, but about 6 MB of textures plus HDR plus 4096 shadow map | The 4096 shadow map and an always-on loop are heavy for mid phones. |

So: **copy the choreography and the visual language, not the renderer.**

### 7.2 Recommended stack: MapLibre-native, San Rita-style choreography (**recommended**)

All MapLibre API names below are to be **verified against the MapLibre GL JS 6 docs** (we know the shapes from v5; confirm exact names such as `color-relief`, `hillshade-method`, `line-trim-offset`, the `pixelRatio` map option).

**Terrain / colour (replaces the baked mesh + diffuse + normal)**

- Elevation: a `raster-dem` source in Terrarium or Mapbox encoding. For development use a public Terrarium source; **before launch self-host a Nepal-only DEM tile set** (build step with GDAL, so there is no third-party runtime dependency and no usage-policy risk; attribute SRTM / Copernicus as required).
- Look: `color-relief` layer with an elevation ramp tuned to the San Rita palette: Terai greens (60-300 m), ochre/pink middle hills (300-3,000 m), cool greys to near-white above 4,500 m. Add `hillshade` with the multidirectional method plus a warm shadow colour and a low highlight, to get the "raking-sun" ridge read that their directional light + normal map gives. Keep the page background `icy-blue`-like.
- 3D: `map.setTerrain({source, exaggeration ~1.2-1.6})` plus `pitch` 45-65 on trip view for the oblique look. Keep hillshade under it. Use `sky` / fog settings for the soft horizon haze instead of cloud sprites.
- Optional "painted" upgrade (Phase 6+): a build-time baked relief raster (hillshade + colour + paper grain from GDAL/ImageMagick, saved as WebP tiles or a PMTiles archive) used as a `raster` layer. This matches the plan's "may swap in a baked relief image layer". It gives the closest match to San Rita's printed-paper look, at the price of repo size (tens of MB for z0 to z10 over Nepal, **[I]** estimate) and a build step. Decide after the colour-relief look is judged.

**Camera / choreography (replaces camera-controls + zoom scalar)**

- Keep a **single `progress` store** (zustand or a plain observable) as San Rita does, but have it drive DOM + MapLibre feature-state/paint props, not a mesh:
  - `progress` 0 = "Nepal", 1 = "trip". Camera is eased by MapLibre's own animation, so we do not need a per-frame scalar for camera position; we do need it for the DOM overlays (labels, side panel, sheet).
- Home (Nepal): `fitBounds(NEPAL_BOUNDS, {padding, pitch: 0-25, bearing: -8})`, drag-pan limited by `maxBounds`, wheel/pinch zoom **not hijacked** (we should not scroll-jack; their hijack is a known accessibility cost). Few labels via symbol layers (Kathmandu, Chitwan, main peaks).
- Trip pins: `maplibregl.Marker` with custom DOM (photo circle, name, "N birds"). Fine for dozens of pins; swap to a symbol layer + images if it grows.
- Click a trip: navigate (React Router) **and** `map.flyTo`/`fitBounds` to the trip bounds: duration about 2.4-3.2 s, `curve 1.4`, cubic ease-in-out, `pitch 55-62`, `bearing` aligned to the route's main axis, `padding.bottom` reserved for the sheet. Mark it `essential:false` so `prefers-reduced-motion` turns it into a jump (MapLibre's documented behaviour).
- On arrival (or from about 60% of the flight, via the `move` event): draw the route (see below), then pop waypoint markers with a stagger of about 80 ms using San Rita's recipe: scale 0 to 1, 0.3-0.5 s, `back.out(2)`, equivalent CSS: `cubic-bezier(0,0,0.11,2.02)` 600 ms. Reverse on leaving.
- Back: `flyTo` the saved Nepal view, reverse the stagger.

**Routes / waypoints (replaces Blender ribbons)**

- GeoJSON line layer from the typed trip data. Solid + dashed (`line-dasharray`) for main route vs side/alternate. Pale mint (`#e2ffcc`-like) line over a thin dark casing; slight blur for the hand-drawn feel.
- "Draw along its length": `line-trim-offset` if available in v6, else `line-gradient` with `lineMetrics:true`, else update the source with progressively sliced coordinates (turf `lineSliceAlong`) in a rAF loop for about 1.2-1.8 s.
- Waypoints: DOM markers (blob shape with pale outline, per San Rita) with a per-waypoint species checklist popup/drawer. Birding spots use the same marker with a binoculars icon.

**Cursor lens / grid (replaces terrain shader patch)**

- Cheapest faithful version: a DOM/CSS overlay that follows the pointer: `radial-gradient` ring, a CSS grid pattern masked by the circle (`mask-image: radial-gradient`), a slow `background-position` shift for the "smoke wobble", `mix-blend-mode: screen`. It grows/shrinks on pointer-down and on hover over a waypoint, using the same 0.15 s `back.out(2)` feel. It fades in with `progress` (their 0.18 * zoom).
- Touch devices: show it only while touching (as they do).
- Do not try to patch MapLibre's terrain fragment shader. A custom layer can render a lens, but it costs more than it gives here.

**Map-sheet grid (replaces DOM grid lines)**

- Either the same DOM 4 x 3 hairline grid, fading `100 - 100*progress %`, or (better for a real map) a lat/lon **graticule GeoJSON line layer** with `line-opacity` interpolated by zoom. The graticule stays geographically correct while panning.

**Labels (replaces 3D text meshes)**

- Symbol layers with self-hosted glyph PBFs generated from our own display font (needs a build step), `text-letter-spacing` large, `text-rotate` per feature, `text-pitch-alignment: map` / `text-rotation-alignment: map` so big park names lie on the terrain. Fade by zoom with `text-opacity` interpolation, which reproduces their `opacity = zoom - 0.3`.

**Clouds / fog**

- Phase 1: MapLibre fog/sky settings only. Optional: 2-3 absolutely positioned cloud PNG/WebP layers (about 40 KB) with CSS transforms bound to `map.on("zoom")` for parallax (their `z = 20 * zoom`). That is a DOM approach and costs almost nothing. Skip a three.js custom layer.

**Content sheet / headline / photos (this part is almost 1:1 portable and is plain DOM + CSS)**

- Sheet: fixed or sticky bottom sheet on `#161b13`-style near-black; header block 100vh transparent with `linear-gradient(to bottom, transparent 60%, sheet-colour)` so the map melts into it. Sheet rise: `translateY(100%) -> 0`, 700-900 ms, `cubic-bezier(.2,.8,.2,1)`, started at about 50% of the camera flight so both are in motion together. Move the map centre up with `easeTo({padding:{bottom}})` instead of re-fitting, so there is no second camera jump.
- Headline: condensed uppercase display face at about 25vw (45vw on phones), `line-height .9`, overlapping the map; letters in from the centre (`stagger .03`, `scale 1.3 -> 1`, `opacity 0 -> 1`, `power2.out`, 1 s, 1.1 s delay or about 0.3 s on mobile). Real text in a `sr-only` heading; the visual one `aria-hidden` (a pattern worth copying). If we avoid GSAP SplitText (paid plugin history; check licence), split characters ourselves and use CSS `animation-delay` computed from distance to the centre.
- Photo stack: take the spiral math from 4.6, but make it ours. Option A: scroll-scrubbed with CSS `animation-timeline: view()` and per-image custom properties. Option B (matches "springing in as a tilted stack"): on entry, a spring/overshoot per photo with the CSS `linear()` easing function (no JS), `rotate(-4deg..4deg)` alternation, 60-80 ms stagger, then settle into a stack. Use `motion` (small) only if we also want gesture physics.
- Reveals: CSS `animation-timeline: view()` for text fade-ups, **but with `@supports (animation-timeline: view())` and a no-JS default of visible**, so Firefox / older Safari and crawlers get content (their approach hides content when unsupported).
- Ambient video / Ken Burns: independent of the map, as in the plan; pause when off screen (`IntersectionObserver`), poster for reduced motion.

**Persistent map + route transitions**

- Same rule as San Rita and as `docs/PLAN.md`: the map lives in a layout route shared by `/` and `/trips/:slug`. Route changes drive the camera, not a remount.
- Ink-blot transition: reuse the idea (an irregular polygon `clip-path` iris, about 0.5 s out then 0.5 s in) for cross-page links such as `/about`. Between `/` and `/trips/:slug` it is not needed, because the camera flight is the transition. Use the React Router `viewTransition` / View Transitions API if we want the sheet crossfade to be cheap.
- URL as state: each trip is `/trips/:slug` (they do not deep-link camera state; we do, which is better for sharing and for crawlers, since the prerendered HTML carries the itinerary).

**Performance / accessibility on mid phones**

- MapLibre: cap `pixelRatio` at 2, no antialias on low-end, keep terrain exaggeration moderate, `fadeDuration` shorter, restrict `maxZoom`, and a frame-time monitor like theirs (3 consecutive slow windows -> drop 3D terrain and shadows, then DPR). Lazy-load the map chunk after first paint and show the prerendered itinerary first.
- Respect `prefers-reduced-motion` (they do not): jumps instead of flights, no lens wobble, no parallax, static photo stack.
- Do not hijack wheel/touch. If we want San Rita's "scroll to enter", make it opt-in (button / keyboard) or use normal page scroll with the map in a sticky section.
- Keyboard: pins and waypoints as real buttons, with focus moving the camera; a list view of trips for screen readers.

### 7.3 Alternative: three.js baked terrain (San Rita's way)

| | MapLibre (recommended) | three.js baked mesh |
|---|---|---|
| Visual fidelity at hero | Good to very good with colour-relief + hillshade; excellent with a baked raster | Highest control and the closest to the screenshots (painted texture, low sun, shadows) |
| Fidelity at trip zoom | Real tiles at any zoom | Blurry unless we bake one mesh+texture per trip (about 6 MB each) |
| Effort | Low to medium (styles, a few layers, DOM overlays) | High: Blender/Substance pipeline, custom shaders, R3F scene, picking, camera rig, per-trip authoring |
| Bundle | MapLibre about 250-300 KB gz (already chosen), small glue code | three + R3F + drei + camera-controls + loaders about 200-300 KB gz **on top of** MapLibre if we still want a real map, or instead of it |
| Mid-phone perf | OK with raster DEM + hillshade; 3D terrain at pitch is the cost, so gate it | OK only with low-poly, KTX2 and capped DPR (as they do); shadows and an always-on loop cost battery |
| GitHub Pages | Fine. Static tiles/DEM in `public/` or a CDN | Fine (GLB + KTX2 are static files) |
| Owner updates | Edit TS data (lat/lng); new trips need no art work | Every new trip or label needs 3D authoring |
| SEO / agents | Prerendered itinerary; map is progressive | Same, but the "map" is opaque to everything |

A **hybrid** is possible later (a three.js custom layer in MapLibre for a signature hero element, e.g. drifting clouds or a lens). We do not recommend starting there.

### 7.4 Suggested phasing against the plan

1. Phase 2 (Map core): colour-relief + multidirectional hillshade, graticule, Nepal bounds, 6-8 labels, DOM trip pins. Judge the look against the San Rita screenshots; decide on the baked raster.
2. Phase 2/3: trip flight (`flyTo/fitBounds` + route draw + waypoint stagger), `padding.bottom` coupling with the sheet, back flight.
3. Phase 3: sheet rise, headline, photo stack, checklist, "Show route" legend toggle (a legend/layer toggle for stays / spots / passes, rather than San Rita's nav-like legend).
4. Phase 6: lens overlay, cloud parallax, ink-blot transitions, ambient video, tuning of easing and durations, perf + reduced-motion pass.

---

## 8. Open questions (best answered by a short screen recording from the owner)

A 30-60 s screen capture with the cursor visible (desktop, then one on a phone) would answer:

1. **Hero idle:** does anything move without input (cloud drift speed, route shimmer, grain)? Is the hero camera exactly top-down?
2. **Scroll weight:** how many wheel notches / swipes does the full zoom take? Does it feel springy at the end? (We measured 200 px of delta and lambda 6, but felt behaviour matters.)
3. **Zoom end state:** the final tilt and zoom; whether labels and trails look as the screenshots suggest, and when exactly the lens appears.
4. **Lens:** does it track instantly or lag? What does a long press look like (barrel distortion + ring), and does hovering a hotspot pulse it?
5. **Hotspot popup:** layout of the popup card (image, caption, close), and its animation.
6. **Navigation:** what the click on "About"/"Projects" hotspot looks like, i.e. the ink-blot timing and whether the camera moves under it.
7. **Content page:** whether the map is visible and alive behind the header (is the camera still moving?), and how the headline reveal reads against it.
8. **Photo stack:** the exact motion on scroll (direction, speed), and whether images spring or purely scrub.
9. **Mobile:** touch gestures for zoom (pinch? swipe?), what the "scroll to enter" is on touch, and the frame rate on the phone.
10. **Reduced motion:** any behaviour change with the OS setting on (we found none in code).
11. **Projects page:** whether the camera really flies along coordinates as scroll proceeds ([R] claim we could not verify).
12. **Sound:** any audio (none found in the home chunks).

Things we could not determine statically: the exact look of the diffuse texture (KTX2 not decoded), the shapes and positions of the route ribbons in 3D, the popup's DOM layout, project-page camera paths, and real-device frame rates.

---

## Appendix A. Sources and research notes

- Their HTML, 19 JS chunks, 4 CSS files, and 6 route chunks from `/en/about` and `/en/projects`; GLB JSON headers parsed with a script outside the download dir.
- Third party: Awwwards write-up "Mapping the Uncharted: The San Rita Project" [R]; DatoCMS customer story "On trading templates for topography" [R]; Abduzeedo "San Rita's Topographic Web Design Navigates Projects as Terrain" [R, found via search, not fetched].
- Credits as reported (not verified): Atelier San Rita, Montreal; names credited in the write-ups include Julien Sister, Alexis Malin, Martin Thienpont; the DatoCMS story credits a creative developer for the Blender terrain. We do not reproduce anything from their assets.
- Network note: about 100 requests were made against sanrita.ca, above the ~60 suggested; a part of these were HEAD or range probes and asset-size checks. All used `User-Agent: nbt-research-script/1.0`; no personal data was sent in any request or search query. No browser was launched.
