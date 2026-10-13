/**
 * Orbit: turn the camera around the point in focus, keeping pitch and zoom. In mountains seen in our
 * near-isometric perspective, looking *around* a ridge (to see a stop a valley hides) is more useful
 * than zooming in, so this is the map's primary control (↺ ↻ buttons, Q / E keys, right-drag or
 * Ctrl-drag on desktop).
 *
 *   by(deg)        one eased turn (CAMERA.orbitStepDeg over CAMERA.orbitMs; reduced motion: an
 *                  instant CAMERA.orbitReducedDeg snap)
 *   hold(dir)      press and hold: keep turning at CAMERA.orbitDegPerSec until release()
 *   right-drag     horizontal drag turns around the focus point, vertical drag tilts (only while a
 *                  focus exists; otherwise MapLibre's own drag-rotate turns around the centre)
 *
 * The focus point stays where it is on screen: the camera centre C rotates around the focus F in
 * Web Mercator, C' = F − R(θ)(F − C), while the bearing turns by θ. Frames are rendered only while
 * turning (one rAF loop that stops); the visibility check is not applied to a look-around.
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import type { LngLat } from "~/content/types";
import { readToken } from "~/design/tokens";
import { parseEasing } from "~/lib/easing";
import { fromMercator, toMercator } from "~/lib/geo";
import { CAMERA } from "./camera";

const DEG = Math.PI / 180;
/** Right-drag: degrees of turn / tilt per pixel moved (MapLibre's own drag-rotate is 0.8 / 0.5). */
const DRAG_TURN_PER_PX = 0.4;
const DRAG_TILT_PER_PX = 0.25;
const MIN_PITCH = 0;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type OrbitEvents = {
  /** The point to orbit around, or null for the screen centre. */
  focus: () => LngLat | null;
  /** A user orbit begins (pause automatic moves; the camera is the user's now). */
  onStart: () => void;
  /** It ended (once per gesture): check "reset view", refresh labels. */
  onEnd: () => void;
  /** May the right-drag orbit run now (false: leave the gesture to MapLibre or nobody)? */
  dragAllowed: () => boolean;
};

export class Orbit {
  private readonly map: MapLibreMap;
  private readonly container: HTMLElement;
  private readonly events: OrbitEvents;
  private frame = 0;
  private running = false;
  private holdDir: 1 | -1 | 0 = 0;
  private drag: { x: number; y: number; pointerId: number; dragRotateWas: boolean } | null = null;
  private pendingDrag = { dx: 0, dy: 0 };
  private readonly dispose: (() => void)[] = [];

  constructor(map: MapLibreMap, container: HTMLElement, events: OrbitEvents) {
    this.map = map;
    this.container = container;
    this.events = events;

    // Capture on the map's container: runs before MapLibre's own handlers on the canvas container,
    // so its drag-rotate can be switched off for this one gesture.
    const down = (e: PointerEvent) => this.onPointerDown(e);
    const move = (e: PointerEvent) => this.onPointerMove(e);
    const up = (e: PointerEvent) => this.onPointerUp(e);
    const menu = (e: Event) => {
      if (this.drag) e.preventDefault();
    };
    container.addEventListener("pointerdown", down, { capture: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    container.addEventListener("contextmenu", menu);
    this.dispose.push(() => {
      container.removeEventListener("pointerdown", down, { capture: true });
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      container.removeEventListener("contextmenu", menu);
    });
  }

  get active(): boolean {
    return this.running || this.drag !== null;
  }

  /** One eased turn: 1 = the bearing grows (the scene turns anticlockwise on screen), -1 = back. */
  by(direction: 1 | -1): Promise<void> {
    this.stop();
    const reduced = prefersReducedMotion();
    const delta = direction * (reduced ? CAMERA.orbitReducedDeg : CAMERA.orbitStepDeg);
    const start = this.startState();
    this.events.onStart();
    if (reduced) {
      this.apply(start, delta, 0);
      this.events.onEnd();
      return Promise.resolve();
    }
    const ease = parseEasing(readToken("--ease-map"));
    const t0 = performance.now();
    this.running = true;
    return new Promise((resolve) => {
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / CAMERA.orbitMs);
        this.apply(start, delta * ease(t), 0);
        if (t < 1 && this.running) {
          this.frame = requestAnimationFrame(tick);
          return;
        }
        this.finish();
        resolve();
      };
      this.frame = requestAnimationFrame(tick);
    });
  }

  /** Press and hold: keep turning slowly until release(). No continuous orbit with reduced motion. */
  hold(direction: 1 | -1): void {
    if (prefersReducedMotion()) return;
    this.stop();
    this.holdDir = direction;
    const start = this.startState();
    this.events.onStart();
    this.running = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      if (!this.running || this.holdDir === 0) return;
      this.apply(start, this.holdDir * CAMERA.orbitDegPerSec * ((now - t0) / 1000), 0);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  release(): void {
    if (this.holdDir === 0) return;
    this.holdDir = 0;
    this.finish();
  }

  /** Cancel whatever runs (e.g. an automatic camera move takes over). */
  stop(): void {
    if (!this.running) return;
    this.holdDir = 0;
    this.finish();
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
    this.running = false;
    for (const d of this.dispose) d();
  }

  /* ------------------------------------------------------------ internals */

  private finish(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    const was = this.running;
    this.running = false;
    if (was) this.events.onEnd();
  }

  private startState() {
    this.map.stop();
    const c = this.map.getCenter();
    const center = toMercator([c.lng, c.lat]);
    const focusLngLat = this.visibleFocus();
    return {
      center,
      focus: focusLngLat ? toMercator(focusLngLat) : center,
      bearing: this.map.getBearing(),
      pitch: this.map.getPitch(),
    };
  }

  /** The focus point if it is on screen; null otherwise (orbit around the centre). */
  private visibleFocus(): LngLat | null {
    const focus = this.events.focus();
    if (!focus) return null;
    const p = this.map.project(focus);
    const { clientWidth: w, clientHeight: h } = this.container;
    return p.x >= 0 && p.y >= 0 && p.x <= w && p.y <= h ? focus : null;
  }

  private apply(start: ReturnType<Orbit["startState"]>, turnDeg: number, tiltDeg: number): void {
    const theta = turnDeg * DEG;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const dx = start.focus[0] - start.center[0];
    const dy = start.focus[1] - start.center[1];
    // C' = F − R(θ)(F − C), in Web Mercator (x east, y south).
    const center = fromMercator([start.focus[0] - (dx * cos - dy * sin), start.focus[1] - (dx * sin + dy * cos)]);
    const pitch = Math.max(MIN_PITCH, Math.min(CAMERA.maxPitch, start.pitch + tiltDeg));
    this.map.jumpTo({ center, bearing: start.bearing + turnDeg, pitch });
  }

  /* ---------------------------------------------------------- right-drag */

  private dragStart: ReturnType<Orbit["startState"]> | null = null;

  private onPointerDown(e: PointerEvent): void {
    if (e.pointerType === "touch") return;
    const rotateGesture = e.button === 2 || (e.button === 0 && e.ctrlKey);
    if (!rotateGesture || !this.events.dragAllowed() || !this.visibleFocus()) return;
    // Ours: keep MapLibre's drag-rotate (centre-based) out of this gesture.
    const dragRotateWas = this.map.dragRotate.isEnabled();
    if (dragRotateWas) this.map.dragRotate.disable();
    this.stop();
    this.drag = { x: e.clientX, y: e.clientY, pointerId: e.pointerId, dragRotateWas };
    this.dragStart = this.startState();
    this.pendingDrag = { dx: 0, dy: 0 };
    this.events.onStart();
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    this.pendingDrag = { dx: e.clientX - this.drag.x, dy: e.clientY - this.drag.y };
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      if (!this.dragStart) return;
      // Drag right → the bearing grows (MapLibre's convention).
      this.apply(this.dragStart, this.pendingDrag.dx * DRAG_TURN_PER_PX, -this.pendingDrag.dy * DRAG_TILT_PER_PX);
    });
  }

  private onPointerUp(e: PointerEvent): void {
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    if (this.drag.dragRotateWas) this.map.dragRotate.enable();
    this.drag = null;
    this.dragStart = null;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.events.onEnd();
  }
}
