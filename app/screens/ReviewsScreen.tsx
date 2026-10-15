import { ReviewCard } from "~/components/reviews";
import { Heading } from "~/components/ui";
import { getReviewsNewestFirst } from "~/content";
import { t } from "~/i18n";

/** /reviews/: every review, newest first, in the same simple style as on home. */
export function ReviewsScreen() {
  const reviews = getReviewsNewestFirst();
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-gutter py-12 sm:px-gutter-lg md:py-20">
      <header className="space-y-4">
        <Heading level="h1">{t("reviewsPage.heading")}</Heading>
        <p className="max-w-prose text-fg-muted">{t("reviewsPage.intro")}</p>
      </header>
      <ul>
        {reviews.map((review) => (
          <li key={review.id} className="border-t border-border py-10 first:border-t-0 first:pt-0">
            <ReviewCard review={review} />
          </li>
        ))}
      </ul>
    </div>
  );
}
