import { MediaFrame } from "~/components/media";
import { FieldLabel } from "~/components/ui";
import type { ImageAsset, TripReportBlock } from "~/content/types";

/** A trip report's story, block by block: paragraphs, a single photo, or a small gallery. */
export function ReportBody({ blocks }: { blocks: TripReportBlock[] }) {
  return (
    <div className="space-y-10">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "text":
            return (
              <div key={i} className="max-w-prose space-y-4">
                {block.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            );
          case "image":
            return <SinglePhoto key={i} image={block.image} caption={block.caption} />;
          case "gallery":
            return <Gallery key={i} images={block.images} caption={block.caption} />;
        }
      })}
    </div>
  );
}

const isPortrait = (image: ImageAsset) => Boolean(image.width && image.height && image.height > image.width);

/** One photo: landscape at full width, portrait narrower so it never fills the screen. */
function SinglePhoto({ image, caption }: { image: ImageAsset; caption?: string }) {
  const portrait = isPortrait(image);
  return (
    <figure className={portrait ? "max-w-md" : undefined}>
      <MediaFrame asset={image} aspect={portrait ? "4 / 5" : "3 / 2"} className="rounded-card" />
      <figcaption className="mt-3 space-y-1">
        <FieldLabel observation={image.observation} />
        {caption && <p className="text-small text-fg-muted">{caption}</p>}
      </figcaption>
    </figure>
  );
}

/** Two to four photos side by side (two per row on phones), each with its field label. */
function Gallery({ images, caption }: { images: ImageAsset[]; caption?: string }) {
  const columns = images.length >= 3 ? "md:grid-cols-3" : "";
  return (
    <figure>
      <ul className={`grid grid-cols-2 gap-3 ${columns}`}>
        {images.map((image) => (
          <li key={image.src}>
            <MediaFrame asset={image} aspect="1 / 1" className="rounded-card" />
            <FieldLabel observation={image.observation} variant="compact" className="mt-2" />
          </li>
        ))}
      </ul>
      {caption && <figcaption className="mt-3 text-small text-fg-muted">{caption}</figcaption>}
    </figure>
  );
}
