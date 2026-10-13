/**
 * Layout numbers shared by the map layout's CSS and the map camera, so the camera always frames
 * its subject in the part of the map the content does not cover. Change a value here and both
 * the CSS (via the custom properties from `mapLayoutCssVars`) and the camera padding follow.
 */
import type { Insets } from "./geo";

export const MAP_LAYOUT = {
  /** Trip / place pages on phones: share of the screen height the sheet covers before scrolling. */
  sheetPeek: 0.36,
  /** Home on phones: share of the screen the home content (trip cards first) covers. */
  homePeekPhone: 0.44,
  /** Home on desktop: the content only hints at itself below the map hero. */
  homePeekDesktop: 0.2,
  /** From this viewport width the trip/place sheet becomes a left column over the map. */
  columnFrom: 1024,
  /** Width of that column, rem. */
  columnRem: 30,
} as const;

/** "home" = map hero with content rising below; "sheet" = trip/place story over an explorable map. */
export type MapLayoutMode = "home" | "sheet";

/** CSS custom properties for the layout root (read by app/components/map/map.css). */
export function mapLayoutCssVars(): Record<string, string> {
  return {
    "--map-sheet-peek": `${MAP_LAYOUT.sheetPeek * 100}svh`,
    "--map-home-peek": `${MAP_LAYOUT.homePeekPhone * 100}svh`,
    "--map-home-peek-desktop": `${MAP_LAYOUT.homePeekDesktop * 100}svh`,
    "--map-column": `${MAP_LAYOUT.columnRem}rem`,
  };
}

/**
 * Camera padding for the map container in a given layout mode: the part of the map hidden by the
 * sheet / column / below the visible screen. Client only (reads window).
 */
export function mapInsets(mode: MapLayoutMode, container: HTMLElement): Insets {
  const rect = container.getBoundingClientRect();
  const screenH = window.innerHeight;
  const wide = window.innerWidth >= MAP_LAYOUT.columnFrom;
  // The map is taller than the visible screen (it is sized to the largest viewport so it never
  // resizes when mobile browser bars show / hide); the hidden strip counts as covered.
  const visibleBottom = Math.min(rect.height, screenH - Math.max(rect.top, 0));
  const hidden = Math.max(0, rect.height - visibleBottom);

  if (mode === "home") {
    const peek = (wide ? MAP_LAYOUT.homePeekDesktop : MAP_LAYOUT.homePeekPhone) * screenH;
    return { top: 0, right: 0, bottom: hidden + peek, left: 0 };
  }
  if (wide) {
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return { top: 0, right: 0, bottom: hidden, left: MAP_LAYOUT.columnRem * rem };
  }
  return { top: 0, right: 0, bottom: hidden + MAP_LAYOUT.sheetPeek * screenH, left: 0 };
}
