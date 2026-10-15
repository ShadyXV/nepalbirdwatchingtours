import { Link } from "react-router";
import { getTrip } from "~/content";
import type { Review } from "~/content/types";
import { t } from "~/i18n";
import { formatMonthYear } from "~/lib/format";
import { assetUrl } from "~/lib/site";

/**
 * A guest's review, kept simple: their words, a small round photo, their name, and the trip they
 * went on (linked). No ratings, no large photos. Used on home and on /reviews/.
 */
export function ReviewCard({ review, className = "" }: { review: Review; className?: string }) {
  const trip = review.tripSlug ? getTrip(review.tripSlug) : undefined;
  const byline = [review.author, review.country].filter(Boolean).join(", ");
  const { avatar } = review;

  return (
    <figure className={`flex h-full flex-col gap-5 ${className}`}>
      <blockquote className="flex-1">
        <p>{review.text}</p>
      </blockquote>
      <figcaption className="flex items-center gap-3">
        {avatar ? (
          <img
            src={assetUrl(avatar.src)}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-12 shrink-0 rounded-full bg-bg-raised object-cover"
            style={avatar.focal ? { objectPosition: `${avatar.focal[0] * 100}% ${avatar.focal[1] * 100}%` } : undefined}
          />
        ) : (
          <span aria-hidden="true" className="size-12 shrink-0 rounded-full bg-bg-raised" />
        )}
        <div className="min-w-0 font-mono">
          <p className="not-italic text-fg">{byline}</p>
          <p className="not-italic text-small text-fg-muted">
            {trip ? (
              <Link to={`/trips/${trip.slug}`} className="text-accent underline hover:text-fg">
                {t("review.trip", { trip: trip.title })}
              </Link>
            ) : null}
            {trip ? ", " : null}
            {formatMonthYear(review.date)}
          </p>
          {review.source.url && (
            <a
              href={review.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-small text-fg-muted underline hover:text-accent"
            >
              {t("review.source", { source: review.source.name })}
            </a>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
