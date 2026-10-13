/**
 * Which DOM labels show: a small screen-space collision pass, run when the camera settles (never
 * per frame). Higher priority wins; "forced" labels (the open place, the active trip's peaks)
 * always show. Fading is CSS (`.is-hidden`).
 */

export type LabelCandidate = {
  /** The element whose box is measured and whose class is toggled. */
  el: HTMLElement;
  /** Higher shows first. */
  priority: number;
  /** Allowed at this zoom / state at all. */
  eligible: boolean;
  /** Shows even when it collides. */
  forced?: boolean;
};

/** Gap kept between labels, px. */
const GAP = 4;

type Box = { left: number; top: number; right: number; bottom: number };

const overlaps = (a: Box, b: Box) =>
  a.left < b.right + GAP && a.right + GAP > b.left && a.top < b.bottom + GAP && a.bottom + GAP > b.top;

/**
 * @param obstacles elements that are always shown and labels must avoid (e.g. trip pins)
 * @param viewport the map container's box
 */
export function placeLabels(candidates: LabelCandidate[], obstacles: Element[], viewport: Box): void {
  // Read every box first, then write classes: one layout, no thrashing.
  const placed: Box[] = obstacles.map((o) => o.getBoundingClientRect()).filter((r) => r.width > 0);
  const measured = candidates.map((c) => ({ c, box: c.eligible ? c.el.getBoundingClientRect() : null }));
  measured.sort((a, b) => Number(!!b.c.forced) - Number(!!a.c.forced) || b.c.priority - a.c.priority);

  const visible = new Set<HTMLElement>();
  for (const { c, box } of measured) {
    if (!box || box.width === 0) continue;
    const onScreen = box.right > viewport.left && box.left < viewport.right && box.bottom > viewport.top && box.top < viewport.bottom;
    if (!onScreen && !c.forced) continue;
    if (!c.forced && placed.some((p) => overlaps(p, box))) continue;
    placed.push(box);
    visible.add(c.el);
  }
  for (const { c } of measured) c.el.classList.toggle("is-hidden", !visible.has(c.el));
}
