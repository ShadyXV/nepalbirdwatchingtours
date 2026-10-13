/**
 * How the map responds to hands, mouse and keys: always a real, freely explorable map.
 *
 *   overview (home)   mouse drag pans; the wheel scrolls the page unless pinching or holding
 *                     Ctrl / ⌘; on touch screens two fingers pan and zoom (MapLibre cooperative
 *                     gestures) so one-finger swipes keep scrolling the page.
 *   explore (trip,    drag pans, wheel / pinch zoom, right-drag or Ctrl-drag and two-finger
 *   place)            twist / tilt rotate and tilt; the navigator and story are the scroll handle.
 *   journey (day      the map is choreographed: no pan, zoom or MapLibre rotate. Scroll, swipe
 *   view)             and keys step the days (journey/stepInput.ts); only the orbit (orbit.ts:
 *                     buttons, Q / E, right-drag) may turn the camera for a look-around.
 *
 * Also: remembers when the user last touched the camera (automatic moves wait for them), a soft
 * edge (a pan that ends far outside Nepal eases back inside), and whether the user has turned or
 * tilted the view away from the state's own (shows the "reset view" control).
 */
import type { Map as MapLibreMap, MapLibreEvent } from "maplibre-gl";
import { readDurationMs, readToken } from "~/design/tokens";
import { parseEasing } from "~/lib/easing";
import { CAMERA, softBoundsCorrection } from "./camera";

export type GestureMode = "overview" | "explore" | "journey";

type GestureEvents = {
  /** The user moved the camera, or pressed on the map. */
  onUserInput: () => void;
  /** The view is (or no longer is) turned / tilted away from where the app put it. */
  onAdjusted: (adjusted: boolean) => void;
};

export type HintTexts = { touch: string; desktop: string };

const HINT_MS = 2200;

export class Gestures {
  private readonly map: MapLibreMap;
  private readonly container: HTMLElement;
  private readonly events: GestureEvents;
  private readonly hint: HTMLElement;
  private readonly hints: HintTexts;
  private hintShown = { touch: false, desktop: false };
  private hintTimer = 0;
  private touchStart: { x: number; y: number } | null = null;

  /** performance.now() of the last user camera input. */
  lastInput = Number.NEGATIVE_INFINITY;
  /** Bearing / pitch where the app last put the camera. */
  private reference = { bearing: 0, pitch: 0 };
  private adjusted = false;
  private userMoving = false;
  /** The current user gesture turned or tilted the map (not just a pan / zoom). */
  private userTurned = false;
  /** An orbit (orbit.ts) is moving the camera for the user: its frames are not "app moves". */
  private orbiting = false;
  private readonly dispose: (() => void)[] = [];

  constructor(map: MapLibreMap, container: HTMLElement, hints: HintTexts, events: GestureEvents) {
    this.map = map;
    this.container = container;
    this.events = events;
    this.hints = hints;
    this.reference = { bearing: map.getBearing(), pitch: map.getPitch() };

    this.hint = document.createElement("div");
    this.hint.className = "nbt-map__hint";
    this.hint.setAttribute("role", "status");
    container.appendChild(this.hint);

    const isUser = (e: MapLibreEvent) => Boolean((e as MapLibreEvent & { originalEvent?: Event }).originalEvent);
    const onStart = (e: MapLibreEvent) => {
      if (!isUser(e)) return;
      this.userMoving = true;
      this.markInput();
    };
    const onTurn = (e: MapLibreEvent) => {
      if (isUser(e)) this.userTurned = true;
    };
    const onEnd = (e: MapLibreEvent) => {
      if (this.orbiting) return;
      if (this.userMoving || isUser(e)) {
        this.userMoving = false;
        if (this.userTurned) this.checkAdjusted();
        this.userTurned = false;
        this.softEdge();
      } else {
        // The app moved the camera: that is the new "own" view.
        this.reference = { bearing: map.getBearing(), pitch: map.getPitch() };
        this.setAdjusted(false);
      }
    };
    map.on("movestart", onStart);
    map.on("moveend", onEnd);
    map.on("rotatestart", onTurn);
    map.on("pitchstart", onTurn);
    map.on("cooperativegestureprevented", (e) => this.onBlocked(e.gestureType));

    // Presses that don't move the camera (a tap on the map) still count as "the user is here".
    const press = () => this.markInput();
    const touch = (e: TouchEvent) => {
      const t = e.touches[0];
      this.touchStart = t ? { x: t.clientX, y: t.clientY } : null;
      this.touchDelta = null;
    };
    const touchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t && this.touchStart) this.touchDelta = { x: t.clientX - this.touchStart.x, y: t.clientY - this.touchStart.y };
    };
    container.addEventListener("pointerdown", press, { passive: true });
    container.addEventListener("touchstart", touch, { passive: true });
    container.addEventListener("touchmove", touchMove, { passive: true });
    this.dispose.push(() => {
      container.removeEventListener("pointerdown", press);
      container.removeEventListener("touchstart", touch);
      container.removeEventListener("touchmove", touchMove);
      window.clearTimeout(this.hintTimer);
      this.hint.remove();
    });
  }

  private touchDelta: { x: number; y: number } | null = null;

  setMode(mode: GestureMode): void {
    const m = this.map;
    if (mode === "journey") {
      m.dragPan.disable();
      m.scrollZoom.disable();
      m.keyboard.disable();
      m.doubleClickZoom.disable();
      m.touchZoomRotate.disable();
      m.touchPitch.disable();
      m.dragRotate.disable();
      m.boxZoom.disable();
      m.cooperativeGestures.disable();
      this.container.dataset.gestures = mode;
      return;
    }
    m.dragPan.enable(CAMERA.inertia);
    m.scrollZoom.enable();
    m.keyboard.enable();
    m.doubleClickZoom.enable();
    m.touchZoomRotate.enable();
    m.touchPitch.enable();
    m.dragRotate.enable();
    m.boxZoom.disable();
    if (mode === "overview") m.cooperativeGestures.enable();
    else m.cooperativeGestures.disable();
    this.container.dataset.gestures = mode;
  }

  /** An orbit starts: its camera frames belong to the user (they don't reset the reference). */
  orbitStart(): void {
    this.orbiting = true;
    this.markInput();
  }

  /** The orbit ended: show "reset view" if the view is now turned away from the app's. */
  orbitEnd(): void {
    this.orbiting = false;
    this.markInput();
    this.checkAdjusted();
  }

  markInput(): void {
    this.lastInput = performance.now();
    this.events.onUserInput();
  }

  /** Milliseconds until the user counts as idle (0 = idle now). */
  idleIn(): number {
    return Math.max(0, CAMERA.userIdleMs - (performance.now() - this.lastInput));
  }

  /** Forget the reference: the next app move sets it (e.g. after "reset view"). */
  resetAdjusted(): void {
    this.setAdjusted(false);
  }

  destroy(): void {
    for (const d of this.dispose) d();
  }

  private checkAdjusted(): void {
    const turned = Math.abs(((this.map.getBearing() - this.reference.bearing + 540) % 360) - 180);
    const tilted = Math.abs(this.map.getPitch() - this.reference.pitch);
    if (turned > CAMERA.adjustedDeg || tilted > CAMERA.adjustedDeg) this.setAdjusted(true);
  }

  private setAdjusted(adjusted: boolean): void {
    if (adjusted === this.adjusted) return;
    this.adjusted = adjusted;
    this.events.onAdjusted(adjusted);
  }

  /** After a user pan that ends far outside Nepal, ease back inside: a soft edge, not a wall. */
  private softEdge(): void {
    const c = this.map.getCenter();
    const inside = softBoundsCorrection([c.lng, c.lat]);
    if (!inside) return;
    this.map.easeTo({
      center: inside,
      duration: readDurationMs("--duration-soft-edge"),
      easing: parseEasing(readToken("--ease-out")),
    });
  }

  /**
   * MapLibre blocked a gesture (cooperative mode on home). Show our own quiet hint, once per page
   * view per kind, and only when the gesture looked like an attempt to move the map (a sideways
   * one-finger swipe), not an ordinary page scroll.
   */
  private onBlocked(kind: "wheel_zoom" | "touch_pan"): void {
    if (kind === "touch_pan") {
      const d = this.touchDelta;
      if (this.hintShown.touch || !d || Math.abs(d.x) < Math.abs(d.y) * 1.2) return;
      this.hintShown.touch = true;
      this.showHint(this.hints.touch);
    } else {
      if (this.hintShown.desktop) return;
      this.hintShown.desktop = true;
      this.showHint(this.hints.desktop);
    }
  }

  private showHint(text: string): void {
    this.hint.textContent = text;
    this.hint.classList.add("is-shown");
    window.clearTimeout(this.hintTimer);
    this.hintTimer = window.setTimeout(() => this.hint.classList.remove("is-shown"), HINT_MS);
  }
}
