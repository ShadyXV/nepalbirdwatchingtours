/**
 * Hover media reveal (EXPERIENCE.md "Hover media reveal"): hovering a trip pin or a stop marker
 * (desktop), or pressing and holding it (phones), shows a large photo or muted video snippet beside
 * the marker whose edges feather into the map. A reveal, not a pop-up: it has no pointer events,
 * lives only while the pointer is over the original small marker, and only one exists at a time.
 *
 *   intent   mouse / pen: REVEAL.intentMs after entering the marker; touch: a REVEAL.holdMs press
 *            that hasn't moved (that hold then never becomes a tap / navigation)
 *   place    beside the marker on the side with the most room inside the map's free area (clear of
 *            the content peek, stepper and controls), never over the marker, clamped in view
 *   play     crossfades through the media every REVEAL.intervalMs; videos are muted, looping,
 *            inline snippets, loaded only while shown and unloaded right after
 *   leave    fades out (--duration-ui); timers, videos and media are released
 *
 * Cheap by design: media is preloaded only on intent, no idle loops, posters only under Save-Data,
 * a single still and a plain fade for reduced motion. Plain DOM, styled in map.css (.nbt-reveal).
 *
 * Kept independent of how it is drawn (content in, one element out), so the planned "land becomes
 * the photo" experiment (MapApi.setOutsideVeil / nepalOutlinePath) can reuse the intent and content.
 */
import type { MediaAsset } from "~/content/types";
import { readDurationMs } from "~/design/tokens";
import type { Insets } from "~/lib/geo";
import { assetUrl } from "~/lib/site";

export const REVEAL = {
  /** Desktop: hover this long before revealing, so passing over a marker doesn't flicker. */
  intentMs: 150,
  /** Phones: press and hold this long to reveal. */
  holdMs: 350,
  /** A hold that moves further than this is a pan, not a reveal, px. */
  holdMovePx: 10,
  /** After a hold, the click the release may produce is swallowed for this long, ms. */
  swallowClickMs: 600,
  /** Long side of the media: a share of the map width, clamped (about 5× a pin photo), px. */
  longSideShare: 0.4,
  longSidePx: [300, 480] as const,
  /** Where room is tight it shrinks into the space there is, down to this; below it, no reveal. */
  minLongSidePx: 180,
  /** Landscape media frame (width / height). */
  aspect: 3 / 2,
  /** Gap between the marker and the reveal, and between the reveal and the free area's edge, px. */
  gapPx: 14,
  edgePx: 12,
  /** Crossfade to the next item every … ms (the crossfade itself uses --duration-sheet). */
  intervalMs: 1800,
  /** At most this many items per reveal. */
  maxItems: 6,
};

export type RevealContent = {
  items: MediaAsset[];
  /** Name in the caption, e.g. "Tadapani". */
  title: string;
  /** Stops: "Day 4", in label caps like the name. */
  day?: string;
};

type Binding = { root: HTMLElement; button: HTMLElement; content: () => RevealContent | null };
type Box = { left: number; top: number; right: number; bottom: number };
type Side = "right" | "left" | "above" | "below";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = () => Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

/** The playable source of a video (local or UploadThing); YouTube-only clips show their poster. */
function videoSrc(asset: MediaAsset): string | null {
  if (asset.kind !== "video") return null;
  const source = asset.sources.find((s) => s.host !== "youtube");
  return source && "src" in source ? assetUrl(source.src) : null;
}

/** A still for any asset (image src or video poster). */
function stillSrc(asset: MediaAsset): string {
  return assetUrl(asset.kind === "image" ? asset.src : asset.poster);
}

/** Stop and unload a video, then drop the node. */
function releaseMedia(node: Element): void {
  if (node instanceof HTMLVideoElement) {
    node.pause();
    node.removeAttribute("src");
    node.load();
  }
  node.remove();
}

export class MediaReveal {
  private readonly host: HTMLElement;
  private readonly freeArea: () => Insets;
  private el: HTMLElement | null = null;
  private frame: HTMLElement | null = null;
  private caption: HTMLElement | null = null;
  private current: Binding | null = null;
  private items: MediaAsset[] = [];
  private index = 0;
  /** Stills only (reduced motion, Save-Data): no video. */
  private stillsOnly = false;
  private slot: HTMLElement | null = null;
  private intentTimer = 0;
  private holdTimer = 0;
  private cycleTimer = 0;
  private cleanupTimer = 0;
  private holdStart: { x: number; y: number } | null = null;
  /** A touch hold revealed. */
  private held = false;
  /** Swallow clicks until then (the release after a hold must not tap / navigate). */
  private swallowUntil = 0;
  private readonly onVisibility = () => {
    if (document.hidden) this.hide();
  };

  /**
   * @param host the positioned element the reveal is placed in (the map wrapper)
   * @param freeArea the host's covered edges (content peek, stepper), px
   */
  constructor(host: HTMLElement, freeArea: () => Insets) {
    this.host = host;
    this.freeArea = freeArea;
    document.addEventListener("visibilitychange", this.onVisibility);
  }

  /** Make a marker reveal its media. `content` is read on intent; null = nothing to show. */
  bind(root: HTMLElement, button: HTMLElement, content: () => RevealContent | null): void {
    const binding: Binding = { root, button, content };

    // Mouse / pen: hover with intent.
    button.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      window.clearTimeout(this.intentTimer);
      if (!this.preload(binding)) return;
      this.intentTimer = window.setTimeout(() => this.show(binding), REVEAL.intentMs);
    });
    button.addEventListener("pointerleave", (e) => {
      if (e.pointerType !== "touch") this.leave(binding);
    });

    // Touch: press and hold; release ends it. Touch pointers are implicitly captured by the button,
    // so moves and the release arrive here even if the finger drifts off it.
    button.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      this.cancelHold();
      this.held = false;
      if (!this.preload(binding)) return;
      this.holdStart = { x: e.clientX, y: e.clientY };
      this.holdTimer = window.setTimeout(() => {
        this.held = true;
        this.show(binding);
      }, REVEAL.holdMs);
    });
    button.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "touch" || !this.holdStart || this.held) return;
      if (Math.hypot(e.clientX - this.holdStart.x, e.clientY - this.holdStart.y) > REVEAL.holdMovePx) this.cancelHold();
    });
    const release = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      if (this.held) this.swallowUntil = performance.now() + REVEAL.swallowClickMs;
      this.held = false;
      this.cancelHold();
      this.leave(binding);
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);

    // A hold must not also be a tap: catch its click before the marker's own handler.
    root.addEventListener(
      "click",
      (e) => {
        if (performance.now() > this.swallowUntil) return;
        this.swallowUntil = 0;
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      { capture: true },
    );
    // Nor open the system's long-press menu.
    root.addEventListener("contextmenu", (e) => {
      if (this.holdStart || this.held) e.preventDefault();
    });
  }

  /** Fade out now (camera moved, state changed, page scrolled, tab hidden). */
  hide(): void {
    window.clearTimeout(this.intentTimer);
    this.cancelHold();
    if (!this.current) return;
    this.current = null;
    window.clearTimeout(this.cycleTimer);
    this.el?.classList.remove("is-shown");
    window.clearTimeout(this.cleanupTimer);
    this.cleanupTimer = window.setTimeout(() => this.release(), readDurationMs("--duration-ui") + 50);
  }

  destroy(): void {
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.hide();
    window.clearTimeout(this.cleanupTimer);
    this.release();
    this.el?.remove();
    this.el = null;
  }

  /* -------------------------------------------------------------- intent */

  private leave(binding: Binding): void {
    window.clearTimeout(this.intentTimer);
    if (this.current === binding) this.hide();
  }

  private cancelHold(): void {
    window.clearTimeout(this.holdTimer);
    this.holdStart = null;
  }

  /** Warm the cache for the first stills, only once there is intent. False: nothing to reveal. */
  private preload(binding: Binding): boolean {
    const content = binding.content();
    if (!content || content.items.length === 0) return false;
    for (const asset of content.items.slice(0, 2)) new Image().src = stillSrc(asset);
    return true;
  }

  /* ---------------------------------------------------------------- show */

  private show(binding: Binding): void {
    const content = binding.content();
    if (!content || content.items.length === 0) return;
    // Always start fresh: drop whatever another (or a fading) reveal still holds.
    window.clearTimeout(this.cleanupTimer);
    this.release();

    const el = this.ensureElement();
    const reduced = prefersReducedMotion();
    if (!this.place(binding)) {
      el.classList.remove("is-shown");
      return; // no room anywhere for a useful size
    }
    this.current = binding;
    this.stillsOnly = reduced || saveData();
    this.items = content.items.slice(0, reduced ? 1 : REVEAL.maxItems);
    this.index = 0;
    el.classList.toggle("is-still", reduced);
    this.renderCaption(content);
    this.showItem(0, true);

    // Flush the hidden state so the scale-in / fade transitions run (see map.css).
    void el.offsetWidth;
    el.classList.add("is-shown");
    this.scheduleNext();
  }

  private ensureElement(): HTMLElement {
    if (this.el) return this.el;
    const el = document.createElement("div");
    el.className = "nbt-reveal";
    el.setAttribute("aria-hidden", "true");
    this.frame = document.createElement("div");
    this.frame.className = "nbt-reveal__frame";
    this.caption = document.createElement("div");
    this.caption.className = "nbt-reveal__caption";
    el.append(this.frame, this.caption);
    // Above the markers, below the map controls and hint (z-index in map.css).
    this.host.insertBefore(el, this.host.querySelector(".nbt-map__controls"));
    this.el = el;
    return el;
  }

  private renderCaption(content: RevealContent): void {
    const caption = this.caption!;
    caption.textContent = "";
    if (content.day) {
      const day = document.createElement("span");
      day.className = "nbt-reveal__day";
      day.textContent = content.day;
      caption.appendChild(day);
    }
    const name = document.createElement("span");
    name.className = "nbt-reveal__name";
    name.textContent = content.title;
    caption.appendChild(name);
  }

  /** The marker's visible extent (photo, stem, name, lens …) in host coordinates. */
  private markerBox(binding: Binding, host: DOMRect): Box {
    const box: Box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (const node of [binding.button, ...binding.root.querySelectorAll("*")]) {
      const r = node.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue; // hidden labels, <defs>
      box.left = Math.min(box.left, r.left - host.left);
      box.top = Math.min(box.top, r.top - host.top);
      box.right = Math.max(box.right, r.right - host.left);
      box.bottom = Math.max(box.bottom, r.bottom - host.top);
    }
    return box;
  }

  /**
   * Beside the marker, on the side with the most room; shrunk if the room is tight.
   * False when even REVEAL.minLongSidePx doesn't fit anywhere.
   */
  private place(binding: Binding): boolean {
    const host = this.host.getBoundingClientRect();
    const mk = this.markerBox(binding, host);
    if (!Number.isFinite(mk.left)) return false;
    const pad = this.freeArea();
    // The control column (zoom / reset) at the right edge, when it shows anything.
    const controls = this.host.querySelector(".nbt-map__controls")?.getBoundingClientRect();
    const controlsInset = controls && controls.width > 0 ? host.right - controls.left : 0;
    const free: Box = {
      left: pad.left + REVEAL.edgePx,
      top: pad.top + REVEAL.edgePx,
      right: host.width - Math.max(pad.right, controlsInset) - REVEAL.edgePx,
      bottom: host.height - pad.bottom - REVEAL.edgePx,
    };
    const [minLong, maxLong] = REVEAL.longSidePx;
    const w = Math.min(maxLong, Math.max(minLong, host.width * REVEAL.longSideShare));
    const h = w / REVEAL.aspect;
    const gap = REVEAL.gapPx;
    const freeW = free.right - free.left;
    const freeH = free.bottom - free.top;

    // How much of the full size fits on each side (1 = all of it). Ties keep the earlier side.
    const sides: { side: Side; fit: number }[] = [
      { side: "right", fit: Math.min((free.right - mk.right - gap) / w, freeH / h) },
      { side: "left", fit: Math.min((mk.left - gap - free.left) / w, freeH / h) },
      { side: "above", fit: Math.min((mk.top - gap - free.top) / h, freeW / w) },
      { side: "below", fit: Math.min((free.bottom - mk.bottom - gap) / h, freeW / w) },
    ];
    const best = sides.reduce((a, b) => (b.fit > a.fit + 0.02 ? b : a));
    const scale = Math.min(1, best.fit);
    if (scale * w < REVEAL.minLongSidePx) return false;
    const bw = w * scale;
    const bh = h * scale;
    const cx = (mk.left + mk.right) / 2;
    const cy = (mk.top + mk.bottom) / 2;
    const clampX = (x: number) => Math.min(Math.max(x, free.left), free.right - bw);
    const clampY = (y: number) => Math.min(Math.max(y, free.top), free.bottom - bh);

    const [x, y] =
      best.side === "right" ? [mk.right + gap, clampY(cy - bh / 2)]
      : best.side === "left" ? [mk.left - gap - bw, clampY(cy - bh / 2)]
      : best.side === "above" ? [clampX(cx - bw / 2), mk.top - gap - bh]
      : [clampX(cx - bw / 2), mk.bottom + gap];

    const el = this.el!;
    el.style.width = `${Math.round(bw)}px`;
    el.style.height = `${Math.round(bh)}px`;
    el.style.left = `${Math.round(x)}px`;
    el.style.top = `${Math.round(y)}px`;
    // The side the marker is on (for the scale-in origin and the caption's alignment).
    el.dataset.side = best.side;
    return true;
  }

  /* --------------------------------------------------------------- media */

  private scheduleNext(): void {
    window.clearTimeout(this.cycleTimer);
    if (this.items.length < 2 || !this.current) return;
    this.cycleTimer = window.setTimeout(() => {
      this.index = (this.index + 1) % this.items.length;
      this.showItem(this.index, false);
      const after = this.items[(this.index + 1) % this.items.length];
      if (after) new Image().src = stillSrc(after); // warm the one after
      this.scheduleNext();
    }, REVEAL.intervalMs);
  }

  /**
   * Put item `i` on top. The first one is simply there (the whole reveal fades in); later ones
   * crossfade in once decoded, and the one under them is released after the fade.
   */
  private showItem(i: number, first: boolean): void {
    const asset = this.items[i];
    const frame = this.frame;
    if (!asset || !frame) return;
    const src = this.stillsOnly ? null : videoSrc(asset);
    let node: HTMLImageElement | HTMLVideoElement;
    if (src) {
      const video = document.createElement("video");
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      video.poster = stillSrc(asset); // poster first, frames when they arrive
      video.src = src;
      node = video;
    } else {
      const img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      img.src = stillSrc(asset);
      if (asset.kind === "image" && asset.focal) {
        img.style.objectPosition = `${asset.focal[0] * 100}% ${asset.focal[1] * 100}%`;
      }
      node = img;
    }
    node.className = first ? "nbt-reveal__media is-current" : "nbt-reveal__media";
    frame.appendChild(node);
    if (node instanceof HTMLVideoElement) void node.play().catch(() => undefined);

    const previous = this.slot;
    this.slot = node;
    if (first) return;
    const swap = () => {
      if (this.slot !== node) return; // released or overtaken meanwhile
      void node.offsetWidth;
      node.classList.add("is-current");
      if (previous) {
        previous.classList.remove("is-current");
        window.setTimeout(() => releaseMedia(previous), readDurationMs("--duration-sheet") + 50);
      }
    };
    if (node instanceof HTMLImageElement) node.decode().then(swap, swap);
    else swap();
  }

  /** Remove all media (stopping and unloading videos). */
  private release(): void {
    window.clearTimeout(this.cycleTimer);
    if (this.frame) for (const child of [...this.frame.children]) releaseMedia(child);
    this.slot = null;
    this.items = [];
  }
}
