import { MediaFrame } from "~/components/media";
import { ReviewCard } from "~/components/reviews";
import { GroupPhotoStrip, ReportBody, SpeciesChecklist } from "~/components/tripReport";
import { ArrowLink, FieldLabel, Heading, SectionTitle } from "~/components/ui";
import { getReview, getTrip } from "~/content";
import type { TripReport } from "~/content/types";
import { t } from "~/i18n";
import { formatDate } from "~/lib/format";

/**
 * /trip-reports/<slug>/: a blog-style page about one past departure. Title and date, the cover,
 * Krishna's story with photos, the group, what we saw, and the guests' review if they left one.
 */
export function TripReportScreen({ report }: { report: TripReport }) {
  const trip = getTrip(report.tripSlug);
  const review = report.reviewId ? getReview(report.reviewId) : undefined;
  const seenCount = new Set(report.seen).size;

  return (
    <article className="mx-auto max-w-4xl space-y-20 px-gutter py-16 sm:px-gutter-lg md:space-y-32 md:py-28">
      <header className="space-y-6">
        <p className="accent text-[1.25rem] text-fg-muted">
          <time dateTime={report.date}>{formatDate(report.date)}</time>
          {report.guests && <> {t("tripReport.with", { guests: report.guests })}</>}
        </p>
        <Heading level="h1" className="break-words">
          {report.title}
        </Heading>
        <p className="max-w-prose">{report.summary}</p>
      </header>

      <figure>
        <MediaFrame asset={report.cover} />
        <FieldLabel as="figcaption" observation={report.cover.observation} className="mt-4" />
      </figure>

      <ReportBody blocks={report.body} />

      {report.groupPhotos.length > 0 && (
        <section aria-labelledby="report-group" className="space-y-10">
          <SectionTitle id="report-group">{t("tripReport.group")}</SectionTitle>
          <GroupPhotoStrip photos={report.groupPhotos} />
        </section>
      )}

      {report.seen.length > 0 && (
        <section id="seen" aria-labelledby="report-seen" className="space-y-10">
          <SectionTitle id="report-seen">
            {t("tripReport.seen")} <span className="text-fg-muted">{seenCount}</span>
          </SectionTitle>
          <SpeciesChecklist speciesIds={report.seen} />
        </section>
      )}

      {review && (
        <section aria-labelledby="report-review" className="space-y-10">
          <SectionTitle id="report-review">{t("tripReport.review")}</SectionTitle>
          <ReviewCard review={review} showSource className="max-w-prose" />
        </section>
      )}

      {trip && (
        <ArrowLink to={`/trips/${trip.slug}`}>
          {t("tripReport.viewTrip")}: {trip.title}
        </ArrowLink>
      )}
    </article>
  );
}
