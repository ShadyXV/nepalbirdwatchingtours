import logoUrl from "~/design/brand/logo.svg";

/**
 * The brand mark: a monal in flight over the peaks (app/design/brand/logo.svg, traced from
 * logo-source.png). Drawn as a CSS mask filled with the current text colour, so it takes the
 * colour of its context (snow on night by default). Decorative: give the surrounding link or
 * text the accessible name. Size it by height; the width follows the artwork.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block aspect-[1180/878] bg-current forced-color-adjust-none ${className}`}
      style={{
        maskImage: `url(${logoUrl})`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
      }}
    />
  );
}
