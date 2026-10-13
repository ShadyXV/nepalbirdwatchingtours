import { useRef } from "react";
import { Link } from "react-router";
import { useInquiry } from "~/components/inquiry";
import { useMapLayoutContext } from "~/components/map/layoutContext";
import { Carousel, MediaFrame } from "~/components/media";
import { Button, Heading } from "~/components/ui";
import { getPublishedTrips, getReviews, guide, speciesCountForTrip } from "~/content";
import { t } from "~/i18n";
import { assetUrl } from "~/lib/site";
import { useCarouselPreview } from "~/lib/useCarouselPreview";

const services = ["lead", "day", "trek"] as const;

export function HomeScreen() {
  const { openInquiry } = useInquiry();
  const trips = getPublishedTrips();
  const reviews = getReviews();
  // The trip card in view raises its pin on the map (and on phones the camera follows swipes).
  const { previewTrip } = useMapLayoutContext();
  const tripCards = useRef<HTMLDivElement>(null);
  useCarouselPreview(tripCards, previewTrip);

  return (
    <div className="mx-auto max-w-5xl space-y-16 px-gutter py-12 sm:px-gutter-lg md:space-y-24 md:py-20">
      <section id="trips" className="scroll-mt-20">
        <Heading level="h2">{t("home.tripsHeading")}</Heading>
        <p className="mt-3 max-w-prose text-fg-muted">{t("home.tripsIntro")}</p>
        <div ref={tripCards}>
          <Carousel label={t("home.tripsHeading")} className="mt-6">
            {trips.map((trip) => (
              <Link
                key={trip.slug}
                to={`/trips/${trip.slug}`}
                data-trip-slug={trip.slug}
                className="block h-full overflow-hidden rounded-card bg-bg-raised shadow-card transition-colors duration-(--duration-ui) hover:bg-feature/40"
              >
                <MediaFrame asset={trip.cover} />
                <div className="p-4">
                  <Heading level="h3">{trip.title}</Heading>
                  <p className="mt-2 text-small text-fg-muted">{trip.tagline}</p>
                  <p className="eyebrow mt-4 text-accent">{t("home.birds", { count: speciesCountForTrip(trip, "bird") })}</p>
                </div>
              </Link>
            ))}
          </Carousel>
        </div>
      </section>

      <section className="grid items-center gap-8 md:grid-cols-[16rem_1fr] md:gap-12">
        <img
          src={assetUrl(guide.portrait.src)}
          alt={guide.portrait.alt}
          loading="lazy"
          decoding="async"
          className="aspect-[3/2] w-full rounded-card object-cover md:aspect-square"
        />
        <div>
          <Heading level="h2">{t("home.introHeading")}</Heading>
          <p className="mt-4 max-w-prose">{guide.bio[0]}</p>
          <Link to="/about" className="eyebrow mt-4 inline-flex min-h-tap items-center text-accent underline">
            {t("home.introLink")}
          </Link>
        </div>
      </section>

      <section>
        <Heading level="h2">{t("home.servicesHeading")}</Heading>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {services.map((key, i) => (
            <li key={key} className="rounded-card border border-border p-5">
              <p className="eyebrow text-accent">{String(i + 1).padStart(2, "0")}</p>
              <Heading level="h3" className="mt-3">
                {t(`home.services.${key}.title`)}
              </Heading>
              <p className="mt-2 text-small text-fg-muted">{t(`home.services.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <Heading level="h2">{t("home.reviewsHeading")}</Heading>
        <Carousel label={t("home.reviewsHeading")} slideClassName="basis-[85%] md:basis-[60%]" className="mt-6">
          {reviews.map((review) => (
            <figure key={review.id} className="flex h-full flex-col overflow-hidden rounded-card bg-bg-raised">
              {review.media[0] && <MediaFrame asset={review.media[0]} />}
              <div className="flex flex-1 flex-col p-5">
                <blockquote className="flex-1">{review.text}</blockquote>
                <figcaption className="eyebrow mt-4 text-fg-muted">
                  {review.author}
                  {review.country && `, ${review.country}`}
                </figcaption>
              </div>
            </figure>
          ))}
        </Carousel>
      </section>

      <section className="rounded-card bg-feature p-6 md:p-10">
        <Heading level="h2">{t("home.ctaHeading")}</Heading>
        <p className="mt-3 max-w-prose">{t("home.ctaBody")}</p>
        <Button className="mt-6 w-full md:w-auto" onClick={() => openInquiry()}>
          {t("nav.inquire")}
        </Button>
      </section>
    </div>
  );
}
