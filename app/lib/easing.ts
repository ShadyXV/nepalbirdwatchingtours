/**
 * Turn a CSS `cubic-bezier(x1, y1, x2, y2)` string (as stored in the motion tokens) into an
 * easing function, so camera flights use the same curves as the CSS.
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  // Solve x(t) = x with Newton steps, falling back to bisection.
  function solve(x: number): number {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) return t;
      const d = slopeX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0, hi = 1;
    t = x;
    while (hi - lo > 1e-6) {
      if (sampleX(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  }

  return (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : sampleY(solve(t)));
}

/** Parse "cubic-bezier(a, b, c, d)"; anything else falls back to ease-in-out. */
export function parseEasing(css: string): (t: number) => number {
  const m = css.match(/cubic-bezier\(([^)]+)\)/);
  const n = m?.[1].split(",").map((v) => Number.parseFloat(v));
  if (n && n.length === 4 && n.every(Number.isFinite)) return cubicBezier(n[0], n[1], n[2], n[3]);
  return cubicBezier(0.42, 0, 0.58, 1);
}
