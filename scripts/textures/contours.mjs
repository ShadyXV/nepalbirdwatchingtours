/**
 * Generates the topographic-contour texture: public/textures/contours.svg
 *
 *   node scripts/textures/contours.mjs [seed]
 *
 * A generic, seamlessly tileable pattern (not real terrain): a periodic "terrain" made of a few
 * sine waves with whole-number frequencies, contoured with d3-contour. Because the field repeats
 * exactly every tile, lines leaving one edge come back in at the opposite edge.
 * Change SEED for a different pattern; size, line spacing and stroke are the constants below.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { contours } from "d3-contour";

const SEED = Number(process.argv[2] ?? 7);
const CELLS = 200; // grid cells per tile
const SCALE = 4; // px per cell -> 800 px tile
const PAD = 2; // extra cells around the tile so lines run cleanly across its edges
const LEVELS = 16; // number of contour lines across the height range
const STROKE = "#eef4f1"; // --color-snow; opacity comes from --texture-opacity in CSS
const STROKE_WIDTH = 1;
const OUT = "public/textures/contours.svg";

// Small seeded PRNG (mulberry32), so the pattern is reproducible.
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Periodic field: whole-number frequencies (kx, ky) make it repeat over [0, 1).
const random = rng(SEED);
const waves = [];
for (let kx = -7; kx <= 7; kx++) {
  for (let ky = 0; ky <= 7; ky++) {
    const k = Math.hypot(kx, ky);
    if (k < 2 || k > 7.5 || (ky === 0 && kx <= 0)) continue;
    waves.push({ kx, ky, amp: (0.5 + random()) / k ** 1.3, phase: random() * Math.PI * 2 });
  }
}
const height = (u, v) => waves.reduce((sum, w) => sum + w.amp * Math.cos(2 * Math.PI * (w.kx * u + w.ky * v) + w.phase), 0);

const size = CELLS + 2 * PAD;
const values = new Float64Array(size * size);
for (let j = 0; j < size; j++) {
  for (let i = 0; i < size; i++) values[j * size + i] = height((i - PAD) / CELLS, (j - PAD) / CELLS);
}
let min = Infinity;
let max = -Infinity;
for (const value of values) (min = Math.min(min, value)), (max = Math.max(max, value));
const step = (max - min) / (LEVELS + 1);
const thresholds = Array.from({ length: LEVELS }, (_, n) => min + step * (n + 1));

// Ramer-Douglas-Peucker simplification (tolerance in cells).
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const length = Math.hypot(bx - ax, by - ay);
  let worst = 0;
  let index = 0;
  for (let n = 1; n < points.length - 1; n++) {
    const [px, py] = points[n];
    // Distance to the chord; to the start point when the run is a closed ring.
    const distance = length ? Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length : Math.hypot(px - ax, py - ay);
    if (distance > worst) (worst = distance), (index = n);
  }
  if (worst <= tolerance) return [points[0], points[points.length - 1]];
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)];
}

// Keep only the parts of each ring near the tile (drops the edges d3 traces along the grid border)
// and skip specks shorter than 6 cells.
const inside = ([x, y]) => x >= PAD - 1 && x <= PAD + CELLS + 1 && y >= PAD - 1 && y <= PAD + CELLS + 1;
const px = (value) => +((value - PAD) * SCALE).toFixed(1);
const paths = [];
for (const { coordinates } of contours().size([size, size]).thresholds(thresholds)(values)) {
  for (const ring of coordinates.flat()) {
    let run = [];
    const flush = () => {
      const length = run.reduce((sum, p, n) => (n ? sum + Math.hypot(p[0] - run[n - 1][0], p[1] - run[n - 1][1]) : 0), 0);
      if (length > 6) paths.push(`<path d="M${simplify(run, 0.2).map(([x, y]) => `${px(x)} ${px(y)}`).join("L")}"/>`);
      run = [];
    };
    for (const point of ring) (inside(point) ? run.push(point) : flush());
    flush();
  }
}

const tile = CELLS * SCALE;
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}">` +
  `<g fill="none" stroke="${STROKE}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round">${paths.join("")}</g></svg>\n`;
mkdirSync("public/textures", { recursive: true });
writeFileSync(OUT, svg);
console.log(`${OUT}: ${tile}px tile, ${LEVELS} levels, ${(svg.length / 1024).toFixed(1)} KB`);
