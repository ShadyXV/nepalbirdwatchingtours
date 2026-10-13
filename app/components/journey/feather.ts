/**
 * Organic feather masks for the day view's media (research §5.6). Four static blob shapes with a
 * soft, blurred edge, as SVG data URIs used as one CSS mask layer (journey.css `.jr-feather`), so
 * the same feather works on <img> and <video>. A corner photo uses the blob at twice its size,
 * centred on the screen corner it is anchored to, so only its inner edge is the blob's soft curve.
 * Static on purpose: no wobble loop (owner's decision); the shape changes per day (`day % 4`).
 */

const SHAPES = 4;
/** Blob radius (of a 100-unit box) and how much it wobbles; BLUR is the feather's width. */
const RADIUS = 42;
const WOBBLE = 0.13;
const POINTS = 9;
const BLUR = 5;

function seeded(seed: number): () => number {
  let a = seed * 2654435761;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A closed, smooth wobbly loop around (50, 50): quadratic curves through the midpoints. */
function blobPath(seed: number): string {
  const rand = seeded(seed + 1);
  const pts: [number, number][] = [];
  for (let i = 0; i < POINTS; i++) {
    const a = (i / POINTS) * Math.PI * 2 + (rand() - 0.5) * 0.3;
    const r = RADIUS * (1 + (rand() - 0.5) * 2 * WOBBLE);
    pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]);
  }
  const mid = (p: [number, number], q: [number, number]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2].map((v) => v.toFixed(1)).join(" ");
  let d = `M${mid(pts[POINTS - 1], pts[0])}`;
  for (let i = 0; i < POINTS; i++) {
    const p = pts[i];
    d += `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${mid(p, pts[(i + 1) % POINTS])}`;
  }
  return `${d}Z`;
}

const masks: string[] = Array.from({ length: SHAPES }, (_, i) => {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>` +
    `<filter id='f' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='${BLUR}'/></filter>` +
    `<path d='${blobPath(i)}' fill='#fff' filter='url(#f)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
});

/** The CSS `url(...)` of the blob mask for a day (and slot, so A and B differ). */
export function featherMask(day: number, slot: "a" | "b"): string {
  return masks[(day + (slot === "b" ? 2 : 0)) % SHAPES];
}
