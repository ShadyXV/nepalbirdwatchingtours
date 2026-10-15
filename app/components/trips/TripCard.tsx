import type { ElementType } from "react";
import { Link } from "react-router";
import { MediaFrame } from "~/components/media";
import { Heading } from "~/components/ui";
import { speciesCountForTrip } from "~/content";
import type { Trip } from "~/content/types";
import { t } from "~/i18n";

type TripCardProps = {
  trip: Trip;
  /** Heading tag for the trip's title (the visual size stays the same). */
  headingAs?: ElementType;
  /**
   * Hover / keyboard focus on the card: called with the trip's slug, then with null on leave.
   * Region pages use it to highlight the trip's route on the map.
   */
  onPreview?: (slug: string | null) => void;
};

/** A trip as a card: cover, name, tagline, and one quiet line of facts (days, highest point, birds). */
export function TripCard({ trip, headingAs = "h2", onPreview }: TripCardProps) {
  const facts = [
    trip.durationDays === 1 ? t("tripsPage.day") : t("tripsPage.days", { count: trip.durationDays }),
    `${trip.maxAltitudeM.toLocaleString("en")} m`,
    t("tripsPage.birds", { count: speciesCountForTrip(trip, "bird") }),
  ];
  const preview = onPreview
    ? {
        onMouseEnter: () => onPreview(trip.slug),
        onMouseLeave: () => onPreview(null),
        onFocus: () => onPreview(trip.slug),
        onBlur: () => onPreview(null),
      }
    : undefined;

  return (
    <Link to={`/trips/${trip.slug}`} className="group block" {...preview}>
      <MediaFrame asset={trip.cover} />
      <Heading level="h3" as={headingAs} className="mt-5 transition-colors duration-(--duration-micro) group-hover:text-accent">
        {trip.title}
      </Heading>
      <p className="mt-3 text-fg-muted">{trip.tagline}</p>
      <p className="eyebrow mt-4 text-fg-muted">{facts.join(" · ")}</p>
    </Link>
  );
}
