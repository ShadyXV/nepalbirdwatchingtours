import { Carousel, MediaFrame } from "~/components/media";
import type { ImageAsset } from "~/content/types";
import { t } from "~/i18n";

/** Photos of the group that went, as a swipeable strip. Renders nothing without photos. */
export function GroupPhotoStrip({ photos }: { photos: ImageAsset[] }) {
  if (photos.length === 0) return null;
  return (
    <Carousel label={t("tripReport.groupPhotos")} slideClassName="basis-[75%] sm:basis-[45%] lg:basis-[32%]">
      {photos.map((photo) => (
        <MediaFrame key={photo.src} asset={photo} aspect="4 / 3" />
      ))}
    </Carousel>
  );
}
