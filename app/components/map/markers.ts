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
  const button = el("button", `${kindClass}__btn`);
  button.type = "button";
  button.setAttribute("aria-label", label);
  inner.appendChild(button);
  root.appendChild(inner);
  return { root, inner, button };
}

/* ------------------------------------------------------------ trip pins */

let clipIds = 0;

/**
 * S0 trip pin: the cover photo in a blob frame on a short stem, with the trip name and how many
 * birds you might meet (`birdsLabel` is the full phrase, e.g. "142 birds"; `birds` the number in
 * it, which is set in the accent face). Anchor: bottom (the stem's foot is the trip's location).
 */
export function createTripPin(trip: Trip, birdsLabel: string, birds: number): MarkerDom {
  const dom = shell("nbt-pin", `${trip.title}, ${birdsLabel}`);
  const photo = svg("nbt-pin__photo");
  const clipId = `nbt-pin-clip-${++clipIds}`;
  const shape = blobPath(trip.slug, 0.1, 8);
  const defs = svgChild(photo, "defs", {});
  const clip = svgChild(defs, "clipPath", { id: clipId });
  svgChild(clip, "path", { d: shape });
  svgChild(photo, "image", {
    href: assetUrl(trip.cover.src),
    x: "-1",
    y: "-1",
    width: "2",
    height: "2",
    preserveAspectRatio: "xMidYMid slice",
    "clip-path": `url(#${clipId})`,
  });
  svgChild(photo, "path", { d: shape, class: "nbt-pin__frame" });

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

  dom.button.append(photo, el("span", "nbt-pin__stem"), label);
  return dom;
}

/* ---------------------------------------------------------------- stops */

/**
 * S1/S2 stop: an irregular blob. Key stops (featured in the story) are full size: filled
 * rhododendron for stays, hollow monal-ringed for pass-through birding spots. Other stops are small,
 * quiet dots. Anchor: center.
 */
export function createStopMarker(waypoint: Waypoint, index: number, ariaLabel: string, key: boolean): MarkerDom {
  const stay = waypoint.nights > 0;
  const kind = key ? `nbt-stop--key ${stay ? "nbt-stop--stay" : "nbt-stop--spot"}` : "nbt-stop--minor";
  const dom = shell(`nbt-stop ${kind}`, ariaLabel);
  dom.inner.style.setProperty("--i", String(index));
  const blob = svg("nbt-stop__blob");
  svgChild(blob, "path", { d: blobPath(waypoint.id) });
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

/** The "lens" around the active stop: ring, faint grid, warm glow. Lives inside the stop marker. */
export function createLens(): HTMLElement {
  const lens = el("span", "nbt-lens");
  lens.setAttribute("aria-hidden", "true");
  lens.append(el("span", "nbt-lens__grid"), el("span", "nbt-lens__ring"));
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
