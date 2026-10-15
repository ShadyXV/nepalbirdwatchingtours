import { Link } from "react-router";
import { inlineLinkClasses } from "~/components/ui";
import { getTrip } from "~/content";
import type { Review } from "~/content/types";
import { t } from "~/i18n";
import { assetUrl } from "~/lib/site";

type ReviewCardProps = {
  review: Review;
  /** Show the quiet "Read it on TripAdvisor" link (on /reviews/ and trip reports, not on home). */
  showSource?: boolean;
  className?: string;
};

/**
 * A guest's review, kept calm: a small square photo, their name and country, the trip they went on,
 * then their words. No ratings, no dates, no underlines. Used on home, /reviews/ and trip reports.
 */
export function ReviewCard({ review, showSource = false, className = "" }: ReviewCardProps) {
  const trip = review.tripSlug ? getTrip(review.tripSlug) : undefined;
  const byline = [review.author, review.country].filter(Boolean).join(", ");
  const { avatar } = review;

  return (
    <figure className={`flex flex-col gap-6 ${className}`}>
      <figcaption className="flex items-start gap-4">
        {avatar ? (
          <img
            src={assetUrl(avatar.src)}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-14 shrink-0 bg-bg-raised object-cover"
            style={avatar.focal ? { objectPosition: `${avatar.focal[0] * 100}% ${avatar.focal[1] * 100}%` } : undefined}
          />
        ) : (
          <span aria-hidden="true" className="size-14 shrink-0 bg-bg-raised" />
        )}
        <div className="min-w-0 font-mono">
          <p className="not-italic text-fg">{byline}</p>
          {trip && (
            <p className="not-italic text-small">
              <Link to={`/trips/${trip.slug}`} className={inlineLinkClasses}>
                {t("review.trip", { trip: trip.title })}
              </Link>
            </p>
          )}
        </div>
      </figcaption>
      <blockquote>
        <p>{review.text}</p>
      </blockquote>
      {showSource && review.source.url && (
        <a
          href={review.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-small text-fg-muted transition-colors duration-(--duration-micro) hover:text-accent"
        >
          {t("review.source", { source: review.source.name })}
        </a>
      )}
    </figure>
  );
}
