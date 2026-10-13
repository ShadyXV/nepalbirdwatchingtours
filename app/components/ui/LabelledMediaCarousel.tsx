import { Carousel } from "../media/Carousel";
import { MediaFrame } from "../media/MediaFrame";
import type { MediaAsset } from "~/content/types";
import { FieldLabel } from "./FieldLabel";

type LabelledMediaCarouselProps = {
  /** Accessible name, e.g. "Photos of Everest". */
  label: string;
  items: MediaAsset[];
  aspect?: string;
  slideClassName?: string;
  bleed?: boolean;
  className?: string;
};

/**
 * A media carousel that puts each photo's field label (from its `observation`) beneath it.
 * Like `MediaCarousel`, but with captions; renders nothing for an empty list.
 */
export function LabelledMediaCarousel({ label, items, aspect = "3 / 2", slideClassName, bleed, className }: LabelledMediaCarouselProps) {
  if (items.length === 0) return null;
  return (
    <Carousel label={label} slideClassName={slideClassName} bleed={bleed} className={className}>
      {items.map((asset, i) => (
        <figure key={i}>
          <MediaFrame asset={asset} aspect={aspect} className="rounded-card" />
          <figcaption className="mt-2 space-y-1">
            <FieldLabel as="div" observation={asset.observation} />
            {asset.credit && <p className="not-italic text-small text-fg-muted">{asset.credit}</p>}
          </figcaption>
        </figure>
      ))}
    </Carousel>
  );
}
