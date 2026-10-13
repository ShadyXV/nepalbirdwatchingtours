/**
 * JS access to the design tokens, for code that cannot use CSS classes
 * (the MapLibre style, canvas, SVG generated in JS).
 *
 * `tokens.css` is the SOURCE OF TRUTH. `TOKEN_FALLBACKS` below mirrors the
 * same values side by side, so SSR / prerender never touches `window` and the
 * map still gets sane colours before styles load. When you change a value in
 * tokens.css, change it here too.
 */
export const TOKEN_FALLBACKS = {
  // raw palette
  "--color-night": "#0d1210",
  "--color-surface": "#18211d",
  "--color-snow": "#eef4f1",
  "--color-mist": "#9aa8a2",
  "--color-line": "#3fb8ae",
  "--color-monal": "#c9803f",
  "--color-violet": "#7d6bc4",
  "--color-rhodo": "#c8323c",
  "--color-forest": "#2f5d46",
  "--color-ochre": "#b8934a",
  // semantic roles (resolved to the raw values above)
  "--color-bg": "#0d1210",
  "--color-bg-raised": "#18211d",
  "--color-fg": "#eef4f1",
  "--color-fg-muted": "#9aa8a2",
  "--color-accent": "#c9803f",
  "--color-accent-fg": "#0d1210",
  "--color-route": "#3fb8ae",
  "--color-route-alt": "#7d6bc4",
  "--color-marker": "#c8323c",
  "--color-feature": "#2f5d46",
  "--color-ridge": "#b8934a",
  "--color-focus": "#3fb8ae",
  // fonts
  "--font-display": '"Anton", "Impact", "Haettenschweiler", "Arial Narrow Bold", sans-serif',
  "--font-mono": '"DM Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  "--font-accent": '"Fraunces Variable", "Iowan Old Style", Georgia, serif',
  // motion
  "--ease-sheet": "cubic-bezier(0.22, 1, 0.36, 1)",
  "--ease-out": "cubic-bezier(0.16, 1, 0.3, 1)",
  "--duration-micro": "150ms",
  "--duration-ui": "250ms",
  "--duration-sheet": "700ms",
  "--duration-map": "900ms",
  "--duration-stagger": "70ms",
  // map (tokens.css group 4)
  "--color-map-terai": "#34432c",
  "--color-map-lowland": "#3a4a2e",
  "--color-map-hills": "#4f5a36",
  "--color-map-midhills": "#6a6a3f",
  "--color-map-ridge": "#96834f",
  "--color-map-alpine": "#ab8a5f",
  "--color-map-rock": "#a5806c",
  "--color-map-scree": "#c9b2a2",
  "--color-map-snow": "#f3eadf",
  "--color-map-light": "#ffd29a",
  "--color-map-sun-dawn": "#ffd0a0",
  "--color-map-sun-sunset": "#ffb465",
  "--color-map-shade": "#2a2650",
  "--color-map-skylight": "#9db3d8",
  "--color-map-outside": "#111714",
  "--color-map-haze": "#3a312b",
  "--color-map-horizon-dawn": "#5b4650",
  "--color-map-horizon-sunset": "#6b4a30",
  "--ease-map": "cubic-bezier(0.6, 0, 0.25, 1)",
  "--ease-pop": "cubic-bezier(0.34, 1.7, 0.6, 1)",
  "--duration-map-flight": "2600ms",
  "--duration-map-return": "2200ms",
  "--duration-route-draw": "1400ms",
  "--duration-pop": "520ms",
  "--duration-map-step": "1400ms",
  "--duration-tour-glide": "2400ms",
  "--duration-tour-dwell": "2600ms",
  "--duration-soft-edge": "700ms",
} as const;

export type TokenName = keyof typeof TOKEN_FALLBACKS;

/**
 * Read a token's current value from the CSS custom property (client only).
 * On the server, before hydration, or if the property is missing, returns `fallback`.
 */
export function readToken(name: TokenName, fallback: string = TOKEN_FALLBACKS[name]): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** A duration token in milliseconds, e.g. readDurationMs("--duration-map") === 900. */
export function readDurationMs(name: Extract<TokenName, `--duration-${string}`>): number {
  const raw = readToken(name);
  const ms = Number.parseFloat(raw);
  return raw.endsWith("ms") ? ms : ms * 1000;
}
