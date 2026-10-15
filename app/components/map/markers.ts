/**
 * DOM for everything that sits on the map: trip pins, stop markers, place labels.
 * Plain elements (no React) so MapLibre can position them cheaply; styled by map.css with the
 * site's own fonts, so there is no glyph pipeline. Each builder returns the root element that
 * goes into a maplibregl.Marker plus the inner element we style (MapLibre writes `transform`
 * and `opacity` on the root, so our classes go on the inner one).
 */
import type { Landmark, Trip, Waypoint } from "~/content/types";
import { seededRandom } from "~/lib/geo";
import { assetUrl } from "~/lib/site";

const SVG_NS = "http://www.w3.org/2000/svg";

const formatAltitude = (m: number) => `${m.toLocaleString("en")} m`;

/* ---------------------------------------------------------------- blobs */

/**
 * An irregular, hand-made-looking closed blob: `points` radii jittered around a circle (seeded,
 * so a stop always gets the same shape), joined with a smooth Catmull-Rom curve.
 * Returns an SVG path in a viewBox of -1..1.
 */
export function blobPath(seed: string, wobble = 0.13, points = 7): string {
  const rand = seededRandom(seed);
  const turn = rand() * Math.PI * 2;
  const pts = Array.from({ length: points }, (_, i) => {
    const a = turn + (i / points) * Math.PI * 2;
    const r = 0.86 * (1 - wobble + rand() * wobble * 2);
    return [Math.cos(a) * r, Math.sin(a) * r] as const;
  });
  const p = (i: number) => pts[(i + points) % points];
  const f = (n: number) => n.toFixed(3);
  let d = `M${f(p(0)[0])},${f(p(0)[1])}`;
  for (let i = 0; i < points; i++) {
    const [x0, y0] = p(i - 1), [x1, y1] = p(i), [x2, y2] = p(i + 1), [x3, y3] = p(i + 2);
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6];
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(x2)},${f(y2)}`;
  }
  return `${d}Z`;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function svg(className: string, viewBox = "-1 -1 2 2"): SVGSVGElement {
  const node = document.createElementNS(SVG_NS, "svg");
  node.setAttribute("class", className);
  node.setAttribute("viewBox", viewBox);
  node.setAttribute("aria-hidden", "true");
  return node;
}

function svgChild<K extends keyof SVGElementTagNameMap>(parent: Element, tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  parent.appendChild(node);
  return node;
}

export type MarkerDom = { root: HTMLElement; inner: HTMLElement; button: HTMLButtonElement };

/** Root (positioned by MapLibre) > inner (our classes) > button (tap target). */
function shell(kindClass: string, label: string): MarkerDom {
  const root = el("div", "nbt-mk");
  const inner = el("div", `nbt-mk__inner ${kindClass}`);
  // The button takes the BLOCK's element class only (`nbt-stop__btn`), never the modifiers: a button
  // carrying `nbt-stop nbt-stop--key` would reset the marker's custom properties under the inner.
  const block = kindClass.split(" ")[0];
  const button = el("button", `${block}__btn`);
  button.type = "button";
  button.setAttribute("aria-label", label);
  inner.appendChild(button);
  root.appendChild(inner);
  return { root, inner, button };
}

/* ------------------------------------------------------------ trip pins */

export type TripPinDom = MarkerDom & { leader: HTMLElement };

/**
 * S0 trip pin: the cover photo in a square frame CENTRED on the trip's location, with a caption
 * plate beside it: the trip name and how many birds you might meet (`birdsLabel` is the full
 * phrase, e.g. "142 birds"; `birds` the number in it, set in the accent face). Anchor: center.
 *
 * The inner element is a zero-size point at the trip's location. When pins would overlap, the
 * layout pass (pinLayout.ts) moves the photo, up first (`--pin-dx`, `--pin-dy`); a thin leader runs
 * from the photo back to a small mark on the true point.
 */
export function createTripPin(trip: Trip, birdsLabel: string, birds: number): TripPinDom {
  const dom = shell("nbt-pin", `${trip.title}, ${birdsLabel}`);
  const photo = el("img", "nbt-pin__photo");
  photo.src = assetUrl(trip.cover.src);
  photo.alt = "";
  photo.decoding = "async";
  photo.draggable = false;

  const label = el("span", "nbt-pin__label");
  // "142 birds": the number in the accent italic, the word as a mono label.
  const count = el("span", "nbt-pin__count");
  const number = String(birds);
  const at = birdsLabel.indexOf(number);
  if (at >= 0) {
    count.append(
      document.createTextNode(birdsLabel.slice(0, at)),
      el("span", "nbt-pin__number", number),
      document.createTextNode(birdsLabel.slice(at + number.length)),
    );
  } else count.textContent = birdsLabel;
  label.append(el("span", "nbt-pin__name", trip.title), count);
  label.setAttribute("aria-hidden", "true");

  dom.button.append(photo, label);
  // The true point and the leader to it: only drawn while the photo is slid off the point.
  const point = el("span", "nbt-pin__point");
  const leader = el("span", "nbt-pin__leader");
  point.setAttribute("aria-hidden", "true");
  leader.setAttribute("aria-hidden", "true");
  dom.inner.prepend(leader, point);
  return { ...dom, leader };
}

/* ---------------------------------------------------------------- stops */

/**
 * Stop icons: simple line drawings on a 24-unit grid (centre 12,12, drawn within ~3..21), all in
 * one stroke weight (set in map.css, non-scaling). No fills, round caps and joins.
 */
export const STOP_ICONS = {
  /** Teahouse / lodge: pitched roof with eaves, walls, a door. */
  lodge: ["M3.5 11.5 12 4.5l8.5 7", "M6 9.6V19h12V9.6", "M10.2 19v-4.6h3.6V19"],
  /** Binoculars: two barrels and eyepieces, a bridge. Birding spots and pass-throughs. */
  binoculars: ["M3.6 15.5 6 7.5h3.4l1 6", "M20.4 15.5 18 7.5h-3.4l-1 6", "M10.4 13.6h3.2", "M7 15.5m-3.4 0a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0-6.8 0", "M17 15.5m-3.4 0a3.4 3.4 0 1 0 6.8 0a3.4 3.4 0 1 0-6.8 0"],
  /** Camp tent: ridge tent with an open door, on the ground. */
  tent: ["M3 19.5h18", "M5.2 19.5 12 6.5l6.8 13", "M10 19.5l2-4.6 2 4.6", "M12 6.5l-1.4-2.4M12 6.5l1.4-2.4"],
  /** Peak / viewpoint / pass: two summits, a snow line on the higher one. */
  peak: ["M2.8 19 9.6 7.2 14 14.6l2.6-3.8L21.2 19Z", "M7.4 11.1l1.5 1.3 1.3-1.1 1.2 1.2"],
  /** Water / wetland / river: two waves and a reed. */
  water: ["M3.5 13.5c1.4-1.6 2.9-1.6 4.3 0s2.9 1.6 4.3 0 2.9-1.6 4.3 0 2.9 1.6 4.3 0", "M3.5 18c1.4-1.6 2.9-1.6 4.3 0s2.9 1.6 4.3 0 2.9-1.6 4.3 0 2.9 1.6 4.3 0", "M15.5 10.5V4.8", "M15.5 7.2c1.2-.2 2.1-1 2.4-2.4"],
} as const;

export type StopIcon = keyof typeof STOP_ICONS;

/**
 * Which icon a stop wears. Stays: a tent for a camp night, a teahouse / lodge otherwise. Pass-through
 * stops by kind: peak for viewpoints and passes, water for rivers and wetlands, a tent for a camp,
 * binoculars for everything else (villages, forest, gates: birding on the way).
 */
export function stopIcon(waypoint: Waypoint): StopIcon {
  if (waypoint.nights > 0) return waypoint.stay?.kind === "camp" ? "tent" : "lodge";
  switch (waypoint.kind) {
    case "viewpoint":
    case "pass":
      return "peak";
    case "river":
    case "wetland":
      return "water";
    case "camp":
      return "tent";
    default:
      return "binoculars";
  }
}

/** Icon scale inside the blob's -1..1 viewBox: the ~18-unit drawing becomes ~0.85 wide, inside the blob (radius ≥ 0.72). */
const STOP_ICON_SCALE = 0.047;
/** Hand-drawn blob for stops: a little more wobble and fewer points than the pins. */
const STOP_BLOB = { wobble: 0.16, points: 6 };
/** The active stop's outer ring: the same blob, drawn this much larger. */
const STOP_RING_SCALE = 1.36;

/**
 * S1/S2 stop, after the San Rita markers: a dark, slightly irregular hand-drawn blob with a bold
 * pale outline and a line icon inside (`stopIcon`). Key stops (featured in the story) are large;
 * other stops are the same family, smaller and quieter. The active stop inverts (pale blob, dark
 * icon) inside a thin accent ring, all in map.css. Anchor: center.
 */
export function createStopMarker(waypoint: Waypoint, index: number, ariaLabel: string, key: boolean): MarkerDom {
  const stay = waypoint.nights > 0;
  const icon = stopIcon(waypoint);
  const kind = `${key ? `nbt-stop--key ${stay ? "nbt-stop--stay" : "nbt-stop--spot"}` : "nbt-stop--minor"} nbt-stop--${icon}`;
  const dom = shell(`nbt-stop ${kind}`, ariaLabel);
  dom.inner.style.setProperty("--i", String(index));
  const blob = svg("nbt-stop__blob");
  const shape = blobPath(waypoint.id, STOP_BLOB.wobble, STOP_BLOB.points);
  svgChild(blob, "path", { d: shape, class: "nbt-stop__ring", transform: `scale(${STOP_RING_SCALE})` });
  svgChild(blob, "path", { d: shape, class: "nbt-stop__shape" });
  const glyph = svgChild(blob, "g", { class: "nbt-stop__icon", transform: `scale(${STOP_ICON_SCALE}) translate(-12 -12)` });
  for (const d of STOP_ICONS[icon]) svgChild(glyph, "path", { d });
  dom.button.appendChild(blob);
  const label = el("span", "nbt-stop__label", waypoint.name);
  label.setAttribute("aria-hidden", "true");
  dom.inner.appendChild(label);
  return dom;
}

/**
 * The auto-tour's tag over the current stop: `DAY 4` (accent italic) over `TADAPANI · 2,630 m`,
 * plus a pulse ring. Lives inside the stop marker while the tour is there.
 */
export function createTourTag(waypoint: Waypoint, dayLabel: string): HTMLElement {
  const tag = el("span", "nbt-tour");
  tag.setAttribute("aria-hidden", "true");
  const day = el("span", "nbt-tour__day");
  const number = String(waypoint.day);
  const at = dayLabel.lastIndexOf(number);
  if (at >= 0) {
    day.append(document.createTextNode(dayLabel.slice(0, at)), el("span", "nbt-tour__num", number), document.createTextNode(dayLabel.slice(at + number.length)));
  } else day.textContent = dayLabel;
  tag.append(el("span", "nbt-tour__pulse"), day, el("span", "nbt-tour__place", `${waypoint.name} · ${formatAltitude(waypoint.altitudeM)}`));
  return tag;
}

/**
 * The "lens" around the active stop: a thin pale ring with four short ticks, a faint grid fading
 * out from the centre, no fill. Lives inside the stop marker.
 */
export function createLens(): HTMLElement {
  const lens = el("span", "nbt-lens");
  lens.setAttribute("aria-hidden", "true");
  lens.append(el("span", "nbt-lens__grid"), el("span", "nbt-lens__ring"), el("span", "nbt-lens__ticks"));
  return lens;
}

/* ---------------------------------------------------------- place labels */


/** Spoken label for a place, e.g. "Machhapuchhre, 6,993 m". */
export function placeAriaLabel(place: Landmark): string {
  return place.kind === "peak" && place.elevationM ? `${place.name}, ${formatAltitude(place.elevationM)}` : place.name;
}

/**
 * A place label in field-label style. Peaks: a small summit mark under `NAME · 6,993 m`
 * (anchor bottom = the summit). Ranges and parks: a spaced label centred on the place.
 * Cities and points of interest: a dot with the name beside it (anchor left).
 */
export function createPlaceLabel(place: Landmark): MarkerDom {
  const dom = shell(`nbt-place nbt-place--${place.kind}`, placeAriaLabel(place));
  dom.inner.dataset.tier = String(place.labelTier);
  const text = el("span", "nbt-place__text");
  text.appendChild(el("span", "nbt-place__name", place.name));
  if (place.kind === "peak" && place.elevationM) {
    text.appendChild(el("span", "nbt-place__alt", ` · ${formatAltitude(place.elevationM)}`));
  }
  const mark = el("span", "nbt-place__mark");
  mark.setAttribute("aria-hidden", "true");
  if (place.kind === "peak") dom.button.append(text, mark);
  else dom.button.append(mark, text);
  return dom;
}

/** Marker anchor for a place label (see createPlaceLabel). */
export function placeAnchor(place: Landmark): "bottom" | "left" | "center" {
  if (place.kind === "peak") return "bottom";
  if (place.kind === "city" || place.kind === "poi") return "left";
  return "center";
}
