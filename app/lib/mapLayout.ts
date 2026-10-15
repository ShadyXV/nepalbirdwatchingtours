/**
 * Layout numbers shared by the map layout's CSS and the map camera, so the camera always frames
 * its subject in the part of the map the UI does not cover. Change a value here and both the CSS
 * (via the custom properties from `mapLayoutCssVars`) and the camera padding follow.
 *
 * Every map page has the same shape: the map fills the screen and the page content rises over it
 * as a dark sheet on scroll (home, trip, place). Trip pages add a small stop stepper on the map.
 */
import type { Insets } from "./geo";

export const MAP_LAYOUT = {
  /** Home: share of the screen the home content (its intro line and "Browse all trips") covers, phones / desktop. */
  homePeekPhone: 0.44,
  homePeekDesktop: 0.2,
  /** Trip / place: share of the screen the story's first lines cover, phones / desktop. */
  storyPeekPhone: 0.26,
  storyPeekDesktop: 0.16,
  /**
   * Trip pages: room kept free above the peek (map controls, the story button on the seam), rem.
   * "Start the journey" sits a little higher, clear of the sheet's soft edge (navigator.css).
   */
  stepperRem: 4,
  /** Trip pages: room kept free at the top of the map for the stepper pill, rem. */
  navigatorTopRem: 4,
  /** From this viewport width: desktop layout. */
  desktopFrom: 1024,
} as const;

export type MapLayoutMode = "home" | "trip" | "place";

/** CSS custom properties for the layout root (read by app/components/map/layout.css). */
export function mapLayoutCssVars(): Record<string, string> {
  return {
    "--map-home-peek": `${MAP_LAYOUT.homePeekPhone * 100}svh`,
    "--map-home-peek-desktop": `${MAP_LAYOUT.homePeekDesktop * 100}svh`,
    "--map-story-peek": `${MAP_LAYOUT.storyPeekPhone * 100}svh`,
    "--map-story-peek-desktop": `${MAP_LAYOUT.storyPeekDesktop * 100}svh`,
    "--map-stepper": `${MAP_LAYOUT.stepperRem}rem`,
  };
}

/**
 * Camera padding for the map container: the part of the map covered by the content peek, the
 * stepper, or hidden below the visible screen. Client only (reads window).
 */
export function mapInsets(mode: MapLayoutMode, container: HTMLElement): Insets {
  const rect = container.getBoundingClientRect();
  const screenH = window.innerHeight;
  const wide = window.innerWidth >= MAP_LAYOUT.desktopFrom;
  const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  // The map is taller than the visible screen (it is sized to the largest viewport so it never
  // resizes when mobile browser bars show / hide); the hidden strip counts as covered.
  const visibleBottom = Math.min(rect.height, screenH - Math.max(rect.top, 0));
  const hidden = Math.max(0, rect.height - visibleBottom);

  const share =
    mode === "home"
      ? wide ? MAP_LAYOUT.homePeekDesktop : MAP_LAYOUT.homePeekPhone
      : wide ? MAP_LAYOUT.storyPeekDesktop : MAP_LAYOUT.storyPeekPhone;
  const stepper = mode === "trip" ? MAP_LAYOUT.stepperRem * rem : 0;
  const top = mode === "trip" ? MAP_LAYOUT.navigatorTopRem * rem : 0;
  return { top, right: 0, bottom: hidden + share * screenH + stepper, left: 0 };
}

/**
 * The trip's day view ("the journey", docs/JOURNEY.md): the map fills the whole screen. The camera
 * fits the day's walk into this clear band (shares of the screen); the day's photos, headline and
 * birds are then laid out around where the walk really sits (components/journey/dayLayout.ts), and
 * this band is also that pass's first guess while the camera is still moving.
 *
 *   desktop  the walk runs up a column at x 34–60 %: photo A and the birds on its left, the
 *            headline and photo B on its right
 *   phones   the walk runs up the middle band, y 36–70 %: photo A and the headline above it, the
 *            birds and photo B below
 */
export const DAY_LAYOUT = {
  desktop: { top: 0.16, right: 0.4, bottom: 0.14, left: 0.34 },
  phone: { top: 0.36, right: 0.1, bottom: 0.3, left: 0.1 },
} as const;

/** Camera padding for the day view (client only): the map container fills the screen there. */
export function dayInsets(container: HTMLElement): Insets {
  const w = container.clientWidth;
  const h = Math.min(container.clientHeight, window.innerHeight);
  const hidden = Math.max(0, container.clientHeight - h);
  const s = window.innerWidth >= MAP_LAYOUT.desktopFrom ? DAY_LAYOUT.desktop : DAY_LAYOUT.phone;
  return { top: s.top * h, right: s.right * w, bottom: s.bottom * h + hidden, left: s.left * w };
}
