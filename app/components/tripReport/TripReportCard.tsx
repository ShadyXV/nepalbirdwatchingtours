import { Link } from "react-router";
import { MediaFrame } from "~/components/media";
import { Heading } from "~/components/ui";
import type { TripReport } from "~/content/types";
import { formatDate } from "~/lib/format";

/** A trip report as a card: cover, date and title. The whole card links to the report. */
export function TripReportCard({ report }: { report: TripReport }) {
  return (
    <Link to={`/trip-reports/${report.slug}`} className="group block">
      <MediaFrame asset={report.cover} />
      <p className="accent mt-5 text-[1.125rem] text-fg-muted">{formatDate(report.date)}</p>
      <Heading level="h3" as="h3" className="mt-1 transition-colors duration-(--duration-micro) group-hover:text-accent">
        {report.title}
      </Heading>
    </Link>
  );
}
