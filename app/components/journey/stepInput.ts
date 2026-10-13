/**
 * Input for the day view: turns wheel, trackpad, touch and keys into strict day steps. DOM only,
 * no React. Every gesture steps at most ONE day (never a midpoint, never two days), and scrolling
 * is captured only while the day view is open (`attach` → `detach`).
 *
 * Wheel / trackpad (research §5.9, "Mac inertia"):
 *   deltas accumulate to `threshold`; then one step, and the gesture is LOCKED. A momentum tail
 *   decays monotonically, so it stays locked. The lock opens after `silenceMs` without wheel
 *   events, or when a fresh swipe arrives during the tail (a delta `reArm`× the last one, above
 *   `reArmMin`) and `cooldownMs` has passed since the last step. Horizontal scroll steps too
 *   (right / down = forward); a pinch (ctrlKey wheel) is ignored.
 * Touch: a swipe of `swipePx`, or a flick of `flickPx` faster than `flickPxPerMs`; up or left =
 *   forward. Under `tapPx` it is a tap (buttons, stop markers keep working).
 * Keys: ↓ → PageDown Space J = next; ↑ ← PageUp Shift+Space K = prev (key repeat at most one step
 *   per `keyRepeatMs`); Esc = exit. Home / End do nothing (no skipping). Shift + ← / → is left to
 *   the map's orbit.
 * `pull(px)` gives live feedback while a gesture builds (the day block leans toward the next day).
 */

export const JOURNEY_INPUT = {
  /** Wheel: accumulated delta that makes one step, px. */
  threshold: 40,
  /** Wheel: no event for this long ends a gesture (unlocks), ms. */
  silenceMs: 160,
  /** Minimum time between two steps, ms. */
  cooldownMs: 420,
  /** A fresh swipe during a momentum tail: delta this many times the previous one … */
  reArm: 1.5,
  /** … and at least this big, px. */
  reArmMin: 8,
  /** Horizontal wins when |dx| > |dy| × axisBias. */
  axisBias: 1.2,
  /** Live lean while a gesture builds: share of the delta, capped, px. */
  pull: 0.3,
  pullMax: 28,
  /** Touch: a swipe this long steps, px … */
  swipePx: 56,
  /** … or a flick this long … */
  flickPx: 24,
  /** … this fast, px/ms. */
  flickPxPerMs: 0.4,
  /** Touch movement under this is a tap, px. */
  tapPx: 10,
  /** Touch lean: share of the finger's travel, capped by pullMax. */
  touchPull: 0.4,
  /** Held arrow keys: at most one step per … ms. */
  keyRepeatMs: 600,
} as const;

export type StepInputHandlers = {
  step: (direction: 1 | -1) => void;
  exit: () => void;
  /** Live lean in px (0 = rest); positive leans toward the next day. */
  pull: (px: number) => void;
  /** While true, wheel / touch / step keys are left alone (e.g. the This-day sheet scrolls). */
  suspended: () => boolean;
};

const LINE_PX = 16;

/** True when the event belongs to something else: a form field, an open dialog, a scrollable sheet. */
function foreign(target: EventTarget | null): boolean {
  const el = target as Element | null;
  if (el?.closest?.("input, textarea, select, [contenteditable], [data-journey-scroll]")) return true;
  return Boolean(document.querySelector("[aria-modal='true']"));
}

export function attachStepInput(h: StepInputHandlers): () => void {
  const C = JOURNEY_INPUT;
  let acc = 0;
  let lastT = Number.NEGATIVE_INFINITY;
  let lastMag = 0;
  let locked = false;
  let lastStep = Number.NEGATIVE_INFINITY;
  let springTimer = 0;
  let lastKeyStep = Number.NEGATIVE_INFINITY;

  const commit = (direction: 1 | -1) => {
    lastStep = performance.now();
    h.pull(0);
    h.step(direction);
  };

  /* ---------------------------------------------------------- wheel */

  const onWheel = (e: WheelEvent) => {
    if (foreign(e.target) || h.suspended()) return;
    e.preventDefault(); // the page never scrolls, the map never zooms: the wheel steps days
    if (e.ctrlKey) return; // trackpad pinch: ignored
    const unit = e.deltaMode === 1 ? LINE_PX : e.deltaMode === 2 ? window.innerHeight : 1;
    const dx = e.deltaX * unit;
    const dy = e.deltaY * unit;
    const d = Math.abs(dx) > Math.abs(dy) * C.axisBias ? dx : dy;
    const mag = Math.abs(d);
    const now = performance.now();
    const gap = e.timeStamp - lastT;
    lastT = e.timeStamp;

    if (gap > C.silenceMs) {
      locked = false; // a new gesture after a pause
      acc = 0;
    } else if (locked && mag > lastMag * C.reArm && mag > C.reArmMin && now - lastStep > C.cooldownMs) {
      locked = false; // a fresh swipe rising out of a momentum tail
      acc = 0;
    }
    lastMag = mag;

    window.clearTimeout(springTimer);
    springTimer = window.setTimeout(() => {
      acc = 0;
      h.pull(0);
    }, C.silenceMs);
    if (locked) return;

    acc += d;
    h.pull(Math.max(-C.pullMax, Math.min(C.pullMax, acc * C.pull)));
    if (Math.abs(acc) >= C.threshold && now - lastStep >= C.cooldownMs) {
      locked = true;
      const direction = acc > 0 ? 1 : -1;
      acc = 0;
      commit(direction);
    }
  };

  /* ---------------------------------------------------------- touch */

  let touch: { x: number; y: number; t: number; moved: boolean } | null = null;

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1 || foreign(e.target) || h.suspended()) {
      touch = null;
      return;
    }
    const p = e.touches[0];
    touch = { x: p.clientX, y: p.clientY, t: e.timeStamp, moved: false };
  };

  const travel = (p: Touch) => {
    if (!touch) return 0;
    const dx = p.clientX - touch.x;
    const dy = p.clientY - touch.y;
    // Swipe up or left = forward: negative finger travel.
    return -(Math.abs(dx) > Math.abs(dy) * C.axisBias ? dx : dy);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!touch) {
      if (!foreign(e.target) && !h.suspended()) e.preventDefault(); // no page scroll, no pull-to-refresh
      return;
    }
    e.preventDefault();
    const d = travel(e.touches[0]);
    if (Math.abs(d) > C.tapPx) touch.moved = true;
    h.pull(Math.max(-C.pullMax, Math.min(C.pullMax, d * C.touchPull)));
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!touch) return;
    const p = e.changedTouches[0];
    const d = p ? travel(p) : 0;
    const speed = Math.abs(d) / Math.max(1, e.timeStamp - touch.t);
    const moved = touch.moved;
    touch = null;
    h.pull(0);
    if (!moved) return; // a tap
    const swipe = Math.abs(d) >= C.swipePx || (Math.abs(d) >= C.flickPx && speed >= C.flickPxPerMs);
    if (swipe && performance.now() - lastStep >= C.cooldownMs) commit(d > 0 ? 1 : -1);
  };

  const onTouchCancel = () => {
    touch = null;
    h.pull(0);
  };

  /* ----------------------------------------------------------- keys */

  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    if (foreign(e.target)) return;
    if (e.key === "Escape") {
      e.preventDefault();
      h.exit();
      return;
    }
    if (h.suspended()) return;
    const k = e.key;
    let direction: 1 | -1 | 0 = 0;
    if (k === "ArrowDown" || k === "PageDown" || k === "j" || k === "J") direction = 1;
    else if (k === "ArrowUp" || k === "PageUp" || k === "k" || k === "K") direction = -1;
    else if ((k === "ArrowRight" || k === "ArrowLeft") && !e.shiftKey) direction = k === "ArrowRight" ? 1 : -1;
    else if (k === " " || k === "Spacebar") {
      // Space on a focused button presses it; elsewhere it steps.
      if ((e.target as Element | null)?.closest?.("button, a")) return;
      direction = e.shiftKey ? -1 : 1;
    }
    if (!direction) return;
    e.preventDefault();
    const now = performance.now();
    if (e.repeat && now - lastKeyStep < C.keyRepeatMs) return;
    lastKeyStep = now;
    commit(direction);
  };

  const wheelOpts = { passive: false, capture: true } as const;
  const touchOpts = { passive: false, capture: true } as const;
  window.addEventListener("wheel", onWheel, wheelOpts);
  window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
  window.addEventListener("touchmove", onTouchMove, touchOpts);
  window.addEventListener("touchend", onTouchEnd, { passive: true, capture: true });
  window.addEventListener("touchcancel", onTouchCancel, { passive: true, capture: true });
  window.addEventListener("keydown", onKey, { capture: true });

  return () => {
    window.clearTimeout(springTimer);
    window.removeEventListener("wheel", onWheel, wheelOpts);
    window.removeEventListener("touchstart", onTouchStart, { capture: true });
    window.removeEventListener("touchmove", onTouchMove, touchOpts);
    window.removeEventListener("touchend", onTouchEnd, { capture: true });
    window.removeEventListener("touchcancel", onTouchCancel, { capture: true });
    window.removeEventListener("keydown", onKey, { capture: true });
    h.pull(0);
  };
}
