import { ReviewCard } from "~/components/reviews";
import { Heading } from "~/components/ui";
import { getReviewsNewestFirst } from "~/content";
import { t } from "~/i18n";

/** /reviews/: every review, newest first, in the same calm style as on home: one column, two from md. */
export function ReviewsScreen() {
  const reviews = getReviewsNewestFirst();
  return (
    <div className="mx-auto max-w-5xl px-gutter py-16 sm:px-gutter-lg md:py-28">
      <header className="space-y-6">
        <Heading level="h1">{t("reviewsPage.heading")}</Heading>
        <p className="max-w-prose text-fg-muted">{t("reviewsPage.intro")}</p>
      </header>
      <ul className="mt-16 grid gap-20 md:mt-24 md:grid-cols-2 md:gap-x-16 md:gap-y-24">
        {reviews.map((review) => (
          <li key={review.id}>
            <ReviewCard review={review} showSource className="max-w-prose" />
          </li>
        ))}
      </ul>
    </div>
  );
}
