import type { ReactNode } from "react";
import { Link } from "react-router";
import { useInquiry } from "~/components/inquiry";
import { arrowLinkClasses, Button, Heading, inlineLinkClasses, LinkArrow } from "~/components/ui";
import { birdingGuide, getPlace, getTrip } from "~/content";
import type { BirdingDestination, SampleItinerary } from "~/content/types";
import { t } from "~/i18n";

const textLink = `inline-flex min-h-tap items-center ${inlineLinkClasses}`;

/**
 * "Birding in Nepal": the general guide page, rendered from `birdingGuide`. Plain long-form text, fully
 * readable without JavaScript; destinations link to their place pages and trips, itineraries open the
 * inquiry drawer.
 */
export function BirdingInNepalScreen() {
  const { why, destinations, itineraries, included, bestTime } = birdingGuide;

  return (
    <article className="mx-auto max-w-5xl space-y-24 px-gutter py-16 sm:px-gutter-lg md:space-y-36 md:py-28">
      <header className="space-y-6">
        <Heading level="h1" className="break-words">
          {birdingGuide.title}
        </Heading>
        {birdingGuide.intro.map((paragraph) => (
          <p key={paragraph} className="max-w-prose">
            {paragraph}
          </p>
        ))}
      </header>

      <GuideSection id="why-nepal" heading={why.heading}>
        {why.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>{why.highlightsIntro}</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-accent">
          {why.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection id="destinations" heading={destinations.heading}>
        <ul className="space-y-14">
          {destinations.items.map((destination) => (
            <li key={destination.id}>
              <Destination destination={destination} />
            </li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection id="itineraries" heading={itineraries.heading}>
        <ul className="space-y-14">
          {itineraries.items.map((itinerary) => (
            <li key={itinerary.id}>
              <Itinerary itinerary={itinerary} />
            </li>
          ))}
        </ul>
        <div className="mt-14 bg-bg-raised p-6 md:p-8">
          <Itinerary itinerary={itineraries.custom} primary />
        </div>
      </GuideSection>

      <GuideSection id="included" heading={included.heading}>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-accent">
          {included.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection id="best-time" heading={bestTime.heading}>
        {bestTime.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </GuideSection>
    </article>
  );
}

/** A titled section: heading above the text on phones, beside it from lg. Each is an anchor. */
function GuideSection({ id, heading, children }: { id: string; heading: string; children: ReactNode }) {
  const headingId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="grid scroll-mt-header gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16"
    >
      <Heading level="h2" id={headingId} className="break-words">
        {heading}
      </Heading>
      <div className="max-w-prose space-y-5">{children}</div>
    </section>
  );
}

function Destination({ destination }: { destination: BirdingDestination }) {
  const places = (destination.placeIds ?? []).flatMap((id) => getPlace(id) ?? []);
  const trips = (destination.tripSlugs ?? []).flatMap((slug) => getTrip(slug) ?? []);

  return (
    <div id={destination.id} className="scroll-mt-header space-y-4">
      <Heading level="h3">{destination.name}</Heading>
      <p>{destination.body}</p>
      {places.length > 0 && (
        <LinkRow label={t("birdingGuide.seeOnMap")}>
          {places.map((place) => (
            <li key={place.id}>
              <Link to={`/places/${place.id}`} className={textLink}>
                {place.name}
              </Link>
            </li>
          ))}
        </LinkRow>
      )}
      {trips.length > 0 && (
        <LinkRow label={t("birdingGuide.tripsHere")}>
          {trips.map((trip) => (
            <li key={trip.slug}>
              <Link to={`/trips/${trip.slug}`} className={textLink}>
                {trip.title}
              </Link>
            </li>
          ))}
        </LinkRow>
      )}
    </div>
  );
}

function LinkRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="eyebrow text-fg-muted">{label}</h4>
      <ul className="flex flex-wrap gap-x-5">{children}</ul>
    </div>
  );
}

/** A sample itinerary (text only, no map trip); "Ask about this" opens the inquiry drawer. */
function Itinerary({ itinerary, primary = false }: { itinerary: SampleItinerary; primary?: boolean }) {
  const { openInquiry } = useInquiry();
  const titleId = `${itinerary.id}-title`;

  return (
    <div id={itinerary.id} className="scroll-mt-header space-y-4">
      <Heading level="h3" id={titleId}>
        {itinerary.title}
      </Heading>
      <p>{itinerary.body}</p>
      {/* Only the custom trip gets a full button; the samples ask quietly, so the page isn't a wall of buttons. */}
      {primary ? (
        <Button className="w-full md:w-auto" aria-describedby={titleId} onClick={() => openInquiry()}>
          {t("birdingGuide.ask")}
        </Button>
      ) : (
        <button type="button" className={arrowLinkClasses} aria-describedby={titleId} onClick={() => openInquiry()}>
          <span>{t("birdingGuide.ask")}</span>
          <LinkArrow />
        </button>
      )}
    </div>
  );
}
