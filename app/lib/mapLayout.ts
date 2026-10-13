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
  /** Home: share of the screen the home content (trip cards first) covers, phones / desktop. */
  homePeekPhone: 0.44,
  homePeekDesktop: 0.2,
  /** Trip / place: share of the screen the story's first lines cover, phones / desktop. */
  storyPeekPhone: 0.26,
  storyPeekDesktop: 0.16,
  /** Trip pages: room kept free above the peek for the stop stepper, rem. */
  stepperRem: 4.5,
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
  return { top: 0, right: 0, bottom: hidden + share * screenH + stepper, left: 0 };
}
