/**
 * The day view's layout pass: two large photos anchored to the screen's edges, the headline and the
 * diary in the bands left over, and nothing over the day's route, its markers and labels. Pure
 * geometry, no DOM; Journey.tsx measures and calls it.
 *
 *   footprint   the day's route + markers + labels on screen (measured from the map once the camera
 *               rests; before that, the camera's clear band from DAY_LAYOUT, which the fit aims at)
 *   wide        photo A fills in from the top-left corner, photo B from the bottom-right corner (a
 *               diagonal), each up to `MEDIA.wideShare` of the screen and never into the route's
 *               corridor; the headline sits top-right above B, the diary bottom-left under A
 *   tall        photo A is a full-bleed band along the top, photo B along the bottom; the headline
 *               sits between A and the route, the diary between the route and B
 *   priority    headline, then the photos (shrunk to `MEDIA.min*` rather than dropped), then the
 *               diary (full, then a single tally line, then none). Text never sits on a photo.
 *   fallback    if that structure can't hold (odd footprints), a free-spot packer, same priorities
 *
 * Photo rects bleed `MEDIA.bleed` px past the screen edge, so their outer edges run off-screen; only
 * the inner edges are feathered (journey.css, feather.ts).
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Size = { w: number; h: number };
export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top" | "bottom";

/** Photo sizing (shares of the viewport) and anchoring. */
export const MEDIA = {
  /** Wide screens: each photo up to this share of the width / height. */
  wideShare: { w: 0.44, h: 0.62 },
  /** … and not smaller than this (else it is dropped). */
  wideMin: { w: 0.2, h: 0.24 },
  /** Tall screens: the bands' heights, at most / at least (share of the height). */
  tallMax: 0.3,
  tallMin: 0.12,
  /** Wide screens: where A and B are anchored (a diagonal). */
  wideCorners: ["top-left", "bottom-right"] as const,
  /** How far the photo boxes run past the screen edge, px. */
  bleed: 24,
} as const;

/** The birds block may narrow to fit its column, down to this (its names never wrap), px. */
const DIARY_MIN_W = 250;

export type DayLayoutInput = {
  /** The whole viewport (the photos may run under the bars and off the edges). */
  viewport: Size;
  /** The usable screen for text (between the top and bottom bars). */
  screen: Rect;
  /** The day's route, markers and labels on screen; null = unknown (no constraint). */
  footprint: Rect | null;
  /** Things text keeps clear of (map controls). */
  obstacles: Rect[];
  /** The day's anchor on screen, if known (the packer's headline likes to be near it). */
  anchor: { x: number; y: number } | null;
  head: Size;
  diary: Size | null;
  /** The diary as a single tally line (used when the full diary doesn't fit). */
  diaryCompact: Size | null;
  /** Which photos there are (A, B). */
  media: [boolean, boolean];
  /** Space kept around the footprint, and between items, px. */
  pad: number;
  gap: number;
};

export type PlacedMedia = Rect & { corner: Corner };
export type DayLayout = { head: Rect | null; diary: Rect | null; diaryCompact: boolean; media: (PlacedMedia | null)[] };

const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (a: Rect, s: Rect) => a.x >= s.x - 0.5 && a.y >= s.y - 0.5 && a.x + a.w <= s.x + s.w + 0.5 && a.y + a.h <= s.y + s.h + 0.5;
const grow = (r: Rect, by: number): Rect => ({ x: r.x - by, y: r.y - by, w: r.w + 2 * by, h: r.h + 2 * by });
const right = (r: Rect) => r.x + r.w;
const bottom = (r: Rect) => r.y + r.h;

export function layoutDay(input: DayLayoutInput): DayLayout {
  const f = input.footprint;
  if (f) {
    const wide = input.viewport.w > input.viewport.h;
    const result = wide ? wideLayout(input, f) : tallLayout(input, f);
    if (result) return result;
  }
  return packLayout(input);
}

/* --------------------------------------------------------------- wide */

function wideLayout(input: DayLayoutInput, f: Rect): DayLayout | null {
  const { viewport: v, screen: s, gap, pad } = input;
  const route = grow(f, pad);
  const bleed = MEDIA.bleed;

  // Headline: top of the right-hand column, as close to the route as it can be.
  const headX = Math.max(right(route) + gap, right(s) - gap - input.head.w);
  const head: Rect = { x: headX, y: s.y + gap, w: input.head.w, h: input.head.h };
  if (right(head) > right(s) - gap + 0.5 || head.x < right(route)) return null;

  // Photo B: from the bottom-right corner, below the headline, outside the route's corridor.
  let mediaB: PlacedMedia | null = null;
  if (input.media[1]) {
    const w = Math.min(v.w * MEDIA.wideShare.w, v.w - right(route));
    const h = Math.min(v.h * MEDIA.wideShare.h, v.h - (bottom(head) + gap));
    if (w >= v.w * MEDIA.wideMin.w && h >= v.h * MEDIA.wideMin.h) {
      mediaB = { x: v.w - w, y: v.h - h, w: w + bleed, h: h + bleed, corner: "bottom-right" };
    }
  }

  // Photo A from the top-left corner; the diary under it: full, one line, or none.
  for (const variant of ["full", "compact", "none"] as const) {
    const size = variant === "full" ? input.diary : variant === "compact" ? input.diaryCompact : null;
    if (variant !== "none" && !size) continue;
    const roomW = route.x - gap - (s.x + gap);
    let diary: Rect | null = null;
    if (size) {
      const w = Math.min(size.w, roomW);
      if (w < DIARY_MIN_W) continue;
      diary = { x: s.x + gap, y: bottom(s) - gap - size.h, w, h: size.h };
      if (input.obstacles.some((o) => intersects(diary!, o))) continue;
    }
    let mediaA: PlacedMedia | null = null;
    if (input.media[0]) {
      const w = Math.min(v.w * MEDIA.wideShare.w, route.x);
      const h = Math.min(v.h * MEDIA.wideShare.h, (diary ? diary.y : v.h) - gap);
      if (w >= v.w * MEDIA.wideMin.w && h >= v.h * MEDIA.wideMin.h) mediaA = { x: -bleed, y: -bleed, w: w + bleed, h: h + bleed, corner: "top-left" };
      else if (variant !== "none") continue; // keep the photo: try a smaller diary first
    }
    return { head, diary, diaryCompact: variant === "compact", media: [mediaA, mediaB] };
  }
  return null;
}

/* --------------------------------------------------------------- tall */

function tallLayout(input: DayLayoutInput, f: Rect): DayLayout | null {
  const { viewport: v, screen: s, gap, pad } = input;
  const route = grow(f, pad);
  const bleed = MEDIA.bleed;
  const maxH = v.h * MEDIA.tallMax;
  const minH = v.h * MEDIA.tallMin;

  // Top: photo A (full bleed), then the headline just above the route.
  const headY = route.y - gap - input.head.h;
  if (headY < s.y + gap - 0.5) return null;
  const head: Rect = { x: s.x + gap, y: headY, w: Math.min(input.head.w, s.w - 2 * gap), h: input.head.h };
  let mediaA: PlacedMedia | null = null;
  if (input.media[0]) {
    const h = Math.min(maxH, head.y - gap);
    if (h >= minH) mediaA = { x: -bleed, y: -bleed, w: v.w + 2 * bleed, h: h + bleed, corner: "top" };
  }
  // The headline sits close to the route, or right under the photo if the route is low.
  if (mediaA) head.y = Math.max(head.y, bottom(mediaA) + gap);
  else head.y = Math.max(s.y + gap, head.y);
  if (bottom(head) > route.y - gap + 0.5) head.y = route.y - gap - head.h;

  // Bottom: the diary just under the route, then photo B (full bleed): full diary, one line, none.
  for (const variant of ["full", "compact", "none"] as const) {
    const size = variant === "full" ? input.diary : variant === "compact" ? input.diaryCompact : null;
    if (variant !== "none" && !size) continue;
    const diary = size ? { x: s.x + gap, y: bottom(route) + gap, w: Math.min(size.w, s.w - 2 * gap), h: size.h } : null;
    if (diary && bottom(diary) > bottom(s) - gap) continue;
    if (diary && input.obstacles.some((o) => intersects(diary, o))) continue;
    let mediaB: PlacedMedia | null = null;
    if (input.media[1]) {
      const top = (diary ? bottom(diary) : bottom(route)) + gap;
      const h = Math.min(maxH, v.h - top);
      if (h >= minH) mediaB = { x: -bleed, y: v.h - h, w: v.w + 2 * bleed, h: h + bleed, corner: "bottom" };
      else if (variant !== "none") continue;
    }
    return { head, diary, diaryCompact: variant === "compact", media: [mediaA, mediaB] };
  }
  return null;
}

/* ----------------------------------------------------- packer fallback */

type Scorer = (r: Rect) => number;

function candidates(size: Size, screen: Rect, edges: Rect[], gap: number): Rect[] {
  const xs = new Set<number>([screen.x + gap, screen.x + screen.w - size.w - gap]);
  const ys = new Set<number>([screen.y + gap, screen.y + screen.h - size.h - gap]);
  for (const e of edges) {
    xs.add(e.x - size.w - gap);
    xs.add(e.x + e.w + gap);
    ys.add(e.y - size.h - gap);
    ys.add(e.y + e.h + gap);
  }
  const out: Rect[] = [];
  for (const x of xs) for (const y of ys) out.push({ x, y, w: size.w, h: size.h });
  return out;
}

function place(size: Size, screen: Rect, blocked: Rect[], gap: number, score: Scorer): Rect | null {
  let best: Rect | null = null;
  let bestScore = -Infinity;
  for (const r of candidates(size, screen, blocked, gap)) {
    if (!inside(r, screen)) continue;
    if (blocked.some((b) => intersects(r, grow(b, gap - 0.5)))) continue;
    const sc = score(r);
    if (sc > bestScore) {
      best = r;
      bestScore = sc;
    }
  }
  return best;
}

/** Free-spot packing: the headline, the photos in the corners that are free, then the diary. */
function packLayout(input: DayLayoutInput): DayLayout {
  const { screen, gap, viewport: v } = input;
  const blocked: Rect[] = [...input.obstacles];
  if (input.footprint) blocked.push(grow(input.footprint, input.pad));
  const anchor = input.anchor ?? { x: screen.x + screen.w / 2, y: screen.y };
  const cx = (r: Rect) => r.x + r.w / 2;

  const head = place(input.head, screen, blocked, gap, (r) => -r.y - 0.35 * Math.abs(cx(r) - anchor.x)) ?? {
    x: screen.x + gap,
    y: screen.y + gap,
    w: input.head.w,
    h: input.head.h,
  };
  blocked.push(head);

  const corners: Corner[] = ["top-left", "bottom-right", "top-right", "bottom-left"];
  const media: (PlacedMedia | null)[] = [null, null];
  for (let i = 0; i < 2; i++) {
    if (!input.media[i]) continue;
    for (let scale = 1; scale >= 0.45 && !media[i]; scale -= 0.11) {
      const w = v.w * MEDIA.wideShare.w * scale;
      const h = v.h * MEDIA.wideShare.h * scale;
      for (const corner of corners) {
        const r: Rect = { x: corner.endsWith("left") ? 0 : v.w - w, y: corner.startsWith("top") ? 0 : v.h - h, w, h };
        if (blocked.some((b) => intersects(r, b)) || media.some((m) => m && intersects(r, m))) continue;
        media[i] = { ...r, corner };
        blocked.push(r);
        break;
      }
    }
  }

  let diary = input.diary ? place(input.diary, screen, blocked, gap, (r) => r.y + r.h) : null;
  let compact = false;
  if (!diary && input.diaryCompact) {
    diary = place(input.diaryCompact, screen, blocked, gap, (r) => r.y + r.h);
    compact = Boolean(diary);
  }
  return { head, diary, diaryCompact: compact, media };
}
