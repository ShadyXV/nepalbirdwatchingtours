/**
 * Trip pins never overlap: a small, deterministic screen-space pass, run when the camera settles
 * (and on resize, orbit end, state changes), never per frame.
 *
 * Each pin's photo is centred on its trip's true point. Pins are placed one by one (the previewed
 * pin first, then from the bottom of the screen up). A pin's footprint is its photo plus its
 * caption plate (right of the photo, or left). If it would touch something already placed (a pin,
 * a caption, an obstacle such as the home corner or the map controls) it moves to the cheapest
 * free slot: just above / below / beside what is in the way. Up is cheapest, then down, sideways
 * dearest, so clusters stack above one another and only spread sideways when a column is full.
 * A slot whose leader would cross another pin, whose boxes would sit on another pin's leader, or
 * whose caption would cover another trip's true point costs extra, so leaders and points stay
 * clear when there is room.
 *
 * Photos are the geography, so a caption may not drag its photo far: when keeping the caption
 * would move the photo more than MAX_CAPTION_MOVE, the pin is placed as a photo alone and its
 * caption shows only on hover / focus ("compact"). Geography gives way, overlap never happens,
 * and a leader to the true point (markers.ts) keeps the place honest.
 */

export type PinInput = {
  id: string;
  /** The true point on screen (map container px), or null when it is off the visible map. */
  point: { x: number; y: number } | null;
  /** Photo edge, px. */
  size: number;
  /** Caption plate size, px, or null when no caption is shown. */
  label: { width: number; height: number } | null;
  /** Placed before the others (the previewed pin keeps its true spot). */
  first: boolean;
};

export type PinPlacement = {
  /** Offset of the photo's centre from the true point, px (negative dy = up). */
  dx: number;
  dy: number;
  /** The caption sits left of the photo. */
  labelLeft: boolean;
  /** No room for the caption: hide it until hover / focus. */
  compact: boolean;
};

export type Box = { left: number; top: number; right: number; bottom: number };

/** Space kept between pins, px (also absorbs the hover / preview scale-up). */
export const PIN_GAP = 8;
/** Space between the photo and its caption plate, px (map.css: --pin-label-gap). */
export const PIN_LABEL_GAP = 4;
/** Cost per px of moving: up is cheapest, down a little dearer, sideways dearest. */
const COST = { up: 1, down: 1.5, side: 2 };
/** A caption may cost its photo at most this much movement (in photo sizes, weighted by COST). */
const MAX_CAPTION_MOVE = 1;
/** Extra cost of one crossing between a leader and a pin's photo or caption (px of movement). */
const CROSSING_COST = 80;

type Caption = "none" | "right" | "left";
type Slot = { dx: number; dy: number; cost: number };
type Segment = { x0: number; y0: number; x1: number; y1: number };
/** What is already on the map: boxes (photos, captions, obstacles), leaders, and every pin's true point. */
type Placed = { boxes: { box: Box; caption: boolean }[]; leaders: Segment[]; points: { x: number; y: number }[] };

/** Does the segment pass through the box (Liang-Barsky clipping)? */
function crosses(s: Segment, b: Box): boolean {
  const dx = s.x1 - s.x0;
  const dy = s.y1 - s.y0;
  let t0 = 0;
  let t1 = 1;
  const edges: [number, number][] = [
    [-dx, s.x0 - b.left],
    [dx, b.right - s.x0],
    [-dy, s.y0 - b.top],
    [dy, b.bottom - s.y0],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return false;
  }
  return true;
}

const inBox = (q: { x: number; y: number }, b: Box) => q.x >= b.left && q.x <= b.right && q.y >= b.top && q.y <= b.bottom;

/** The leader from the true point to the photo's centre (null when the photo sits on its point). */
function leaderOf(pin: PinInput, dx: number, dy: number): Segment | null {
  if (Math.hypot(dx, dy) < 0.5) return null;
  const { x, y } = pin.point!;
  return { x0: x, y0: y, x1: x + dx, y1: y + dy };
}

/** Captions and other pins keep this far apart, px: much further than a caption from its own photo, so it never reads as theirs. */
const CAPTION_CLEAR = 24;

const gapBetween = (aCaption: boolean, bCaption: boolean) => (aCaption || bCaption ? CAPTION_CLEAR : PIN_GAP);

const overlaps = (a: Box, b: Box, gap: number) =>
  a.left < b.right + gap && a.right + gap > b.left && a.top < b.bottom + gap && a.bottom + gap > b.top;

const moveCost = (dx: number, dy: number) => Math.abs(dx) * COST.side + (dy < 0 ? -dy * COST.up : dy * COST.down);

/** The boxes a pin covers when its photo is moved by dx, dy: the photo, and the caption plate. */
function footprint(pin: PinInput, dx: number, dy: number, caption: Caption): Box[] {
  const x = pin.point!.x + dx;
  const y = pin.point!.y + dy;
  const half = pin.size / 2;
  const photo = { left: x - half, top: y - half, right: x + half, bottom: y + half };
  if (caption === "none" || !pin.label) return [photo];
  const { width, height } = pin.label;
  // The plate's top is level with the photo's top (map.css).
  const left = caption === "left" ? photo.left - PIN_LABEL_GAP - width : photo.right + PIN_LABEL_GAP;
  return [photo, { left, top: photo.top, right: left + width, bottom: photo.top + height }];
}

/**
 * The cheapest free slot for one footprint, or null. Candidates per axis: stay, touch any placed
 * box from either side, or just fit inside the area's edge. Same input, same answer.
 */
function cheapestSlot(pin: PinInput, caption: Caption, placed: Placed, area: Box): Slot | null {
  const base = footprint(pin, 0, 0, caption);
  const dxs = [0];
  const dys = [0];
  base.forEach((own, i) => {
    dxs.push(area.left - own.left, area.right - own.right);
    dys.push(area.top - own.top, area.bottom - own.bottom);
    for (const { box: b, caption: isCaption } of placed.boxes) {
      const gap = gapBetween(i === 1, isCaption);
      dxs.push(b.left - gap - own.right, b.right + gap - own.left);
      dys.push(b.top - gap - own.bottom, b.bottom + gap - own.top);
    }
  });
  let best: Slot | null = null;
  for (const dx of dxs) {
    for (const dy of dys) {
      const leader = leaderOf(pin, dx, dy);
      const boxes = footprint(pin, dx, dy, caption);
      const crossings =
        (leader ? placed.boxes.filter(({ box }) => crosses(leader, box)).length : 0) +
        placed.leaders.filter((l) => boxes.some((b) => crosses(l, b))).length +
        (boxes[1] ? placed.points.filter((q) => q !== pin.point && inBox(q, boxes[1])).length : 0);
      const cost = moveCost(dx, dy) + crossings * CROSSING_COST;
      // Only a strictly better slot replaces the best so far (ties: higher up, then further left).
      if (best && !(cost < best.cost || (cost === best.cost && (dy < best.dy || (dy === best.dy && dx < best.dx))))) continue;
      const inside = boxes.every((b) => b.left >= area.left - 0.5 && b.right <= area.right + 0.5 && b.top >= area.top - 0.5 && b.bottom <= area.bottom + 0.5);
      if (!inside || boxes.some((b, i) => placed.boxes.some((p) => overlaps(p.box, b, gapBetween(i === 1, p.caption))))) continue;
      best = { dx, dy, cost };
    }
  }
  return best;
}

/**
 * @param area      where pins may sit (the visible map, container px)
 * @param obstacles boxes pins keep clear of (container px)
 */
export function layoutPins(pins: PinInput[], area: Box, obstacles: Box[] = []): Map<string, PinPlacement> {
  const result = new Map<string, PinPlacement>();
  const placed: Placed = { boxes: obstacles.map((box) => ({ box, caption: false })), leaders: [], points: [] };
  const order = pins
    .filter((p) => p.point)
    .sort((a, b) => Number(b.first) - Number(a.first) || b.point!.y - a.point!.y || a.point!.x - b.point!.x || (a.id < b.id ? -1 : 1));
  placed.points = order.map((p) => p.point!);

  for (const pin of order) {
    let caption: Caption = "none";
    let slot: Slot | null = null;
    if (pin.label) {
      // The caption's side: whichever lets the photo stay closer to its point (right on a tie).
      for (const side of ["right", "left"] as const) {
        const s = cheapestSlot(pin, side, placed, area);
        if (s && s.cost <= MAX_CAPTION_MOVE * pin.size && (!slot || s.cost < slot.cost)) {
          slot = s;
          caption = side;
        }
      }
    }
    if (!slot) {
      caption = "none";
      slot = cheapestSlot(pin, "none", placed, area) ?? { dx: 0, dy: 0, cost: 0 }; // very crowded: stay on the point
    }
    placed.boxes.push(...footprint(pin, slot.dx, slot.dy, caption).map((box, i) => ({ box, caption: i === 1 })));
    const leader = leaderOf(pin, slot.dx, slot.dy);
    if (leader) placed.leaders.push(leader);
    result.set(pin.id, { dx: slot.dx, dy: slot.dy, labelLeft: caption === "left", compact: Boolean(pin.label) && caption === "none" });
  }
  for (const pin of pins) if (!result.has(pin.id)) result.set(pin.id, { dx: 0, dy: 0, labelLeft: false, compact: false });
  return result;
}
