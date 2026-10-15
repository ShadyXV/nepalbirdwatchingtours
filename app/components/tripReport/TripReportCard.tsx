import { Link } from "react-router";
import { MediaFrame } from "~/components/media";
import { Heading } from "~/components/ui";
import { getTrip } from "~/content";
import type { TripReport } from "~/content/types";
import { formatDate } from "~/lib/format";

/** A trip report as a card: cover, date, title and the trip it was. The whole card links to the report. */
export function TripReportCard({ report }: { report: TripReport }) {
  const trip = getTrip(report.tripSlug);
  return (
    <Link to={`/trip-reports/${report.slug}`} className="group block">
      <MediaFrame asset={report.cover} className="rounded-card" />
      <p className="accent mt-4 text-[1.125rem] text-fg-muted">{formatDate(report.date)}</p>
      <Heading level="h3" as="h3" className="mt-1 group-hover:text-accent">
        {report.title}
      </Heading>
      {trip && <p className="eyebrow mt-2 text-fg-muted">{trip.title}</p>}
    </Link>
  );
}
