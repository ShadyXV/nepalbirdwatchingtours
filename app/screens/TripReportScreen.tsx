import { Link } from "react-router";
import { MediaFrame } from "~/components/media";
import { ReviewCard } from "~/components/reviews";
import { GroupPhotoStrip, ReportBody, SpeciesChecklist } from "~/components/tripReport";
import { FieldLabel, Heading, SectionTitle } from "~/components/ui";
import { getReview, getTrip } from "~/content";
import type { TripReport } from "~/content/types";
import { t } from "~/i18n";
import { formatDate } from "~/lib/format";

const textLink = "eyebrow inline-flex min-h-tap items-center text-accent underline hover:text-fg";

/**
 * /trip-reports/<slug>/: a blog-style page about one past departure. Title and date, the cover,
 * Krishna's story with photos, the group, what we saw, and the guests' review if they left one.
 */
export function TripReportScreen({ report }: { report: TripReport }) {
  const trip = getTrip(report.tripSlug);
  const review = report.reviewId ? getReview(report.reviewId) : undefined;
  const seenCount = new Set(report.seen).size;

  return (
    <article className="mx-auto max-w-4xl space-y-14 px-gutter py-12 sm:px-gutter-lg md:space-y-20 md:py-20">
      <header className="space-y-5">
        <p className="accent text-[1.25rem] text-fg-muted">
          <time dateTime={report.date}>{formatDate(report.date)}</time>
          {report.guests && <> {t("tripReport.with", { guests: report.guests })}</>}
        </p>
        <Heading level="h1" className="break-words">
          {report.title}
        </Heading>
        {trip && (
          <p className="eyebrow text-fg-muted">
            {t("tripReport.trip")}:{" "}
            <Link to={`/trips/${trip.slug}`} className="text-accent underline hover:text-fg">
              {trip.title}
            </Link>
          </p>
        )}
        <p className="max-w-prose">{report.summary}</p>
      </header>

      <figure>
        <MediaFrame asset={report.cover} className="rounded-card" />
        <FieldLabel as="figcaption" observation={report.cover.observation} className="mt-3" />
      </figure>

      <ReportBody blocks={report.body} />

      {report.groupPhotos.length > 0 && (
        <section aria-labelledby="report-group" className="space-y-6">
          <SectionTitle id="report-group">{t("tripReport.group")}</SectionTitle>
          <GroupPhotoStrip photos={report.groupPhotos} />
        </section>
      )}

      {report.seen.length > 0 && (
        <section aria-labelledby="report-seen" className="space-y-8">
          <div>
            <SectionTitle id="report-seen">{t("tripReport.seen")}</SectionTitle>
            <p className="eyebrow mt-2 text-fg-muted">{t("tripReport.seenCount", { count: seenCount })}</p>
          </div>
          <SpeciesChecklist speciesIds={report.seen} />
        </section>
      )}

      {review && (
        <section aria-labelledby="report-review" className="space-y-6">
          <SectionTitle id="report-review">{t("tripReport.review")}</SectionTitle>
          <ReviewCard review={review} className="max-w-prose" />
        </section>
      )}

      {trip && (
        <Link to={`/trips/${trip.slug}`} className={textLink}>
          {t("tripReport.viewTrip")}: {trip.title}
        </Link>
      )}
    </article>
  );
}
