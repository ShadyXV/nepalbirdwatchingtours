import { TERRAIN_TEXTURE_URL } from "~/lib/site";

/**
 * A static, decorative background: the night colour with the tiled contour texture over it.
 * Fills its nearest positioned ancestor; put it first, behind the content. Tokens: --texture-*.
 */
export function TerrainBackdrop({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 bg-bg ${className}`}>
      <div
        className="absolute inset-0 bg-repeat"
        style={{
          backgroundImage: `url(${TERRAIN_TEXTURE_URL})`,
          backgroundSize: "var(--texture-size)",
          opacity: "var(--texture-opacity)",
        }}
      />
    </div>
  );
}
