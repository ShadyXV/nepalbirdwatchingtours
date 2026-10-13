import type { MediaAsset } from "~/content/types";
import { t } from "~/i18n";
import { assetUrl } from "~/lib/site";

type MediaFrameProps = {
  asset: MediaAsset;
  /** CSS aspect-ratio value; landscape 3:2 by default. */
  aspect?: string;
  className?: string;
};

/**
 * A landscape frame for an image, or for a video's poster (with a "Video" badge;
 * playback comes in a later phase). Lazy-loaded; honours the asset's focal point.
 */
export function MediaFrame({ asset, aspect = "3 / 2", className = "" }: MediaFrameProps) {
  const src = asset.kind === "image" ? asset.src : asset.poster;
  const focal = asset.kind === "image" ? asset.focal : undefined;
  return (
    <div className={`relative overflow-hidden bg-bg-raised ${className}`} style={{ aspectRatio: aspect }}>
      <img
        src={assetUrl(src)}
        alt={asset.alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="size-full object-cover"
        style={focal ? { objectPosition: `${focal[0] * 100}% ${focal[1] * 100}%` } : undefined}
      />
      {asset.kind === "video" && (
        <span className="eyebrow absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-button bg-scrim px-2 py-1 text-fg">
          <svg aria-hidden="true" viewBox="0 0 10 10" className="size-2.5 fill-current">
            <path d="M2 1l7 4-7 4z" />
          </svg>
          {t("media.video")}
        </span>
      )}
    </div>
  );
}
